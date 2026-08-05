/**
 * useChat — manages the complete chat lifecycle including streaming.
 */
import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../services/streamService';
import { chatService } from '../services/chatService';
import type { ChatMessageUI, Citation } from '../types/api';

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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
    (question: string) => {
      if (!question.trim() || isStreaming) return;

      // Add user message
      const userMsg: ChatMessageUI = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: question.trim(),
        timestamp: new Date(),
      };
      addMessage(userMsg);

      // Add empty assistant message for streaming
      const assistantMsg: ChatMessageUI = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: '',
        isStreaming: true,
        timestamp: new Date(),
      };
      addMessage(assistantMsg);

      setIsStreaming(true);

      const controller = streamChat(
        { session_id: sessionId, question: question.trim() },
        {
          onToken: (token) => {
            updateLastAssistant((prev) => ({
              ...prev,
              content: prev.content + token,
            }));
          },
          onCitations: (citations: Citation[] | unknown) => {
            const validCitations = Array.isArray(citations) ? (citations as Citation[]) : [];
            updateLastAssistant((prev) => ({
              ...prev,
              citations: validCitations,
            }));
          },
          onDone: () => {
            updateLastAssistant((prev) => ({
              ...prev,
              isStreaming: false,
            }));
            setIsStreaming(false);
            abortRef.current = null;
          },
          onError: (error) => {
            updateLastAssistant((prev) => ({
              ...prev,
              content: prev.content || `Sorry, an error occurred: ${error}`,
              isStreaming: false,
              isError: true,
            }));
            setIsStreaming(false);
            abortRef.current = null;
          },
        }
      );

      abortRef.current = controller;
    },
    [sessionId, isStreaming, addMessage, updateLastAssistant]
  );

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      updateLastAssistant((prev) => ({
        ...prev,
        isStreaming: false,
      }));
      setIsStreaming(false);
    }
  }, [updateLastAssistant]);

  const clearChat = useCallback(async () => {
    stopStreaming();
    setMessages([]);
    try {
      await chatService.clearHistory(sessionId);
    } catch {
      // silently ignore clear errors
    }
  }, [sessionId, stopStreaming]);

  const retryLast = useCallback(() => {
    if (messages.length < 2) return;
    // Find last user message
    let lastUserMsg: ChatMessageUI | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsg = messages[i];
        break;
      }
    }
    if (!lastUserMsg) return;

    // Remove last assistant message
    setMessages((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === 'assistant') {
          copy.splice(i, 1);
          break;
        }
      }
      return copy;
    });

    // Re-send
    // Need to trigger manually since sendMessage adds user msg again
    // So we remove the user message too and re-send
    const question = lastUserMsg.content;
    setMessages((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === 'user') {
          copy.splice(i, 1);
          break;
        }
      }
      return copy;
    });

    sendMessage(question);
  }, [messages, sendMessage]);

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    clearChat,
    retryLast,
    setMessages,
  };
}
