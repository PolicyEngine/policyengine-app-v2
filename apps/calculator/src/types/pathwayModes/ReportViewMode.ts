import { PolicyViewMode, PopulationViewMode, SimulationViewMode } from './SharedViewModes';

/**
 * ReportViewMode - Enum for report creation pathway view states
 *
 * Maps to the frames in ReportCreationFlow, PLUS inline simulation/policy/population setup.
 * Following Option A (inline sub-pathways), this enum includes ALL views for the
 * complete report creation experience.
 *
 * Grouped by pathway level:
 * - Report-level views (REPORT_*)
 * - Simulation setup views (inline, from SimulationViewMode)
 * - Policy setup views (inline, from PolicyViewMode)
 * - Population setup views (inline, from PopulationViewMode)
 * - Selection views (for loading existing ingredients)
 *
 * Note: This enum is large (~20+ modes) which is acceptable per the plan's Option A.
 * It composes shared view modes to maximize reusability across pathways.
 */
export enum ReportViewMode {
  // ========== Report-level views (report-specific) ==========
  REPORT_LABEL = 'REPORT_LABEL', // ReportCreationFrame
  REPORT_SETUP = 'REPORT_SETUP', // ReportSetupFrame (shows two simulation cards)
  REPORT_SUBMIT = 'REPORT_SUBMIT', // ReportSubmitFrame

  // ========== Simulation selection/creation views (report-specific) ==========
  REPORT_SELECT_SIMULATION = 'REPORT_SELECT_SIMULATION', // ReportSelectSimulationFrame (create new vs load existing)
  REPORT_SELECT_EXISTING_SIMULATION = 'REPORT_SELECT_EXISTING_SIMULATION', // ReportSelectExistingSimulationFrame

  // ========== Simulation setup views (shared) ==========
  SIMULATION_LABEL = SimulationViewMode.SIMULATION_LABEL,
  SIMULATION_SETUP = SimulationViewMode.SIMULATION_SETUP,
  SIMULATION_SUBMIT = SimulationViewMode.SIMULATION_SUBMIT,

  // ========== Policy setup views (shared) ==========
  POLICY_LABEL = PolicyViewMode.POLICY_LABEL,
  POLICY_PARAMETER_SELECTOR = PolicyViewMode.POLICY_PARAMETER_SELECTOR,
  POLICY_SUBMIT = PolicyViewMode.POLICY_SUBMIT,
  SELECT_EXISTING_POLICY = PolicyViewMode.SELECT_EXISTING_POLICY,
  SETUP_POLICY = PolicyViewMode.SETUP_POLICY,

  // ========== Population setup views (shared) ==========
  POPULATION_SCOPE = PopulationViewMode.POPULATION_SCOPE,
  POPULATION_LABEL = PopulationViewMode.POPULATION_LABEL,
  POPULATION_HOUSEHOLD_BUILDER = PopulationViewMode.POPULATION_HOUSEHOLD_BUILDER,
  POPULATION_GEOGRAPHIC_CONFIRM = PopulationViewMode.POPULATION_GEOGRAPHIC_CONFIRM,
  SELECT_EXISTING_POPULATION = PopulationViewMode.SELECT_EXISTING_POPULATION,
  SETUP_POPULATION = PopulationViewMode.SETUP_POPULATION,
}
