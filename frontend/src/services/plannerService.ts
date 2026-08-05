/**
 * Planner API service — saving and loading course plans.
 */
import apiClient from './apiClient';
import type { CoursePlan } from '../types/api';

export const plannerService = {
  /** Get the current course plan for a session */
  getCoursePlan: async (sessionId: string): Promise<CoursePlan> => {
    const { data } = await apiClient.get<CoursePlan>(`/planner/${sessionId}`);
    return data;
  },

  /** Update the course plan manually */
  updateCoursePlan: async (sessionId: string, coursePlan: CoursePlan): Promise<CoursePlan> => {
    const { data } = await apiClient.put<CoursePlan>('/planner/course', {
      session_id: sessionId,
      course_plan: coursePlan
    });
    return data;
  },

  /** Export course plan as JSON string */
  exportCoursePlan: async (sessionId: string): Promise<string> => {
    const { data } = await apiClient.post<CoursePlan>('/planner/export/json', {
      session_id: sessionId
    });
    return JSON.stringify(data, null, 2);
  },

  /** Export course plan as Markdown string */
  exportCoursePlanMarkdown: async (sessionId: string): Promise<string> => {
    const { data } = await apiClient.post<string>('/planner/export/markdown', {
      session_id: sessionId
    }, { responseType: 'text' });
    return data;
  },

  /** Export course plan as PDF binary blob */
  exportCoursePlanPDF: async (sessionId: string): Promise<Blob> => {
    const { data } = await apiClient.post<Blob>('/planner/export/pdf', {
      session_id: sessionId
    }, { responseType: 'blob' });
    return data;
  }
};
