/**
 * conversationService — Supabase CRUD operations for persistent chat memory.
 * Handles conversations, messages, and auto-title generation.
 */
import { supabase } from '../lib/supabaseClient';
import type { ChatMessageUI, Citation } from '../types/api';

// ─── Types ─────────────────────────────────────────────────────────────

export interface ConversationRecord {
  id: string;
  session_id: string;
  title: string;
  mode: 'learning' | 'planner';
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview: string | null;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[] | null;
  attachments: { name: string; type: string }[] | null;
  created_at: string;
}

// ─── Service ───────────────────────────────────────────────────────────

export const conversationService = {
  /**
   * List all conversations, most recent first.
   */
  async listConversations(): Promise<ConversationRecord[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[ConversationService] listConversations error:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Get a conversation by session_id.
   */
  async getBySessionId(sessionId: string): Promise<ConversationRecord | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('[ConversationService] getBySessionId error:', error);
      return null;
    }
    return data;
  },

  /**
   * Create a new conversation record.
   */
  async createConversation(
    sessionId: string,
    mode: 'learning' | 'planner' = 'learning',
    title?: string
  ): Promise<ConversationRecord | null> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        session_id: sessionId,
        mode,
        title: title || 'New conversation',
      })
      .select()
      .single();

    if (error) {
      console.error('[ConversationService] createConversation error:', error);
      return null;
    }
    return data;
  },

  /**
   * Update conversation metadata (title, preview, count).
   */
  async updateConversation(
    sessionId: string,
    patch: Partial<Pick<ConversationRecord, 'title' | 'last_message_preview' | 'message_count'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update(patch)
      .eq('session_id', sessionId);

    if (error) {
      console.error('[ConversationService] updateConversation error:', error);
    }
  },

  /**
   * Delete a conversation and cascade-delete all messages.
   */
  async deleteConversation(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('[ConversationService] deleteConversation error:', error);
    }
  },

  /**
   * Save a single message to Supabase.
   */
  async saveMessage(
    conversationId: string,
    message: ChatMessageUI
  ): Promise<void> {
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      citations: message.citations || null,
      attachments: message.attachments || null,
    });

    if (error) {
      console.error('[ConversationService] saveMessage error:', error);
    }
  },

  /**
   * Load all messages for a conversation, ordered by creation time.
   */
  async loadMessages(conversationId: string): Promise<ChatMessageUI[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[ConversationService] loadMessages error:', error);
      return [];
    }

    return (data || []).map((row: MessageRecord) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      citations: row.citations || undefined,
      attachments: row.attachments || undefined,
      isStreaming: false,
      timestamp: new Date(row.created_at),
    }));
  },

  /**
   * Generate a short title from the first user message.
   */
  generateTitle(firstMessage: string): string {
    const cleaned = firstMessage.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 50) return cleaned;
    return cleaned.substring(0, 47) + '…';
  },
};
