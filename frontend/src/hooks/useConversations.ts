/**
 * useConversations — manages the conversation list from Supabase for the sidebar.
 */
import { useState, useEffect, useCallback } from 'react';
import { conversationService, type ConversationRecord } from '../services/conversationService';

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await conversationService.listConversations();
      setConversations(data);
    } catch (err) {
      console.error('[useConversations] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const deleteConversation = useCallback(async (sessionId: string) => {
    await conversationService.deleteConversation(sessionId);
    setConversations((prev) => prev.filter((c) => c.session_id !== sessionId));
  }, []);

  return {
    conversations,
    isLoading,
    refetch: fetchConversations,
    deleteConversation,
  };
}
