/**
 * Hook for fetching parameter tree children from the API.
 *
 * Each call fetches one level of the parameter tree on demand.
 * Results are cached by TanStack Query for the session and
 * persisted to localStorage for cross-session reuse.
 *
 * @example
 * ```tsx
 * const { children, isLoading } = useParameterChildren('gov', countryId);
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { fetchParameterChildren, ParameterChildNode } from '@/api/v2';
import { getCachedParameterChildren, setCachedParameterChildren } from '@/libs/metadataCache';
import { parameterTreeKeys } from '@/libs/queryKeys';

export interface UseParameterChildrenResult {
  children: ParameterChildNode[];
  isLoading: boolean;
  error: Error | null;
}

export function useParameterChildren(
  parentPath: string,
  countryId: string,
  enabled: boolean = true
): UseParameterChildrenResult {
  const query = useQuery({
    queryKey: parameterTreeKeys.children(countryId, parentPath),
    queryFn: async () => {
      const data = await fetchParameterChildren(parentPath, countryId);
      setCachedParameterChildren(countryId, parentPath, data);
      return data;
    },
    initialData: () => getCachedParameterChildren(countryId, parentPath) ?? undefined,
    enabled: enabled && !!countryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    children: query.data?.children ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
