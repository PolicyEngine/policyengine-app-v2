/**
 * StandalonePopulationViewMode - Enum for standalone household creation pathway view states
 *
 * This is used by the standalone PopulationPathwayWrapper.
 * For population modes used within composite pathways (Report, Simulation),
 * see PopulationViewMode in SharedViewModes.ts
 *
 * Two-step flow:
 * - LABEL: Name the household
 * - HOUSEHOLD_BUILDER: Configure household members
 */
export enum StandalonePopulationViewMode {
  LABEL = 'LABEL',
  HOUSEHOLD_BUILDER = 'HOUSEHOLD_BUILDER',
}
