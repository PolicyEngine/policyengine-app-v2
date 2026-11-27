import { recordFromItem } from '@/api/flagshipReportStore';
import type { FlagshipRunRecords } from '@/libs/flagship/runReport';
import { ASSOCIATION_IDS, reportItem } from '@/tests/fixtures/api/v2UserMocks';
import {
  RUN_BASELINE_SIMULATION,
  RUN_REFORM_SIMULATION,
  RUN_REPORT,
} from '@/tests/fixtures/libs/flagship/runReportMocks';
import type { PolicyMetadata } from '@/types/metadata/policyMetadata';
import type { ReportMetadata } from '@/types/metadata/reportMetadata';
import type { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import type { SharedReportItem, UserReportItem } from '@/types/v2User';

/** The run's v1 report: its number is the report's link without accounts. */
export const RUN_API_REPORT_ID = String(RUN_REPORT.id);
/** The run's simulations, the baseline's then the reform's. */
export const RUN_SIMULATION_IDS = [
  String(RUN_BASELINE_SIMULATION.id),
  String(RUN_REFORM_SIMULATION.id),
];
/** The policies they name: current law, then the reform's. */
export const RUN_POLICY_IDS = [RUN_BASELINE_SIMULATION.policy_id, RUN_REFORM_SIMULATION.policy_id];
/** The saved report's row: its ID is the report's link with accounts. */
export const RUN_ROW_ID = ASSOCIATION_IDS.REPORT;

/**
 * The account row as the account answers the run's write of it: run from
 * a saved reform, with a budget window.
 */
export const RUN_ROW: UserReportItem = reportItem({
  legacy_report_id: RUN_REPORT.id,
  user_policy_id: ASSOCIATION_IDS.POLICY,
  budget_window_years: 10,
  name: 'CTC expansion',
  source_note: 'Hand-built draft',
  provisions: [
    {
      path: 'gov.irs.credits.ctc.amount.base[0].amount',
      breadcrumb: 'IRS → Credits → CTC → Base amount',
      unit: 'currency-USD',
      baseline_value: 2000,
      value: 2500,
      intervals: null,
    },
  ],
  last_run_at: '2026-11-17T10:00:00+00:00',
});

/** The same row, compared with one of the owner's saved reforms. */
export const RUN_ROW_WITH_SAVED_BASELINE: UserReportItem = {
  ...RUN_ROW,
  baseline_user_policy_id: ASSOCIATION_IDS.REFORM,
};
/** That saved reform as the shared read names it. */
export const SAVED_BASELINE_REFORM = { name: 'CTC as enacted' };

/** The saved report before it ran again: pointing at an earlier v1 report. */
export const EARLIER_REPORT: ReportMetadata = {
  ...RUN_REPORT,
  id: 54,
  simulation_1_id: '91',
  simulation_2_id: '92',
};
export const EARLIER_ROW: UserReportItem = {
  ...RUN_ROW,
  legacy_report_id: EARLIER_REPORT.id,
  last_run_at: '2026-11-10T10:00:00+00:00',
};

/**
 * A row as anyone holding its link reads it (`/v2/shared-reports`): the
 * Public API leaves out the owner and the links to the owner's saved
 * reforms, and names the reform the report was compared with.
 */
export function sharedItemOf(
  row: UserReportItem,
  baselineReform: SharedReportItem['baseline_reform'] = null
): SharedReportItem {
  return {
    id: row.id,
    country_id: row.country_id,
    legacy_report_id: row.legacy_report_id,
    name: row.name,
    source_note: row.source_note,
    provisions: row.provisions,
    validation: row.validation,
    budget_window_years: row.budget_window_years,
    baseline_reform: baselineReform,
    last_run_at: row.last_run_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** What a run hands on: the Public API's answers and, with accounts, the saved report's row. */
export function runRecords(
  row: UserReportItem | null,
  simulations: SimulationMetadata[] = [RUN_BASELINE_SIMULATION, RUN_REFORM_SIMULATION]
): FlagshipRunRecords {
  return {
    report: RUN_REPORT,
    simulations,
    savedReport: row ? recordFromItem(row) : null,
  };
}

/** A simulation the Public API cannot have answered: it names no population. */
export const SIMULATION_WITHOUT_POPULATION = {
  ...RUN_REFORM_SIMULATION,
  population_id: '',
} as SimulationMetadata;

/**
 * A simulation as `GET /us/simulation/{id}` answers it: the run's as their
 * creation answered them, any other as a nationwide current-law one.
 */
export function simulationAnswer(simulationId: string): SimulationMetadata {
  return (
    [RUN_BASELINE_SIMULATION, RUN_REFORM_SIMULATION].find(
      (simulation) => String(simulation.id) === simulationId
    ) ?? { ...RUN_BASELINE_SIMULATION, id: Number(simulationId) }
  );
}

/** A v1 policy as `GET /us/policy/{id}` answers it: no parameters, none of them missing. */
export function policyAnswer(policyId: string): PolicyMetadata {
  return {
    id: policyId,
    country_id: 'us',
    api_version: '1.0.0',
    policy_json: {},
    policy_hash: `hash-${policyId}`,
    missing_parameters: [],
  };
}
