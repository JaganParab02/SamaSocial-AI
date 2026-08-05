/**
 * useSession — manages session ID lifecycle with localStorage persistence.
 */
import { useState, useCallback } from 'react';

const SESSION_KEY = 'sama_session_id';

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useSession() {
  const [sessionId, setSessionId] = useState<string>(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return stored;
    const newId = generateSessionId();
    localStorage.setItem(SESSION_KEY, newId);
    return newId;
  });

  const createNewSession = useCallback(() => {
    const newId = generateSessionId();
    localStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
    return newId;
  }, []);

  const restoreSession = useCallback((id: string) => {
    localStorage.setItem(SESSION_KEY, id);
    setSessionId(id);
  }, []);

  return { sessionId, createNewSession, restoreSession };
}
