import type { HouseholdReportOrchestrator } from '@/libs/calculations/household/HouseholdReportOrchestrator';
import type { HouseholdReportConfig, SimulationConfig } from '@/types/calculation/household';
import type { Household, HouseholdData } from '@/types/ingredients/Household';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';

/**
 * View Model for HouseholdReportOutput
 *
 * Encapsulates all data transformation and business logic for household report display.
 * Pure data class - no side effects, easy to test.
 */
export class HouseholdReportViewModel {
  constructor(
    private report: Report | undefined,
    private simulations: Simulation[] | undefined,
    private userSimulations: UserSimulation[] | undefined,
    private userPolicies: UserPolicy[] | undefined
  ) {}

  /**
   * Extract valid simulation IDs
   */
  get simulationIds(): string[] {
    return this.simulations?.map((s) => s.id).filter((id): id is string => !!id) || [];
  }

  /**
   * Derive simulation states from persistent status
   * Source of truth for rendering decisions
   */
  get simulationStates() {
    if (!this.simulations || this.simulations.length === 0) {
      return { isPending: false, isComplete: false, isError: false };
    }

    const isSimulationComplete = (simulation: Simulation): boolean =>
      simulation.status === 'complete' ||
      (simulation.output !== null && simulation.output !== undefined);

    const isSimulationError = (simulation: Simulation): boolean =>
      simulation.status === 'error' && simulation.output === null;

    return {
      // Treat any non-error simulation without persisted output as pending.
      // This prevents valid legacy household results from falling through to NotFound.
      isPending: this.simulations.some(
        (simulation) => !isSimulationComplete(simulation) && !isSimulationError(simulation)
      ),
      isComplete: this.simulations.every(isSimulationComplete),
      isError: this.simulations.some(isSimulationError),
    };
  }

  /**
   * Build calculation config for orchestrator
   */
  buildCalculationConfig(): HouseholdReportConfig | null {
    if (!this.report?.id) {
      return null;
    }

    const configs: SimulationConfig[] = (this.simulations || [])
      .filter((sim) => sim.id && sim.populationId && sim.policyId)
      .map((sim) => ({
        simulationId: sim.id!,
        populationId: sim.populationId!,
        policyId: sim.policyId!,
      }));

    return {
      reportId: this.report.id,
      report: this.report,
      simulationConfigs: configs,
      countryId: this.report.countryId,
    };
  }

  /**
   * Determine if calculations should be started
   */
  shouldStartCalculations(orchestrator: HouseholdReportOrchestrator): boolean {
    if (!this.report?.id || !this.simulations || this.simulations.length === 0) {
      return false;
    }

    if (!this.simulationStates.isPending) {
      return false;
    }

    // Don't start if any simulation is already calculating
    return !this.simulations.some((sim) => orchestrator.isCalculating(sim.id!));
  }

  /**
   * Get error message for failed simulations
   */
  getErrorMessage(): string {
    const errorSims = this.simulations?.filter((s) => s.status === 'error') || [];

    if (errorSims.length === 0) {
      return 'Calculation failed';
    }

    return errorSims.map((s) => `Simulation ${s.id}: Failed to calculate`).join('\n');
  }

  /**
   * Extract household outputs from completed simulations
   */
  getHouseholdOutputs(): Household[] {
    if (!this.report || !this.simulations) {
      return [];
    }

    return this.simulations
      .map((sim) => ({
        simulation: sim,
        householdData: this.getHouseholdData(sim.output),
      }))
      .filter(
        (entry): entry is { simulation: Simulation; householdData: HouseholdData } =>
          !!entry.householdData
      )
      .map(({ simulation, householdData }) => ({
        id: simulation.id,
        countryId: this.report!.countryId,
        householdData,
      }));
  }

  getResolvedPolicyengineVersion(): string | null {
    for (const simulation of this.simulations || []) {
      const output = simulation.output;
      if (
        output &&
        typeof output === 'object' &&
        'policyengine_bundle' in output &&
        output.policyengine_bundle &&
        typeof output.policyengine_bundle === 'object' &&
        'policyengine_version' in output.policyengine_bundle &&
        typeof output.policyengine_bundle.policyengine_version === 'string'
      ) {
        return output.policyengine_bundle.policyengine_version;
      }
    }

    const reportOutput = this.report?.output;
    if (
      reportOutput &&
      typeof reportOutput === 'object' &&
      'policyengine_version' in reportOutput &&
      typeof reportOutput.policyengine_version === 'string'
    ) {
      return reportOutput.policyengine_version;
    }

    return null;
  }

  private getHouseholdData(output: unknown): HouseholdData | null {
    if (!output || typeof output !== 'object') {
      return null;
    }

    if ('result' in output && output.result && typeof output.result === 'object') {
      return output.result as HouseholdData;
    }

    if ('people' in output && output.people && typeof output.people === 'object') {
      return output as HouseholdData;
    }

    return null;
  }

  /**
   * Extract policy labels for display
   */
  getPolicyLabels(): string[] {
    if (!this.simulations || !this.userPolicies) {
      return [];
    }

    return this.simulations
      .filter((sim) => this.getHouseholdData(sim.output))
      .map((sim) => {
        const userPolicy = this.userPolicies!.find((up) => up.policyId === sim.policyId);
        return userPolicy?.label || `Policy ${sim.policyId}`;
      });
  }

  /**
   * Format household outputs for OverviewSubPage
   * Returns single household for single-sim reports, array for comparisons
   */
  getFormattedOutput(): Household | Household[] | null {
    const outputs = this.getHouseholdOutputs();

    if (outputs.length === 0) {
      return null;
    }

    return outputs.length > 1 ? outputs : outputs[0];
  }
}
