import {
  createPublicApiClient,
  publicApiCountryId,
  requireResult,
  type PublicApiClient,
} from '@/api/publicApi/client';
import type { components } from '@/api/publicApi/schema';
import { AccountAssociationRoutes, type ApiStoreContext } from '@/api/v2Associations';
import {
  CALCULATION_POLL_INTERVAL_MS,
  CALCULATION_TIME_LIMIT_MS,
  V2HouseholdCalculationFailedError,
  type CalculateV2HouseholdOptions,
  type V2HouseholdCalculationOutput,
} from '@/api/v2HouseholdCalculations';
import { isV2ApiError } from '@/api/v2UserClient';
import type { FlagshipHouseholdRun } from '@/libs/flagship/householdRun';
import { clampStoreText } from '@/libs/flagship/storeText';
import { householdRunFromV2Calculations } from '@/libs/flagship/v2HouseholdRun';
import type { V2HouseholdItem } from '@/types/v2Households';
import type { AssociationCountryId, UserReportItem } from '@/types/v2User';

/**
 * Persisted household reports on the Public API's v2 routes. A household
 * report (`POST /v2/reports`, kind "household") calculates a stored
 * household under a baseline and an optional reform for the household's
 * default year, and keeps the result: once its newest run has succeeded,
 * `GET /v2/reports/{report_id}` gives the calculated household under each
 * policy. A user saves it as a `/v2/user-reports` row naming the report,
 * and the row's ID is the report's link, which anyone can read through
 * `/v2/shared-reports/{association_id}` without a credential.
 */

type Schemas = components['schemas'];

export type V2HouseholdReportItem = Schemas['HouseholdReportItem'];
export type V2HouseholdReportCalculation = Schemas['HouseholdReportCalculationItem'];

export interface V2HouseholdReportRequest {
  countryId: string;
  /** The stored household (`/v2/households`). */
  householdId: string;
  /** A v2 policy (`/v2/policies`); null for current law. */
  baselinePolicyId: string | null;
  /** The reform's v2 policy; the same as the baseline for a baseline-only report. */
  reformPolicyId: string | null;
}

/** A household report as the Public API holds it, refusing a report of another kind. */
function asHouseholdReport(item: Schemas['ReportDetailResult']['item']): V2HouseholdReportItem {
  if (item.kind !== 'household') {
    throw new Error('This report is not a household report.');
  }
  return item;
}

/**
 * Creates a household report and starts its run, each calculation adding
 * every variable the household lacks. The Public API refuses,
 * before creating anything, a household or policy the country lacks
 * (404), and a country without household calculations or a household
 * without a default year (422); 503 when the simulation service is
 * unavailable.
 */
export async function submitV2HouseholdReport(
  { countryId, householdId, baselinePolicyId, reformPolicyId }: V2HouseholdReportRequest,
  client: PublicApiClient = createPublicApiClient()
): Promise<V2HouseholdReportItem> {
  const country = publicApiCountryId(countryId);
  const result = await requireResult(
    client.POST('/v2/reports', {
      params: { query: { country_id: country } },
      body: {
        kind: 'household',
        country_id: country,
        household_id: householdId,
        baseline: { policy_id: baselinePolicyId },
        reform: reformPolicyId === baselinePolicyId ? null : { policy_id: reformPolicyId },
        // Every variable the household lacks, as v1's household routes calculate
        // them: without it only the household's null values are filled in, and
        // there is no net income to compare.
        add_missing_variables: true,
      },
    })
  );
  return asHouseholdReport(result.item);
}

export async function fetchV2HouseholdReport(
  countryId: string,
  reportId: string,
  client: PublicApiClient = createPublicApiClient()
): Promise<V2HouseholdReportItem> {
  const result = await requireResult(
    client.GET('/v2/reports/{report_id}', {
      params: {
        path: { report_id: reportId },
        query: { country_id: publicApiCountryId(countryId) },
      },
    })
  );
  return asHouseholdReport(result.item);
}

const waitFor = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

/** The reason a failed run gives: its first failed calculation's. */
function failureOf(item: V2HouseholdReportItem): V2HouseholdCalculationFailedError {
  const failed = [item.run?.baseline, item.run?.reform].find((calculation) => calculation?.error);
  return new V2HouseholdCalculationFailedError(
    failed?.error?.message || 'The household report could not be calculated.',
    failed?.error?.code ?? null
  );
}

/**
 * Reads a household report until its newest run has succeeded, returning
 * it, or failed, rejecting with the reason. A report with no run (the
 * simulation service could not start one) is refused, as is a report that
 * does not finish within the time limit.
 */
export async function waitForV2HouseholdReport(
  countryId: string,
  reportId: string,
  {
    client = createPublicApiClient(),
    pollIntervalMs = CALCULATION_POLL_INTERVAL_MS,
    timeLimitMs = CALCULATION_TIME_LIMIT_MS,
    wait = waitFor,
    now = Date.now,
    signal,
  }: CalculateV2HouseholdOptions = {}
): Promise<V2HouseholdReportItem> {
  const startedAt = now();
  let item = await fetchV2HouseholdReport(countryId, reportId, client);
  while (item.status === 'pending' || item.status === 'running') {
    if (now() - startedAt >= timeLimitMs) {
      throw new Error('The household report timed out.');
    }
    await wait(pollIntervalMs);
    signal?.throwIfAborted();
    item = await fetchV2HouseholdReport(countryId, reportId, client);
  }
  if (item.status === 'not_run' || !item.run) {
    throw new Error('The household report has not been calculated. Try again later.');
  }
  if (item.status === 'failed') {
    throw failureOf(item);
  }
  return item;
}

/** A report calculation's output, as `/v2/household-calculations` gives one. */
function outputOf(
  calculation: V2HouseholdReportCalculation,
  policyengineVersion: string | null
): V2HouseholdCalculationOutput {
  if (!calculation.result) {
    throw new Error('The household report has no calculated household.');
  }
  return { ...calculation.result, policyengine_version: policyengineVersion };
}

/**
 * A succeeded household report as v3's household run: its calculated
 * households in their v1 names (from the stored household it names), what
 * the reform changes, and how each was calculated.
 */
export function householdRunFromV2Report(
  item: V2HouseholdReportItem,
  stored: V2HouseholdItem
): FlagshipHouseholdRun {
  if (!item.run) {
    throw new Error('The household report has not been calculated. Try again later.');
  }
  const version = item.run.policyengine_version;
  const baseline = outputOf(item.run.baseline, version);
  const reform = item.run.reform ? outputOf(item.run.reform, version) : baseline;
  return householdRunFromV2Calculations(stored, String(item.year), baseline, reform);
}

/**
 * Saves a household report in the account (`POST /v2/user-reports`, which
 * checks the report with the simulation service) under the user's name for
 * it, and returns the saved report's ID: the report's link.
 */
export async function saveV2HouseholdReport(
  context: ApiStoreContext,
  { countryId, reportId, name }: { countryId: AssociationCountryId; reportId: string; name: string }
): Promise<string> {
  const routes = new AccountAssociationRoutes<UserReportItem>(context, 'user-reports', 'Report');
  const body: Schemas['UserReportCreateRequest'] & { country_id: AssociationCountryId } = {
    country_id: countryId,
    report_id: reportId,
    name: clampStoreText(name.trim()) || null,
  };
  const row = await routes.create(body);
  return row.id;
}

/** A saved household report as anyone holding its link reads it. */
export interface SharedHouseholdReport {
  /** The v2 household report the saved report names. */
  reportId: string;
  /** The owner's name for it; null when saved without one. */
  name: string | null;
}

/**
 * The saved report a link names (a `/v2/user-reports` row's ID), read with
 * no credential; null when no saved report has that ID in the country. A
 * saved report that names no v2 report (an economy report kept from v1) is
 * refused.
 */
export async function readSharedHouseholdReport(
  countryId: string,
  savedReportId: string,
  client: PublicApiClient = createPublicApiClient()
): Promise<SharedHouseholdReport | null> {
  try {
    const result = await requireResult(
      client.GET('/v2/shared-reports/{association_id}', {
        params: {
          path: { association_id: savedReportId },
          query: { country_id: publicApiCountryId(countryId) },
        },
      })
    );
    if (!result.item.report_id) {
      throw new Error('This saved report is not a household report.');
    }
    return { reportId: result.item.report_id, name: result.item.name };
  } catch (error) {
    if (isV2ApiError(error, 404)) {
      return null;
    }
    throw error;
  }
}
