/**
 * Hook for batch-fetching parameters by name from the API.
 *
 * Returns a Record<string, ParameterMetadata> matching the shape of the
 * old Redux state.metadata.parameters, so downstream code (ParameterTable,
 * policyTableHelpers, parameterLabels) can be used without changes.
 *
 * Automatically expands parameter names to include ancestor path segments
 * so that getHierarchicalLabels can resolve labels for intermediate nodes
 * that happen to be parameters themselves.
 *
 * Results are persisted to localStorage for cross-session reuse.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchParametersByName, V2ParameterData } from '@/api/v2';
import {
  getCachedParameters,
  setCachedParameters,
} from '@/libs/metadataCache';
import { parameterTreeKeys } from '@/libs/queryKeys';
import { ParameterMetadata } from '@/types/metadata';

/**
 * Convert a V2ParameterData (from the by-name endpoint) to ParameterMetadata.
 */
function toParameterMetadata(p: V2ParameterData): ParameterMetadata {
  return {
    id: p.id,
    name: p.name,
    label: p.label ?? p.name,
    description: p.description,
    unit: p.unit,
    data_type: p.data_type ?? undefined,
    tax_benefit_model_version_id: p.tax_benefit_model_version_id,
    created_at: p.created_at,
    parameter: p.name,
    type: 'parameter',
    values: {},
  };
}

/**
 * Expand parameter names to include all ancestor path segments.
 *
 * For "gov.irs.credits.eitc.max[0].rate" this produces:
 *   ["gov.irs", "gov.irs.credits", "gov.irs.credits.eitc",
 *    "gov.irs.credits.eitc.max[0]", "gov.irs.credits.eitc.max[0].rate"]
 *
 * The API returns only names that match actual parameters in the database,
 * so non-parameter nodes are silently skipped.
 */
function expandWithAncestors(names: string[]): string[] {
  const expanded = new Set<string>();
  for (const name of names) {
    const parts = name.split('.');
    // Start from index 1 to skip the bare "gov" prefix
    for (let i = 2; i <= parts.length; i++) {
      expanded.add(parts.slice(0, i).join('.'));
    }
  }
  return Array.from(expanded);
}

export interface UseParametersByNameResult {
  parameters: Record<string, ParameterMetadata>;
  isLoading: boolean;
  error: Error | null;
}

export function useParametersByName(
  names: string[],
  countryId: string,
  enabled: boolean = true,
): UseParametersByNameResult {
  const expandedNames = useMemo(() => expandWithAncestors(names), [names]);

  const query = useQuery({
    queryKey: parameterTreeKeys.byName(countryId, expandedNames),
    queryFn: async () => {
      const data = await fetchParametersByName(expandedNames, countryId);
      const record: Record<string, ParameterMetadata> = {};
      for (const p of data) {
        record[p.name] = toParameterMetadata(p);
      }
      setCachedParameters(countryId, record);
      return record;
    },
    initialData: () => getCachedParameters(countryId, expandedNames) ?? undefined,
    enabled: enabled && !!countryId && expandedNames.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    parameters: query.data ?? {},
    isLoading: query.isLoading,
    error: query.error,
  };
}
