import type { HouseholdImpactResponse } from '@/api/v2/householdAnalysis';
import type { CalcStatus } from '@/types/calculation';
import type { Household } from '@/types/ingredients/Household';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';

/**
 * View Model for HouseholdReportOutput
 *
 * Encapsulates data transformation and business logic for household report display.
 * Pure data class - no side effects, easy to test.
 *
 * Calculation orchestration is handled by CalcOrchestrator + HouseholdCalcStrategy,
 * accessed via useStartCalculationOnLoad and useCalculationStatus hooks.
 */
export class HouseholdReportViewModel {
  constructor(
    private report: Report | undefined,
    private simulations: Simulation[] | undefined,
    private userPolicies: UserPolicy[] | undefined
  ) {}

  /**
   * Extract valid simulation IDs
   */
  get simulationIds(): string[] {
    return this.simulations?.map((s) => s.id).filter((id): id is string => !!id) || [];
  }

  /**
   * Extract household outputs from completed CalcStatus results.
   *
   * Each CalcStatus.result is a HouseholdImpactResponse from the v2 analysis endpoint.
   * For single-policy analysis (policy_id=null): only baseline_result is populated.
   * For comparison analysis (policy_id=reform): both baseline_result and reform_result exist.
   *
   * We extract the "primary" result for each simulation:
   * - If reform_result exists, this is a comparison — use reform_result
   * - Otherwise, use baseline_result (single-policy / current law)
   */
  getOutputsFromCalcResults(calculations: CalcStatus[]): Household[] {
    return calculations
      .filter((calc) => calc.status === 'complete' && calc.result)
      .map((calc) => {
        const response = calc.result as HouseholdImpactResponse;
        return (response.reform_result || response.baseline_result) as unknown as Household;
      })
      .filter((h): h is Household => !!h);
  }

  /**
   * Format household outputs for sub-pages.
   * Returns single Household for single-sim reports, array for comparisons.
   */
  getFormattedOutput(calculations: CalcStatus[]): Household | Household[] | null {
    const outputs = this.getOutputsFromCalcResults(calculations);

    if (outputs.length === 0) {
      return null;
    }

    return outputs.length > 1 ? outputs : outputs[0];
  }

  /**
   * Extract policy labels for display
   */
  getPolicyLabels(): string[] {
    if (!this.simulations || !this.userPolicies) {
      return [];
    }

    return this.simulations.map((sim) => {
      const userPolicy = this.userPolicies!.find((up) => up.policyId === sim.policyId);
      return userPolicy?.label || `Policy ${sim.policyId}`;
    });
  }

  /**
   * Get error message from CalcStatus error
   */
  getErrorMessage(error?: CalcStatus['error']): string {
    return error?.message || 'Calculation failed';
  }
}
