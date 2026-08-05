/**
 * Health check API service.
 */
import apiClient from './apiClient';
import type { HealthResponse } from '../types/api';

const HEALTH_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')
  : 'http://localhost:8000';

export const healthService = {
  /** Check overall system health */
  checkHealth: async (): Promise<HealthResponse> => {
    const { data } = await apiClient.get<HealthResponse>('/health', {
      baseURL: HEALTH_BASE,
    });
    return data;
  },
};
