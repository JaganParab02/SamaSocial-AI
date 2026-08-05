/**
 * Chat API service — sync chat, history, clear, reset.
 * Streaming is handled separately via streamService.
 */
import apiClient from './apiClient';
import type { ChatRequest, ChatResponse, ConversationHistory } from '../types/api';

export const chatService = {
  /** Send a synchronous chat message */
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>('/chat', request);
    return data;
  },

  /** Get conversation history for a session */
  getHistory: async (sessionId: string): Promise<ConversationHistory> => {
    const { data } = await apiClient.get<ConversationHistory>(`/chat/history/${sessionId}`);
    return data;
  },

  /** Clear conversation history */
  clearHistory: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/chat/history/${sessionId}`);
  },

  /** Reset session (clears messages, preserves sources) */
  resetSession: async (sessionId: string): Promise<void> => {
    await apiClient.post('/chat/reset', { session_id: sessionId });
  },
};
