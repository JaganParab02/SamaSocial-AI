/**
 * usePlanner — specialized chat hook that intercepts SSE 'plan_update' events 
 * to sync the local CoursePlan state.
 */
import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerService } from '../services/plannerService';
import { API_BASE_URL } from '../services/apiClient';
import type { ChatMessageUI, CoursePlan, ChatRequest } from '../types/api';

export function usePlanner(sessionId: string) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch initial plan
  const { data: coursePlan, isLoading: isPlanLoading } = useQuery({
    queryKey: ['coursePlan', sessionId],
    queryFn: () => plannerService.getCoursePlan(sessionId),
  });

  // Manual save mutation
  const savePlanMutation = useMutation({
    mutationFn: (newPlan: CoursePlan) => plannerService.updateCoursePlan(sessionId, newPlan),
    onSuccess: (updated) => {
      queryClient.setQueryData(['coursePlan', sessionId], updated);
    },
  });

  const addMessage = useCallback((msg: ChatMessageUI) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateLastAssistant = useCallback((updater: (prev: ChatMessageUI) => ChatMessageUI) => {
    setMessages((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === 'assistant') {
          copy[i] = updater(copy[i]);
          break;
        }
      }
      return copy;
    });
  }, []);

  const sendMessage = useCallback(
    (question: string, attachments?: { name: string; type: string }[]) => {
      if (!question.trim() || isStreaming) return;

      const userMsg: ChatMessageUI = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: question.trim(),
        attachments,
        timestamp: new Date(),
      };
      addMessage(userMsg);

      const assistantMsg: ChatMessageUI = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: '',
        isStreaming: true,
        timestamp: new Date(),
      };
      addMessage(assistantMsg);

      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      (async () => {
        try {
          const request: ChatRequest = { session_id: sessionId, question: question.trim() };
          const response = await fetch(`${API_BASE_URL}/planner/chat/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
            signal: controller.signal,
          });

          if (!response.ok) throw new Error('Stream failed');

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No stream body');

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const dataStr = trimmed.slice(5).trim();
              if (!dataStr) continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.event === 'token') {
                  updateLastAssistant((prev) => ({
                    ...prev,
                    content: prev.content + (parsed.data || ''),
                  }));
                } else if (parsed.event === 'plan_update') {
                  // The backend emitted the new JSON plan!
                  queryClient.setQueryData(['coursePlan', sessionId], parsed.data);
                } else if (parsed.event === 'done') {
                  updateLastAssistant((prev) => ({ ...prev, isStreaming: false }));
                  setIsStreaming(false);
                  abortRef.current = null;
                } else if (parsed.event === 'error') {
                  updateLastAssistant((prev) => ({
                    ...prev,
                    content: prev.content || `Error: ${parsed.data}`,
                    isError: true,
                    isStreaming: false,
                  }));
                  setIsStreaming(false);
                }
              } catch (e) {
                // Ignore parse errors on partial chunks if any
              }
            }
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== 'AbortError') {
            updateLastAssistant((prev) => ({
              ...prev,
              content: prev.content || 'Stream failed.',
              isError: true,
              isStreaming: false,
            }));
            setIsStreaming(false);
          }
        }
      })();
    },
    [sessionId, isStreaming, addMessage, updateLastAssistant, queryClient]
  );

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      updateLastAssistant((prev) => ({ ...prev, isStreaming: false }));
      setIsStreaming(false);
    }
  }, [updateLastAssistant]);

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    coursePlan,
    isPlanLoading,
    savePlan: savePlanMutation.mutate,
    isSaving: savePlanMutation.isPending,
  };
}
