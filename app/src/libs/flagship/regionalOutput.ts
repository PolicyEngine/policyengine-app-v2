import type { QueryClient } from '@tanstack/react-query';
import { normalizeSocietyWideOutput } from '@/adapters/societyWideOutputNormalizer';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { CalcStatus } from '@/types/calculation';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

/**
 * A state's results taken from a nationwide run, when the API scores the
 * states with it (policyengine-sim-api#829): a US national economy result
 * may carry `regions`, `{ "state/ca": <a state run's result>, ... }`, each
 * the national dataset filtered to that state's rows, with its weights.
 * Absent today; every function here answers nothing without it.
 */

/** A US state as the API names its region: "state/ca". */
const STATE_REGION = /^state\/[a-z]{2}$/i;

/** What the economy request asked for, as a nationwide result is looked up. */
export interface EconomyRequest {
  countryId: string;
  reformPolicyId: string;
  baselinePolicyId: string;
  /** The region as sent to the API: "us", "state/ca". */
  region: string;
  /** The four-digit year. */
  year: string;
}

/** The cache key a nationwide result is kept under, for its states to be read from. */
export function nationalEconomyKey(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  year: string
) {
  return ['flagship-national-economy', countryId, reformPolicyId, baselinePolicyId, year] as const;
}

/** Whether a result came from a nationwide run, filtered to one state. */
export function isDerivedFromNational(output: SocietyWideReportOutput | null | undefined): boolean {
  return (output as ReportOutputSocietyWideUS | null | undefined)?.derived_from === 'national';
}

/**
 * The state's results within a nationwide result: only for a state
 * ("state/ca"), only when the result carries that state's block, and only
 * when the block is complete (it has its budget and deciles). The block is
 * normalized as a live result is, and carries the nationwide run's model
 * and data versions where it has none of its own. Otherwise null.
 */
export function regionalOutputFrom(
  nationalOutput: SocietyWideReportOutput | null | undefined,
  region: string | null | undefined
): SocietyWideReportOutput | null {
  if (!nationalOutput || !region || !STATE_REGION.test(region)) {
    return null;
  }
  const national = nationalOutput as ReportOutputSocietyWideUS;
  const regions = national.regions;
  if (!regions || typeof regions !== 'object') {
    return null;
  }
  const block = regions[region.toLowerCase()] ?? regions[region];
  if (!block || typeof block !== 'object' || !block.budget || !block.decile) {
    return null;
  }
  const normalized = normalizeSocietyWideOutput(block);
  return {
    ...normalized,
    model_version: normalized.model_version ?? national.model_version,
    data_version: normalized.data_version ?? national.data_version,
    dataset: normalized.dataset ?? national.dataset ?? null,
    policyengine_version: normalized.policyengine_version ?? national.policyengine_version ?? null,
    derived_from: 'national',
  };
}

/** A completed status's result, or the result itself. */
function completedResult(data: unknown): SocietyWideReportOutput | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const status = data as Partial<CalcStatus>;
  if ('status' in status) {
    return status.status === 'complete' && status.result
      ? (status.result as SocietyWideReportOutput)
      : null;
  }
  return data as SocietyWideReportOutput;
}

/**
 * The state's results from a completed nationwide result of the same
 * country, reform, baseline and year that this session already holds in
 * the query cache: one kept under `nationalEconomyKey`, or a budget
 * window's year run nationwide. It only reads the cache, never the
 * network: asking the API for the nationwide result could start a run.
 * Null when the request is not for a state, or nothing fits.
 */
export function findRegionalOutput(
  queryClient: QueryClient,
  { countryId, reformPolicyId, baselinePolicyId, region, year }: EconomyRequest
): SocietyWideReportOutput | null {
  if (!STATE_REGION.test(region) || !reformPolicyId || !baselinePolicyId) {
    return null;
  }
  const candidates: unknown[] = [
    queryClient.getQueryData(nationalEconomyKey(countryId, reformPolicyId, baselinePolicyId, year)),
    queryClient.getQueryData([
      'flagship-report-year',
      countryId,
      reformPolicyId,
      baselinePolicyId,
      countryId,
      year,
    ]),
  ];
  for (const candidate of candidates) {
    const derived = regionalOutputFrom(completedResult(candidate), region);
    if (derived) {
      return derived;
    }
  }
  return null;
}

/**
 * Keeps a nationwide result where `findRegionalOutput` reads it, so a
 * state run of the same reform opens with its state's block. A result
 * without state blocks is not kept: nothing could be read from it.
 */
export function rememberNationalOutput(
  queryClient: QueryClient,
  { countryId, reformPolicyId, baselinePolicyId, year }: Omit<EconomyRequest, 'region'>,
  output: SocietyWideReportOutput | null | undefined
): void {
  if (!output || !(output as ReportOutputSocietyWideUS).regions) {
    return;
  }
  queryClient.setQueryData(
    nationalEconomyKey(countryId, reformPolicyId, baselinePolicyId, year),
    output
  );
}
