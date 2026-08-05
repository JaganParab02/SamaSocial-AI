/**
 * Streaming service — Fetch-based SSE reader for chat streaming.
 * Uses the Fetch API ReadableStream instead of EventSource to support POST requests.
 */
import { API_BASE_URL } from './apiClient';
import type { ChatRequest, Citation } from '../types/api';

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onCitations: (citations: Citation[]) => void;
  onDone: (data: Record<string, unknown>) => void;
  onError: (error: string) => void;
}

/**
 * Stream a chat response via fetch + ReadableStream.
 * Returns an AbortController so the caller can cancel.
 */
export function streamChat(
  request: ChatRequest,
  callbacks: StreamCallbacks
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        callbacks.onError(errorText || `HTTP ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError('No response body');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines from the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep incomplete last line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          let dataStr = trimmed.slice(5).trim();
          while (dataStr.startsWith('data:')) {
            dataStr = dataStr.slice(5).trim();
          }
          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);
            switch (parsed.event) {
              case 'token':
                callbacks.onToken(parsed.data || '');
                break;
              case 'citations': {
                let citationsData = parsed.data || [];
                if (typeof citationsData === 'string') {
                  try {
                    citationsData = JSON.parse(citationsData);
                  } catch (e) {
                    console.warn('Failed to parse citations JSON string:', e);
                    citationsData = [];
                  }
                }
                callbacks.onCitations(Array.isArray(citationsData) ? citationsData : []);
                break;
              }
              case 'done':
                callbacks.onDone(parsed.data || {});
                break;
              case 'error':
                callbacks.onError(parsed.data || 'Unknown streaming error');
                break;
            }
          } catch (err) {
            console.warn('Skipping non-JSON SSE chunk:', dataStr, err);
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        callbacks.onError(err.message || 'Stream connection failed');
      }
    }
  })();

  return controller;
}
