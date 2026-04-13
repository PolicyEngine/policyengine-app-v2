export type PopulationLaunchPrefill = 'household' | null;

/**
 * Parse standalone population launch parameters from the current query string.
 * We support both `scope=household` and `scope=custom-household` for shareable
 * links and future routing cleanup.
 */
export function getPopulationLaunchPrefill(search: string): PopulationLaunchPrefill {
  const params = new URLSearchParams(search);
  const scope = params.get('scope');

  if (scope === 'household' || scope === 'custom-household') {
    return 'household';
  }

  return null;
}
