import type { V2HouseholdReportCalculation, V2HouseholdReportItem } from '@/api/v2HouseholdReports';
import {
  US_SINGLE_PARENT_REFORM_SITUATION,
  V2_CALCULATION_POLICYENGINE_VERSION,
  V2_REFORM_POLICY_ID,
  V2_SPM_CONFIG,
  V2_SPM_PROVENANCE,
  type RouteAnswer,
} from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import {
  STORED_V2_HOUSEHOLD_ID,
  US_SINGLE_PARENT_CALCULATED_SITUATION,
  US_SINGLE_PARENT_INPUTS_SITUATION,
  V2_CODEC_YEAR,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';

/** A household report, its run and the saved report that names it. */
export const V2_HOUSEHOLD_REPORT_IDS = {
  REPORT: '6d6d6d6d-6d6d-4d6d-8d6d-6d6d6d6d6d6d',
  RUN: '7e7e7e7e-7e7e-4e7e-8e7e-7e7e7e7e7e7e',
  BASELINE_SIMULATION: '8f8f8f8f-8f8f-4f8f-8f8f-8f8f8f8f8f8f',
  REFORM_SIMULATION: '9a9a9a9a-9a9a-4a9a-8a9a-9a9a9a9a9a9a',
  SAVED_REPORT: 'abababab-abab-4bab-8bab-abababababab',
} as const;
export const SAVED_HOUSEHOLD_REPORT_NAME = 'Our family under the EITC bill';
const CREATED_AT = '2026-10-29T10:00:00Z';

function calculation(
  simulationId: string,
  policyId: string | null,
  household: Record<string, unknown> | null,
  status = 'succeeded'
): V2HouseholdReportCalculation {
  return {
    id: `${simulationId}-calculation`,
    simulation_id: simulationId,
    policy_id: policyId,
    status,
    attempt: 1,
    trigger: 'initial',
    error: null,
    result: household
      ? {
          household: household as never,
          warnings: [],
          spm_config: V2_SPM_CONFIG as never,
          spm_provenance: V2_SPM_PROVENANCE as never,
        }
      : null,
    dispatched_at: CREATED_AT,
    completed_at: household ? CREATED_AT : null,
    created_at: CREATED_AT,
  };
}

/**
 * The single parent's household report, current law against the reform, as
 * it stands. Once succeeded, each calculation's household is what the
 * simulation service returns: the stored household with only the values
 * it stores, unless the report was created with `add_missing_variables`,
 * which calculates every variable the household lacks (net income, taxes,
 * benefits).
 */
export function householdReportItem(
  status: V2HouseholdReportItem['status'] = 'succeeded',
  {
    reform = true,
    addMissingVariables = true,
  }: { reform?: boolean; addMissingVariables?: boolean } = {}
): V2HouseholdReportItem {
  const finished = status === 'succeeded';
  const baselineHousehold = addMissingVariables
    ? US_SINGLE_PARENT_CALCULATED_SITUATION
    : US_SINGLE_PARENT_INPUTS_SITUATION;
  const reformHousehold = addMissingVariables
    ? US_SINGLE_PARENT_REFORM_SITUATION
    : US_SINGLE_PARENT_INPUTS_SITUATION;
  return {
    id: V2_HOUSEHOLD_REPORT_IDS.REPORT,
    country_id: 'us',
    kind: 'household',
    year: Number(V2_CODEC_YEAR),
    household_id: STORED_V2_HOUSEHOLD_ID,
    baseline_simulation_id: V2_HOUSEHOLD_REPORT_IDS.BASELINE_SIMULATION,
    reform_simulation_id: reform ? V2_HOUSEHOLD_REPORT_IDS.REFORM_SIMULATION : null,
    status,
    run: {
      kind: 'household',
      id: V2_HOUSEHOLD_REPORT_IDS.RUN,
      report_id: V2_HOUSEHOLD_REPORT_IDS.REPORT,
      trigger: 'initial',
      tax_benefit_model_version_id: '5c5c5c5c-5c5c-4c5c-8c5c-5c5c5c5c5c5c',
      policyengine_version: V2_CALCULATION_POLICYENGINE_VERSION,
      year: Number(V2_CODEC_YEAR),
      status,
      baseline: calculation(
        V2_HOUSEHOLD_REPORT_IDS.BASELINE_SIMULATION,
        null,
        finished ? baselineHousehold : null,
        status
      ),
      reform: reform
        ? calculation(
            V2_HOUSEHOLD_REPORT_IDS.REFORM_SIMULATION,
            V2_REFORM_POLICY_ID,
            finished ? reformHousehold : null,
            status
          )
        : null,
    },
  };
}

/** A household report whose reform calculation failed, with the simulation service's reason. */
export function failedHouseholdReportItem(message: string): V2HouseholdReportItem {
  const item = householdReportItem('failed');
  return {
    ...item,
    run: {
      ...item.run!,
      reform: {
        ...item.run!.reform!,
        status: 'failed',
        error: { code: 'calculation_failed', message, detail: null },
      },
    },
  };
}

export function reportResponse(item: unknown, status = 200): Response {
  return new Response(JSON.stringify({ status: 'ok', message: null, result: { item } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** The saved report anyone holding its link reads (`/v2/shared-reports`). */
export function sharedHouseholdReportItem(
  reportId: string | null = V2_HOUSEHOLD_REPORT_IDS.REPORT
) {
  return {
    id: V2_HOUSEHOLD_REPORT_IDS.SAVED_REPORT,
    country_id: 'us',
    report_id: reportId,
    legacy_report_id: null,
    name: SAVED_HOUSEHOLD_REPORT_NAME,
    source_note: null,
    provisions: null,
    validation: null,
    budget_window_years: null,
    baseline_reform: null,
    last_run_at: null,
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
  };
}

/**
 * `POST /v2/reports` and `GET /v2/reports/{report_id}` as the Public API and
 * the simulation service answer them: the report is created pending, and
 * read back succeeded, its households calculated with every variable only
 * when the submission asked for `add_missing_variables`.
 */
export function householdReportRoutes(): Record<string, RouteAnswer> {
  let addMissingVariables = false;
  return {
    'POST /v2/reports': async (request) => {
      const body = (await request.clone().json()) as { add_missing_variables?: unknown };
      addMissingVariables = body.add_missing_variables === true;
      return reportResponse(householdReportItem('pending', { addMissingVariables }), 201);
    },
    [`GET /v2/reports/${V2_HOUSEHOLD_REPORT_IDS.REPORT}`]: () =>
      reportResponse(householdReportItem('succeeded', { addMissingVariables })),
  };
}
