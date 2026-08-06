/**
 * useChat — manages the complete chat lifecycle including streaming and Supabase persistence.
 * Messages are saved to Supabase after each exchange, and restored on session load.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { streamChat } from '../services/streamService';
import { chatService } from '../services/chatService';
import { conversationService } from '../services/conversationService';
import type { ChatMessageUI, Citation } from '../types/api';

export function useChat(sessionId: string, mode: 'learning' | 'planner' = 'learning') {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(sessionId);

  // Track current session to avoid stale closures
  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  // ─── Restore messages from Supabase on session change ────────────────
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
          const savedMessages = await conversationService.loadMessages(conversation.id);
          if (cancelled) return;
          if (savedMessages.length > 0) {
            setMessages(savedMessages);
          }
        }
      } catch (err) {
        console.error('[useChat] Failed to load conversation:', err);
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    };

    loadConversation();
    return () => { cancelled = true; };
  }, [sessionId]);

  // ─── Ensure a conversation record exists in Supabase ─────────────────
  const ensureConversation = useCallback(async (firstMessageContent?: string): Promise<string | null> => {
    if (conversationId) return conversationId;

    try {
      const existing = await conversationService.getBySessionId(sessionRef.current);
      if (existing) {
        setConversationId(existing.id);
        return existing.id;
      }

      const title = firstMessageContent
        ? conversationService.generateTitle(firstMessageContent)
        : 'New conversation';

      const created = await conversationService.createConversation(
        sessionRef.current,
        mode,
        title
      );
      if (created) {
        setConversationId(created.id);
        return created.id;
      }
    } catch (err) {
      console.error('[useChat] ensureConversation error:', err);
    }
    return null;
  }, [conversationId, mode]);

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

  // ─── Persist a message to Supabase (fire-and-forget) ─────────────────
  const persistMessage = useCallback(async (convId: string, message: ChatMessageUI) => {
    try {
      await conversationService.saveMessage(convId, message);

      // Update conversation metadata
      const allMessages = await conversationService.loadMessages(convId);
      await conversationService.updateConversation(sessionRef.current, {
        message_count: allMessages.length,
        last_message_preview: message.content.substring(0, 100),
      });
    } catch (err) {
      console.error('[useChat] persistMessage error:', err);
    }
  }, []);

  const sendMessage = useCallback(
    (question: string, attachments?: { name: string; type: string }[]) => {
      if (!question.trim() || isStreaming) return;

      // Add user message
      const userMsg: ChatMessageUI = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: question.trim(),
        attachments,
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

      // Persist user message to Supabase (async, non-blocking)
      const isFirstMessage = messages.length === 0;
      ensureConversation(isFirstMessage ? question.trim() : undefined).then((convId) => {
        if (convId) {
          persistMessage(convId, userMsg);
        }
      });

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
            updateLastAssistant((prev) => {
              const finishedMsg = { ...prev, isStreaming: false };
              // Persist the completed assistant message
              if (conversationId || sessionRef.current) {
                ensureConversation().then((convId) => {
                  if (convId) {
                    persistMessage(convId, finishedMsg);
                  }
                });
              }
              return finishedMsg;
            });
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
    [sessionId, isStreaming, messages.length, addMessage, updateLastAssistant, ensureConversation, persistMessage, conversationId]
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
      // Also delete from Supabase
      await conversationService.deleteConversation(sessionId);
      setConversationId(null);
    } catch {
      // silently ignore clear errors
    }
  }, [sessionId, stopStreaming]);

  const retryLast = useCallback(() => {
    if (messages.length < 2) return;
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
    isLoadingHistory,
    conversationId,
    sendMessage,
    stopStreaming,
    clearChat,
    retryLast,
    setMessages,
  };
}
