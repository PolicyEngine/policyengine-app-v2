/**
 * ReportViewMode - Enum for report creation pathway view states
 *
 * Maps to the frames in ReportCreationFlow, PLUS inline simulation/policy/population setup.
 * Following Option A (inline sub-pathways), this enum includes ALL views for the
 * complete report creation experience.
 *
 * Grouped by pathway level:
 * - Report-level views (LABEL, SETUP, SUBMIT)
 * - Simulation setup views (inline, replaces SimulationCreationFlow subflow)
 * - Policy setup views (inline, nested within simulation setup)
 * - Population setup views (inline, nested within simulation setup)
 * - Selection views (for loading existing ingredients)
 *
 * Note: This enum is large (~20+ modes) which is acceptable per the plan's Option A.
 */
export enum ReportViewMode {
  // ========== Report-level views ==========
  REPORT_LABEL = 'REPORT_LABEL', // ReportCreationFrame
  REPORT_SETUP = 'REPORT_SETUP', // ReportSetupFrame (shows two simulation cards)
  REPORT_SUBMIT = 'REPORT_SUBMIT', // ReportSubmitFrame

  // ========== Simulation selection/creation views ==========
  REPORT_SELECT_SIMULATION = 'REPORT_SELECT_SIMULATION', // ReportSelectSimulationFrame (create new vs load existing)
  REPORT_SELECT_EXISTING_SIMULATION = 'REPORT_SELECT_EXISTING_SIMULATION', // ReportSelectExistingSimulationFrame

  // ========== Simulation setup views (inline) ==========
  SIMULATION_LABEL = 'SIMULATION_LABEL', // SimulationCreationFrame
  SIMULATION_SETUP = 'SIMULATION_SETUP', // SimulationSetupFrame (choose policy/population)
  SIMULATION_SUBMIT = 'SIMULATION_SUBMIT', // SimulationSubmitFrame

  // ========== Policy setup views (inline, nested in simulation) ==========
  POLICY_LABEL = 'POLICY_LABEL', // PolicyCreationFrame
  POLICY_PARAMETER_SELECTOR = 'POLICY_PARAMETER_SELECTOR', // PolicyParameterSelectorFrame
  POLICY_SUBMIT = 'POLICY_SUBMIT', // PolicySubmitFrame
  SELECT_EXISTING_POLICY = 'SELECT_EXISTING_POLICY', // SimulationSelectExistingPolicyFrame

  // ========== Population setup views (inline, nested in simulation) ==========
  POPULATION_SCOPE = 'POPULATION_SCOPE', // SelectGeographicScopeFrame
  POPULATION_LABEL = 'POPULATION_LABEL', // SetPopulationLabelFrame
  POPULATION_HOUSEHOLD_BUILDER = 'POPULATION_HOUSEHOLD_BUILDER', // HouseholdBuilderFrame
  POPULATION_GEOGRAPHIC_CONFIRM = 'POPULATION_GEOGRAPHIC_CONFIRM', // GeographicConfirmationFrame
  SELECT_EXISTING_POPULATION = 'SELECT_EXISTING_POPULATION', // SimulationSelectExistingPopulationFrame

  // ========== Setup coordination views (nested in simulation) ==========
  SETUP_POLICY = 'SETUP_POLICY', // SimulationSetupPolicyFrame (create new vs load existing choice)
  SETUP_POPULATION = 'SETUP_POPULATION', // SimulationSetupPopulationFrame (create new vs load existing choice)
}
