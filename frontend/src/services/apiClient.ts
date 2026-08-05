/**
 * Centralized Axios instance with base URL, timeouts, and error interceptors.
 * All API services import this single client.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for large file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with an error status
      const message = error.response.data?.detail || error.response.data?.message || 'An unexpected error occurred.';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response received
      return Promise.reject(new Error('Backend is unreachable. Please check your connection.'));
    }
    return Promise.reject(error);
  }
);

export { API_BASE_URL };
export default apiClient;
