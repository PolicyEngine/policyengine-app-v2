/**
 * PopulationViewMode - Enum for population creation pathway view states
 *
 * Maps to the frames in PopulationCreationFlow:
 * - SCOPE: SelectGeographicScopeFrame (choose household vs geographic scope)
 * - LABEL: SetPopulationLabelFrame (enter population name)
 * - HOUSEHOLD_BUILDER: HouseholdBuilderFrame (configure household members)
 * - GEOGRAPHIC_CONFIRM: GeographicConfirmationFrame (confirm geographic population)
 */
export enum PopulationViewMode {
  SCOPE = 'SCOPE',
  LABEL = 'LABEL',
  HOUSEHOLD_BUILDER = 'HOUSEHOLD_BUILDER',
  GEOGRAPHIC_CONFIRM = 'GEOGRAPHIC_CONFIRM',
}
