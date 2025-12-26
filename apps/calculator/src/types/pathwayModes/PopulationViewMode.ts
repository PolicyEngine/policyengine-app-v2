/**
 * StandalonePopulationViewMode - Enum for standalone population creation pathway view states
 *
 * This is used by the standalone PopulationPathwayWrapper.
 * For population modes used within composite pathways (Report, Simulation),
 * see PopulationViewMode in SharedViewModes.ts
 *
 * Maps to the frames in PopulationCreationFlow:
 * - SCOPE: SelectGeographicScopeFrame (choose household vs geographic scope)
 * - LABEL: SetPopulationLabelFrame (enter population name)
 * - HOUSEHOLD_BUILDER: HouseholdBuilderFrame (configure household members)
 * - GEOGRAPHIC_CONFIRM: GeographicConfirmationFrame (confirm geographic population)
 */
export enum StandalonePopulationViewMode {
  SCOPE = 'SCOPE',
  LABEL = 'LABEL',
  HOUSEHOLD_BUILDER = 'HOUSEHOLD_BUILDER',
  GEOGRAPHIC_CONFIRM = 'GEOGRAPHIC_CONFIRM',
}
