/**
 * Upload API service — file, URL, and YouTube uploads.
 */
import apiClient from './apiClient';
import type { UploadResponse } from '../types/api';

export const uploadService = {
  /** Upload a binary file (PDF, PPT, PPTX) */
  uploadFile: async (
    file: File,
    sessionId: string,
    onProgress?: (percent: number) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);

    const { data } = await apiClient.post<UploadResponse>('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return data;
  },

  /** Upload a web URL for scraping */
  uploadUrl: async (url: string, sessionId: string): Promise<UploadResponse> => {
    const { data } = await apiClient.post<UploadResponse>('/upload/url', {
      url,
      session_id: sessionId,
    });
    return data;
  },

  /** Upload a YouTube video for transcript extraction */
  uploadYoutube: async (urlOrId: string, sessionId: string): Promise<UploadResponse> => {
    const { data } = await apiClient.post<UploadResponse>('/upload/youtube', {
      url_or_video_id: urlOrId,
      language: 'en',
      session_id: sessionId,
    });
    return data;
  },
};
