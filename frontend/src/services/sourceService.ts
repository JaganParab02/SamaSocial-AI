/**
 * Source management API service.
 */
import apiClient from './apiClient';
import type { SourceResponse } from '../types/api';

export const sourceService = {
  /** List all indexed sources, optionally filtered by session */
  listSources: async (sessionId?: string): Promise<SourceResponse[]> => {
    const params = sessionId ? { session_id: sessionId } : {};
    const { data } = await apiClient.get<SourceResponse[]>('/sources', { params });
    return data;
  },

  /** Delete a source and purge its vectors */
  deleteSource: async (sourceId: string): Promise<void> => {
    await apiClient.delete(`/sources/${sourceId}`);
  },
};
