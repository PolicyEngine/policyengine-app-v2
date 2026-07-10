import type {
  HouseholdCalculationData,
  HouseholdCalculationOutput,
} from '@/types/calculation/household';
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

    return {
      // Treat any non-error simulation without persisted output as pending.
      // This prevents valid legacy household results from falling through to NotFound.
      isPending: this.simulations.some(
        (simulation) => !this.hasDurableOutput(simulation) && simulation.status !== 'error'
      ),
      isComplete: this.simulations.every((simulation) => this.hasDurableOutput(simulation)),
      isError: this.simulations.some((simulation) => simulation.status === 'error'),
    };
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
  getHouseholdOutputs(): HouseholdCalculationOutput[] {
    if (!this.report || !this.simulations) {
      return [];
    }

    return this.simulations
      .filter((simulation) => this.hasDurableOutput(simulation))
      .map((sim) => ({
        simulation: sim,
        householdData: this.getHouseholdData(sim.output),
      }))
      .filter(
        (entry): entry is { simulation: Simulation; householdData: HouseholdCalculationData } =>
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
      if (!this.hasDurableOutput(simulation)) {
        continue;
      }
      const output = simulation.output;
      if (
        output &&
        typeof output === 'object' &&
        'execution_receipt' in output &&
        output.execution_receipt &&
        typeof output.execution_receipt === 'object' &&
        'resolved' in output.execution_receipt &&
        output.execution_receipt.resolved &&
        typeof output.execution_receipt.resolved === 'object'
      ) {
        const resolved = output.execution_receipt.resolved;
        if (
          'certified_release' in resolved &&
          resolved.certified_release &&
          typeof resolved.certified_release === 'object' &&
          'policyengine_version' in resolved.certified_release &&
          typeof resolved.certified_release.policyengine_version === 'string'
        ) {
          return resolved.certified_release.policyengine_version;
        }

        if (
          'runtime' in resolved &&
          resolved.runtime &&
          typeof resolved.runtime === 'object' &&
          'name' in resolved.runtime &&
          resolved.runtime.name === 'policyengine' &&
          'version' in resolved.runtime &&
          typeof resolved.runtime.version === 'string'
        ) {
          return resolved.runtime.version;
        }
      }

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

  private getHouseholdData(output: unknown): HouseholdCalculationData | null {
    if (!output || typeof output !== 'object') {
      return null;
    }

    if ('result' in output && output.result && typeof output.result === 'object') {
      return output.result as HouseholdCalculationData;
    }

    if ('people' in output && output.people && typeof output.people === 'object') {
      return output as HouseholdCalculationData;
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
  getFormattedOutput(): HouseholdCalculationOutput | HouseholdCalculationOutput[] | null {
    const outputs = this.getHouseholdOutputs();

    if (outputs.length === 0) {
      return null;
    }

    return outputs.length > 1 ? outputs : outputs[0];
  }

  private hasDurableOutput(simulation: Simulation): boolean {
    const hasOutput = simulation.output !== null && simulation.output !== undefined;
    return simulation.status === 'complete' || (simulation.status == null && hasOutput);
  }
}
