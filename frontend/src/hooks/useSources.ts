/**
 * useSources — TanStack Query hook for fetching and deleting indexed sources.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sourceService } from '../services/sourceService';

export function useSources(sessionId?: string) {
  const queryClient = useQueryClient();

  const sourcesQuery = useQuery({
    queryKey: ['sources', sessionId],
    queryFn: () => sourceService.listSources(sessionId),
    refetchInterval: 10000, // Poll every 10s to catch processing updates
    staleTime: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: (sourceId: string) => sourceService.deleteSource(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });

  return {
    sources: sourcesQuery.data || [],
    isLoading: sourcesQuery.isLoading,
    isError: sourcesQuery.isError,
    error: sourcesQuery.error,
    refetch: sourcesQuery.refetch,
    deleteSource: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
