import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import type { CountryId } from '@/libs/countries';
import { readReportMeta, type RunReportBaseline } from '@/libs/flagship/runReport';

/** What a report ran with, beyond its reform and year, to run it again. */
export interface RerunSettings {
  /** A state or district; absent for the whole country. */
  region?: string;
  windowYears?: number;
  baseline?: RunReportBaseline;
}

/**
 * The settings a report ran with: its population from the API's record
 * (the report's simulation), its budget window and comparison from the
 * details this browser kept. A population that cannot be read runs
 * nationwide, as the report would without one.
 */
export async function rerunSettings(
  countryId: CountryId,
  report: FlagshipReportRecord
): Promise<RerunSettings> {
  const meta = readReportMeta(report.apiReportId);
  let region: string | undefined;
  try {
    const apiReport = await fetchReportById(countryId, report.apiReportId);
    const simulation = await fetchSimulationById(countryId, apiReport.simulation_1_id);
    const population = simulation.population_type === 'geography' ? simulation.population_id : '';
    region = population && population !== countryId ? population : undefined;
  } catch {
    region = undefined;
  }
  return {
    region,
    windowYears: meta?.budgetWindow?.windowSize,
    baseline: meta?.baseline
      ? {
          reformId: meta.baseline.reformId,
          label: meta.baseline.label,
          policyId: Number(meta.baseline.policyId),
        }
      : undefined,
  };
}
