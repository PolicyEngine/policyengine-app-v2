/**
 * SimulationViewMode - Enum for simulation creation pathway view states
 *
 * Maps to the frames in SimulationCreationFlow, PLUS inline policy and population setup.
 * Following Option A (inline sub-pathways), this enum includes ALL views for the
 * complete simulation creation experience.
 *
 * Grouped by pathway level:
 * - Simulation-level views (LABEL, SETUP, SUBMIT)
 * - Policy setup views (inline, replaces PolicyCreationFlow subflow)
 * - Population setup views (inline, replaces PopulationCreationFlow subflow)
 * - Selection views (for loading existing ingredients)
 */
export enum SimulationViewMode {
  // ========== Simulation-level views ==========
  LABEL = 'LABEL', // SimulationCreationFrame
  SETUP = 'SETUP', // SimulationSetupFrame (choose policy/population)
  SUBMIT = 'SUBMIT', // SimulationSubmitFrame

  // ========== Policy setup views (inline) ==========
  POLICY_LABEL = 'POLICY_LABEL', // PolicyCreationFrame
  POLICY_PARAMETER_SELECTOR = 'POLICY_PARAMETER_SELECTOR', // PolicyParameterSelectorFrame
  POLICY_SUBMIT = 'POLICY_SUBMIT', // PolicySubmitFrame
  SELECT_EXISTING_POLICY = 'SELECT_EXISTING_POLICY', // SimulationSelectExistingPolicyFrame

  // ========== Population setup views (inline) ==========
  POPULATION_SCOPE = 'POPULATION_SCOPE', // SelectGeographicScopeFrame
  POPULATION_LABEL = 'POPULATION_LABEL', // SetPopulationLabelFrame
  POPULATION_HOUSEHOLD_BUILDER = 'POPULATION_HOUSEHOLD_BUILDER', // HouseholdBuilderFrame
  POPULATION_GEOGRAPHIC_CONFIRM = 'POPULATION_GEOGRAPHIC_CONFIRM', // GeographicConfirmationFrame
  SELECT_EXISTING_POPULATION = 'SELECT_EXISTING_POPULATION', // SimulationSelectExistingPopulationFrame

  // ========== Setup coordination views ==========
  SETUP_POLICY = 'SETUP_POLICY', // SimulationSetupPolicyFrame (create new vs load existing choice)
  SETUP_POPULATION = 'SETUP_POPULATION', // SimulationSetupPopulationFrame (create new vs load existing choice)
}
