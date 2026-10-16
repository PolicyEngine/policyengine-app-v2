import { reportLink, type FlagshipReportRecord } from '@/api/flagshipReportStore';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import type { CountryId } from '@/libs/countries';
import { ranAgainstReform, UNNAMED_COMPARISON } from '@/libs/flagship/reportComparison';
import { readReportMeta, type RunReportBaseline } from '@/libs/flagship/runReport';
import type { Reform } from '@/types/ingredients/Reform';

/** What a report ran with, beyond its reform, to run it again. */
export interface RerunSettings {
  /** The year it simulated; unknown when neither its record nor the API's says. */
  year?: number;
  /** A state or district; absent for the whole country. */
  region?: string;
  windowYears?: number;
  baseline?: RunReportBaseline;
}

export interface RerunSettingsOptions {
  /** This session's saved reform by its ID, to name the reform a report was compared with. */
  savedReform?: (reformId: string) => Reform | undefined;
  /** The current-law policy, to tell a report compared with a reform from one against current law. */
  currentLawPolicyId?: number;
}

/**
 * The settings a report ran with. Its year (when its record keeps none)
 * and population come from the API's record: the report and its baseline
 * simulation. Its budget window and comparison come from the run's
 * details, which this session keeps under the report's link; otherwise
 * from the report's own record, which keeps its window and the saved
 * reform it was compared with (an account report run elsewhere, or
 * before a reload). That comparison is the baseline policy the report
 * ran, named from the saved reform. A population that cannot be read
 * runs nationwide, as the report would without one; a comparison whose
 * policy cannot be read throws rather than run against current law.
 */
export async function rerunSettings(
  countryId: CountryId,
  report: FlagshipReportRecord,
  { savedReform, currentLawPolicyId }: RerunSettingsOptions = {}
): Promise<RerunSettings> {
  const meta = readReportMeta(reportLink(report));
  let year = report.year;
  let region: string | undefined;
  let baselinePolicyId: number | undefined;
  try {
    const apiReport = await fetchReportById(countryId, report.apiReportId);
    year = year || apiReport.year || undefined;
    const simulation = await fetchSimulationById(countryId, apiReport.simulation_1_id);
    const population = simulation.population_type === 'geography' ? simulation.population_id : '';
    region = population && population !== countryId ? population : undefined;
    baselinePolicyId = Number(simulation.policy_id) || undefined;
  } catch {
    region = undefined;
  }
  const recordWindow =
    report.budgetWindowYears && report.budgetWindowYears > 1 ? report.budgetWindowYears : undefined;
  return {
    year: Number(year) || undefined,
    region,
    windowYears: meta?.budgetWindow?.windowSize ?? recordWindow,
    baseline: meta?.baseline
      ? {
          reformId: meta.baseline.reformId,
          label: meta.baseline.label,
          policyId: Number(meta.baseline.policyId),
        }
      : savedBaseline(report, baselinePolicyId, savedReform, currentLawPolicyId),
  };
}

/**
 * The saved reform a report's record says it was compared with, as the
 * baseline to run again: the policy the report ran as its baseline, or,
 * when that can't be read, the saved reform's own policy. A record that no
 * longer names one (the reform was deleted, or the report recomputed
 * someone else's) keeps the comparison its baseline policy shows. None for
 * a report compared with current law.
 */
function savedBaseline(
  report: FlagshipReportRecord,
  baselinePolicyId: number | undefined,
  savedReform: RerunSettingsOptions['savedReform'],
  currentLawPolicyId: number | undefined
): RunReportBaseline | undefined {
  if (!report.baselineReformId) {
    return baselinePolicyId && ranAgainstReform(baselinePolicyId, currentLawPolicyId)
      ? { reformId: null, label: UNNAMED_COMPARISON, policyId: baselinePolicyId }
      : undefined;
  }
  const reform = savedReform?.(report.baselineReformId);
  const policyId = baselinePolicyId ?? (Number(reform?.policyId) || undefined);
  if (!policyId) {
    throw new Error('The report’s comparison could not be read');
  }
  return {
    reformId: report.baselineReformId,
    label: reform?.label || 'Untitled reform',
    policyId,
  };
}
