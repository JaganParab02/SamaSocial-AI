/**
 * useUpload — manages file/URL/YouTube upload lifecycle.
 */
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadService } from '../services/uploadService';
import type { UploadItem } from '../types/api';

export function useUpload(sessionId: string) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const queryClient = useQueryClient();

  const updateUpload = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      const id = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const item: UploadItem = { id, file, type: 'file', status: 'uploading', progress: 0 };
      setUploads((prev) => [...prev, item]);

      try {
        const result = await uploadService.uploadFile(file, sessionId, (progress) => {
          updateUpload(id, { progress, status: progress < 100 ? 'uploading' : 'processing' });
        });
        updateUpload(id, { status: 'success', progress: 100, result });
        queryClient.invalidateQueries({ queryKey: ['sources'] });
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        updateUpload(id, { status: 'error', error: message });
        throw err;
      }
    },
    [sessionId, queryClient, updateUpload]
  );

  const uploadUrl = useCallback(
    async (url: string) => {
      const id = `upload-${Date.now()}`;
      const item: UploadItem = { id, url, type: 'url', status: 'uploading', progress: 30 };
      setUploads((prev) => [...prev, item]);

      try {
        updateUpload(id, { status: 'processing', progress: 60 });
        const result = await uploadService.uploadUrl(url, sessionId);
        updateUpload(id, { status: 'success', progress: 100, result });
        queryClient.invalidateQueries({ queryKey: ['sources'] });
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'URL upload failed';
        updateUpload(id, { status: 'error', error: message });
        throw err;
      }
    },
    [sessionId, queryClient, updateUpload]
  );

  const uploadYoutube = useCallback(
    async (urlOrId: string) => {
      const id = `upload-${Date.now()}`;
      const item: UploadItem = { id, url: urlOrId, type: 'youtube', status: 'uploading', progress: 30 };
      setUploads((prev) => [...prev, item]);

      try {
        updateUpload(id, { status: 'processing', progress: 60 });
        const result = await uploadService.uploadYoutube(urlOrId, sessionId);
        updateUpload(id, { status: 'success', progress: 100, result });
        queryClient.invalidateQueries({ queryKey: ['sources'] });
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'YouTube upload failed';
        updateUpload(id, { status: 'error', error: message });
        throw err;
      }
    },
    [sessionId, queryClient, updateUpload]
  );

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status !== 'success' && u.status !== 'error'));
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const retryUpload = useCallback((id: string) => {
    setUploads((prev) => {
      const item = prev.find((u) => u.id === id);
      if (!item) return prev;
      setTimeout(() => {
        removeUpload(id);
        if (item.type === 'file' && item.file) uploadFile(item.file);
        else if (item.type === 'url' && item.url) uploadUrl(item.url);
        else if (item.type === 'youtube' && item.url) uploadYoutube(item.url);
      }, 0);
      return prev;
    });
  }, [removeUpload, uploadFile, uploadUrl, uploadYoutube]);

  return {
    uploads,
    uploadFile,
    uploadUrl,
    uploadYoutube,
    removeUpload,
    retryUpload,
    clearCompleted,
    isUploading: uploads.some((u) => u.status === 'uploading' || u.status === 'processing'),
  };
}
