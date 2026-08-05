/**
 * ConnectionIndicator — shows live backend connection status with pulsing SaaS badge.
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
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1A2234] border border-slate-700/60 shadow-sm text-xs font-medium">
      {isConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-200 tracking-wide">Connected</span>
        </>
      ) : (
        <>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 animate-pulse"></span>
          <span className="text-red-400 tracking-wide">Disconnected</span>
        </>
      )}
    </div>
  );
}
