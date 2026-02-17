import { EnhancedUserSimulation } from '@/hooks/useUserSimulations';

/**
 * Checks if a simulation matches the default baseline criteria:
 * - Uses current law (no policy modifications)
 * - Uses nationwide geographic population
 * - Has the expected default baseline label
 *
 * In V2 API, current law is represented by policyId = null.
 */
export function isDefaultBaselineSimulation(
  simulation: EnhancedUserSimulation,
  countryId: string,
  _currentLawId: null
): boolean {
  // Check policy is current law (null in V2 API)
  const isCurrentLaw = simulation.simulation?.policyId === null;

  // Check population is nationwide geography (populationId === countryId for national)
  const isNationwideGeography =
    simulation.simulation?.populationType === 'geography' &&
    simulation.simulation?.populationId === countryId;

  // Check label matches expected default baseline label
  const expectedLabel = getDefaultBaselineLabel(countryId);
  const hasMatchingLabel = simulation.userSimulation?.label === expectedLabel;

  return isCurrentLaw && isNationwideGeography && hasMatchingLabel;
}

/**
 * Country name mapping for display purposes
 */
export const countryNames: Record<string, string> = {
  us: 'United States',
  uk: 'United Kingdom',
  ca: 'Canada',
  ng: 'Nigeria',
  il: 'Israel',
};

/**
 * Get the label for a default baseline simulation
 */
export function getDefaultBaselineLabel(countryId: string): string {
  const countryName = countryNames[countryId] || countryId.toUpperCase();
  return `${countryName} current law for all households nationwide`;
}
