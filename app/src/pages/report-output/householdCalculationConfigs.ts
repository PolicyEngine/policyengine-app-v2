import type { Household } from '@/models/Household';
import type { CalcStartConfig } from '@/types/calculation';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

/**
 * Build the simulation-level calculations owned by the managed orchestrator.
 *
 * Household reports execute once per simulation. The parent report id is
 * carried on every config so the result persister can atomically finish the
 * report after all simulation results are present.
 */
export function buildHouseholdCalculationConfigs(
  report: Report | undefined,
  simulations: Simulation[] | undefined,
  households: Household[] | undefined
): CalcStartConfig[] {
  if (!report?.id || !simulations?.length) {
    return [];
  }

  return simulations.flatMap((simulation) => {
    const hasOutput = simulation.output !== null && simulation.output !== undefined;
    const hasDurableResult =
      simulation.status === 'complete' || (simulation.status == null && hasOutput);
    const isTerminalError = simulation.status === 'error';

    if (!simulation.id || hasDurableResult || isTerminalError) {
      return [];
    }

    const household =
      households?.find((candidate) => candidate.id === simulation.populationId) ?? null;

    return [
      {
        calcId: simulation.id,
        targetType: 'simulation',
        countryId: report.countryId,
        year: report.year,
        reportId: report.id,
        simulations: {
          simulation1: simulation,
          simulation2: null,
        },
        populations: {
          household1: household,
          household2: null,
          geography1: null,
          geography2: null,
        },
      },
    ];
  });
}
