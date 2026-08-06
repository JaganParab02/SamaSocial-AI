/**
 * ConnectionIndicator — shows live backend connection status with accessible dot and text label.
 */
import { useQuery } from '@tanstack/react-query';
import { healthService } from '../../services/healthService';

export default function ConnectionIndicator() {
  const { data, isError } = useQuery({
    queryKey: ['health'],
    queryFn: healthService.checkHealth,
    refetchInterval: 30000,
    retry: 1,
    staleTime: 15000,
  });

  const isConnected = !isError && !!data;

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-pill)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium shrink-0"
      title={isConnected ? 'Backend API operational' : 'Attempting to reconnect to backend API'}
    >
      {isConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span>
          </span>
          <span className="text-[var(--text-primary)] tracking-wide">Connected</span>
        </>
      ) : (
        <>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--error)] animate-pulse"></span>
          <span className="text-[var(--text-secondary)] tracking-wide">Reconnecting…</span>
        </>
      )}
    </div>
  );
}
