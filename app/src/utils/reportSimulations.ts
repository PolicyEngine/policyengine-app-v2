import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

/**
 * True once every simulation the report references has loaded. The
 * calculation must not start before then: with only the baseline loaded
 * the orchestrator scores current law over current law, which the API
 * answers instantly with zeros, and that gets persisted as the report.
 */
export function allSimulationsLoaded(
  report: Report | undefined,
  simulations: Simulation[]
): boolean {
  if (!report) {
    return false;
  }
  const expected = report.simulationIds ?? [];
  return expected.length > 0 && expected.every((id) => simulations.some((s) => s.id === id));
}
