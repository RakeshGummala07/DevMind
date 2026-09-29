import { useQuery } from '@tanstack/react-query';
import { getRepository } from './repositoriesApi.js';

/**
 * One shared query for a single repository (same key + polling behaviour the
 * detail page always used). While the repo is INDEXING it polls every 3s so
 * the status flips to COMPLETED/FAILED without a manual refresh.
 */
export function useRepository(id) {
  return useQuery({
    queryKey: ['repositories', id],
    queryFn: () => getRepository(id),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data?.indexingStatus === 'INDEXING' ? 3000 : false),
  });
}
