/**
 * usePlanner — specialized chat hook that intercepts SSE 'plan_update' events 
 * to sync the local CoursePlan state.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerService } from '../services/plannerService';
import { conversationService } from '../services/conversationService';
import { API_BASE_URL } from '../services/apiClient';
import type { ChatMessageUI, CoursePlan, ChatRequest } from '../types/api';

export function usePlanner(sessionId: string) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(sessionId);

  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  // Restore planner chat history
  useEffect(() => {
    let cancelled = false;
    const loadConversation = async () => {
      setIsLoadingHistory(true);
      setMessages([]);
      setConversationId(null);
      try {
        const conversation = await conversationService.getBySessionId(sessionId);
        if (cancelled) return;
        if (conversation) {
          setConversationId(conversation.id);
          if (conversation.course_plan) {
            queryClient.setQueryData(['coursePlan', sessionId], conversation.course_plan);
          }
          const savedMessages = await conversationService.loadMessages(conversation.id);
          if (cancelled) return;
          if (savedMessages.length > 0) setMessages(savedMessages);
        }
      } catch (err) {
        console.error('[usePlanner] Failed to load history:', err);
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    };
    loadConversation();
    return () => { cancelled = true; };
  }, [sessionId]);

  const ensureConversation = useCallback(async (firstMsg?: string) => {
    if (conversationId) return conversationId;
    try {
      const existing = await conversationService.getBySessionId(sessionRef.current);
      if (existing) {
        setConversationId(existing.id);
        return existing.id;
      }
      const title = firstMsg ? conversationService.generateTitle(firstMsg) : 'New Planner';
      const created = await conversationService.createConversation(sessionRef.current, 'planner', title);
      if (created) {
        setConversationId(created.id);
        return created.id;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  }, [conversationId]);

  const persistMessage = useCallback(async (convId: string, message: ChatMessageUI) => {
    try {
      await conversationService.saveMessage(convId, message);
      const allMessages = await conversationService.loadMessages(convId);
      await conversationService.updateConversation(sessionRef.current, {
        message_count: allMessages.length,
        last_message_preview: message.content.substring(0, 100),
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch initial plan
  const { data: coursePlan, isLoading: isPlanLoading } = useQuery({
    queryKey: ['coursePlan', sessionId],
    queryFn: async () => {
      // Prioritize persistent database state
      const conversation = await conversationService.getBySessionId(sessionId);
      if (conversation?.course_plan) {
        return conversation.course_plan;
      }
      // Fallback to backend in-memory state
      return plannerService.getCoursePlan(sessionId);
    },
  });

  // Manual save mutation
  const savePlanMutation = useMutation({
    mutationFn: (newPlan: CoursePlan) => plannerService.updateCoursePlan(sessionId, newPlan),
    onSuccess: (updated) => {
      queryClient.setQueryData(['coursePlan', sessionId], updated);
      conversationService.updateConversation(sessionId, { course_plan: updated });
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
        const isFirstMessage = messages.length === 0;
        ensureConversation(isFirstMessage ? question.trim() : undefined).then((convId) => {
          if (convId) persistMessage(convId, userMsg);
        });

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
                  ensureConversation().then((convId) => {
                    if (convId) conversationService.updateConversation(sessionId, { course_plan: parsed.data });
                  });
                } else if (parsed.event === 'done') {
                  updateLastAssistant((prev) => {
                    const finishedMsg = { ...prev, isStreaming: false };
                    if (conversationId || sessionRef.current) {
                      ensureConversation().then((convId) => {
                        if (convId) persistMessage(convId, finishedMsg);
                      });
                    }
                    return finishedMsg;
                  });
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
    [sessionId, isStreaming, messages.length, conversationId, addMessage, updateLastAssistant, ensureConversation, persistMessage, queryClient]
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
    savePlan: (newPlan: CoursePlan) => savePlanMutation.mutate(newPlan),
    isSaving: savePlanMutation.isPending,
    isLoadingHistory,
  };
}
