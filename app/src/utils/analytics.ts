'use client';

/**
 * Analytics utility used by shared calculator code.
 *
 * In the Next.js calculator app, events go to PostHog. While the legacy Vite
 * app still exists, we keep a GA fallback so existing flows do not break.
 */

import type { Properties } from 'posthog-js';
import type { Household } from '@/types/ingredients/Household';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { PolicyStateProps } from '@/types/pathwayState';
import type { PopulationStateProps } from '@/types/pathwayState';
import { getPostHogClient } from '@/utils/posthogClient';
import {
  buildCalcConfigSnapshot,
  buildHouseholdSnapshot,
  buildPersistedReportSnapshot,
  buildReportBuilderSnapshot,
} from './analyticsSnapshots';
import type {
  CalculatorCalcType,
  CalculatorEventName,
  CalculatorEventPayloadMap,
} from './analyticsSchemas';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function trackEvent(eventName: string, params?: Properties) {
  const posthog = getPostHogClient();

  if (posthog) {
    posthog.capture(eventName, {
      surface: import.meta.env.VITE_APP_MODE ?? 'calculator',
      ...params,
    } as Properties);
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

export function captureCalculatorEvent(
  eventName: CalculatorEventName,
  params: CalculatorEventPayloadMap[CalculatorEventName],
) {
  trackEvent(eventName, params as Properties);
}

function normalizeCalcType(
  calcType: 'household' | 'societyWide' | 'society_wide'
): CalculatorCalcType {
  return calcType === 'societyWide' ? 'society_wide' : calcType;
}

function getSimulationRole(simulationIndex: number): 'baseline' | 'reform' {
  return simulationIndex === 0 ? 'baseline' : 'reform';
}

export function trackSocietyWideBuilderOpened(params: {
  countryId: string;
  year: string;
}) {
  captureCalculatorEvent('society_wide_builder_opened', {
    country_id: params.countryId,
    year: params.year,
  });
}

export function trackHouseholdBuilderOpened(params: {
  countryId: string;
  year: string;
  mode?: 'report' | 'standalone';
}) {
  captureCalculatorEvent('household_builder_opened', {
    country_id: params.countryId,
    year: params.year,
    calc_type: 'household',
    mode: params.mode,
  });
}

export function trackHouseholdVariableAdded(params: {
  countryId: string;
  year: string;
  household: Household;
  variableName: string;
  variableLabel?: string;
  entityScope: 'person' | 'household';
  entityName?: string;
  selectedVariableCount: number;
}) {
  const householdSnapshot = buildHouseholdSnapshot(params.household);

  captureCalculatorEvent('household_variable_added', {
    country_id: params.countryId,
    year: params.year,
    calc_type: 'household',
    variable_name: params.variableName,
    variable_label: params.variableLabel,
    entity_scope: params.entityScope,
    entity_name: params.entityName,
    people_count: householdSnapshot?.people_count,
    selected_variable_count: params.selectedVariableCount,
  });
}

export function trackHouseholdVariableRemoved(params: {
  countryId: string;
  year: string;
  household: Household;
  variableName: string;
  entityScope: 'person' | 'household';
  entityName?: string;
  selectedVariableCount: number;
}) {
  const householdSnapshot = buildHouseholdSnapshot(params.household);

  captureCalculatorEvent('household_variable_removed', {
    country_id: params.countryId,
    year: params.year,
    calc_type: 'household',
    variable_name: params.variableName,
    entity_scope: params.entityScope,
    entity_name: params.entityName,
    people_count: householdSnapshot?.people_count,
    selected_variable_count: params.selectedVariableCount,
  });
}

export function trackHouseholdSaved(params: {
  countryId: string;
  year: string;
  householdId?: string;
  household: Household;
  maritalStatus: 'single' | 'married';
  numChildren: number;
  mode?: 'report' | 'standalone';
}) {
  const householdSnapshot = buildHouseholdSnapshot({
    ...params.household,
    id: params.householdId ?? params.household.id,
  });

  if (!householdSnapshot) {
    return;
  }

  captureCalculatorEvent('household_saved', {
    country_id: params.countryId,
    year: params.year,
    calc_type: 'household',
    household_id: params.householdId ?? params.household.id,
    marital_status: params.maritalStatus,
    num_children: params.numChildren,
    household_snapshot: householdSnapshot,
    mode: params.mode,
  });
}

/** Fires when a calculation (household or economy) completes successfully */
export function trackSimulationCompleted(params: {
  calcType: 'household' | 'societyWide';
  countryId: string;
  year?: string;
  calcId?: string;
  targetType?: 'report' | 'simulation';
  reportId?: string;
  durationMs?: number;
}) {
  captureCalculatorEvent('calculation_completed', {
    calc_type: normalizeCalcType(params.calcType),
    country_id: params.countryId,
    year: params.year,
    calc_id: params.calcId,
    target_type: params.targetType,
    report_id: params.reportId,
    duration_ms: params.durationMs,
  });
}

/** Fires after 15s on an iframe tool page */
export function trackToolEngaged(params: { toolSlug: string; toolTitle: string }) {
  captureCalculatorEvent('tool_engaged', {
    tool_slug: params.toolSlug,
    tool_title: params.toolTitle,
  });
}

/** Fires when user clicks the email contact link */
export function trackContactClicked() {
  captureCalculatorEvent('contact_clicked', {});
}

/** Fires on successful newsletter subscription */
export function trackNewsletterSignup() {
  captureCalculatorEvent('newsletter_signup', {});
}

/** Fires when user clicks "Build Report" to start the creation flow */
export function trackReportStarted(params: {
  countryId: string;
  reportState: import('@/pages/reportBuilder/types').ReportBuilderState;
}) {
  captureCalculatorEvent('report_started', {
    country_id: params.countryId,
    year: params.reportState.year,
    calc_type: buildReportBuilderSnapshot(params.reportState).calc_type,
    report_config_snapshot: buildReportBuilderSnapshot(params.reportState),
  });
}

export function trackReportCreated(params: {
  countryId: string;
  report: Report;
  simulations?: Array<Simulation | null | undefined>;
}) {
  captureCalculatorEvent('report_created', {
    country_id: params.countryId,
    year: params.report.year,
    report_id: params.report.id,
    calc_type: buildPersistedReportSnapshot(params.report, params.simulations).calc_type,
    report_config_snapshot: buildPersistedReportSnapshot(params.report, params.simulations),
  });
}

export function trackReportYearSelected(params: {
  countryId: string;
  selectedYear: string;
  previousYear?: string;
}) {
  captureCalculatorEvent('report_year_selected', {
    country_id: params.countryId,
    year: params.selectedYear,
    selected_year: params.selectedYear,
    previous_year: params.previousYear,
  });
}

export function trackReportPolicySelected(params: {
  countryId: string;
  year: string;
  simulationIndex: number;
  selectionSource: 'current_law' | 'saved' | 'browse' | 'created';
  policy: PolicyStateProps;
}) {
  captureCalculatorEvent('report_policy_selected', {
    country_id: params.countryId,
    year: params.year,
    simulation_index: params.simulationIndex,
    simulation_role: getSimulationRole(params.simulationIndex),
    selection_source: params.selectionSource,
    policy_id: params.policy.id,
    policy_label: params.policy.label,
    parameter_count: params.policy.parameters.length,
  });
}

export function trackReportPopulationSelected(params: {
  countryId: string;
  year: string;
  simulationIndex: number;
  selectionSource: 'quick_select' | 'recent' | 'browse';
  population: PopulationStateProps;
}) {
  const populationType = params.population.type;

  if (!populationType) {
    return;
  }

  captureCalculatorEvent('report_population_selected', {
    country_id: params.countryId,
    year: params.year,
    simulation_index: params.simulationIndex,
    simulation_role: getSimulationRole(params.simulationIndex),
    selection_source: params.selectionSource,
    population_type: populationType,
    population_label: params.population.label,
    household_id: params.population.household?.id,
    geography_id: params.population.geography?.geographyId,
    geography_scope: params.population.geography?.scope,
    household_snapshot: buildHouseholdSnapshot(params.population.household) ?? undefined,
  });
}

export function trackCalculationStarted(params: {
  config: import('@/types/calculation').CalcStartConfig;
}) {
  const calcConfigSnapshot = buildCalcConfigSnapshot(params.config);

  captureCalculatorEvent('calculation_started', {
    calc_id: params.config.calcId,
    target_type: params.config.targetType,
    report_id: params.config.reportId,
    country_id: params.config.countryId,
    year: params.config.year,
    calc_type: calcConfigSnapshot.calc_type,
    calc_config_snapshot: calcConfigSnapshot,
  });
}

export function trackCalculationFailed(params: {
  calcId: string;
  targetType: 'report' | 'simulation';
  countryId: string;
  year?: string;
  calcType: 'household' | 'societyWide' | 'society_wide';
  reportId?: string;
  durationMs?: number;
  error?: unknown;
  config?: import('@/types/calculation').CalcStartConfig;
}) {
  const normalizedError = params.error instanceof Error ? params.error : null;

  captureCalculatorEvent('calculation_failed', {
    calc_id: params.calcId,
    target_type: params.targetType,
    country_id: params.countryId,
    year: params.year,
    report_id: params.reportId,
    calc_type: normalizeCalcType(params.calcType),
    duration_ms: params.durationMs,
    error_name: normalizedError?.name,
    error_message:
      normalizedError?.message ??
      (typeof params.error === 'string' ? params.error : undefined),
    calc_config_snapshot: params.config ? buildCalcConfigSnapshot(params.config) : undefined,
  });
}

export function trackReportOutputViewed(params: {
  report: Report;
  calcType: 'household' | 'societyWide' | 'society_wide';
  simulations?: Array<Simulation | null | undefined>;
  subpage?: string;
  activeView?: string;
}) {
  captureCalculatorEvent('report_output_viewed', {
    country_id: params.report.countryId,
    year: params.report.year,
    report_id: params.report.id,
    calc_type: normalizeCalcType(params.calcType),
    output_subpage: params.subpage,
    active_view: params.activeView,
    report_config_snapshot: buildPersistedReportSnapshot(params.report, params.simulations),
  });
}

export function trackReportOutputSubpageViewed(params: {
  report: Report;
  calcType: 'household' | 'societyWide' | 'society_wide';
  simulations?: Array<Simulation | null | undefined>;
  subpage: string;
  activeView?: string;
}) {
  captureCalculatorEvent('report_output_subpage_viewed', {
    country_id: params.report.countryId,
    year: params.report.year,
    report_id: params.report.id,
    calc_type: normalizeCalcType(params.calcType),
    output_subpage: params.subpage,
    active_view: params.activeView,
    report_config_snapshot: buildPersistedReportSnapshot(params.report, params.simulations),
  });
}

/** Fires when user saves a custom policy */
export function trackPolicyCreated(params?: {
  countryId?: string;
  policyId?: string;
  parameterCount?: number;
  hasLabel?: boolean;
}) {
  captureCalculatorEvent('policy_created', {
    country_id: params?.countryId,
    policy_id: params?.policyId,
    parameter_count: params?.parameterCount,
    has_label: params?.hasLabel,
  });
}

/** Fires when user downloads CSV data from a chart */
export function trackChartCsvDownloaded(params?: {
  reportId?: string;
  calcType?: 'household' | 'societyWide' | 'society_wide';
  chartName?: string;
}) {
  captureCalculatorEvent('chart_csv_downloaded', {
    report_id: params?.reportId,
    calc_type: params?.calcType ? normalizeCalcType(params.calcType) : undefined,
    chart_name: params?.chartName,
  });
}

/** Fires when user copies Python reproduction code */
export function trackPythonCodeCopied(params?: {
  reportId?: string;
  calcType?: 'household' | 'societyWide' | 'society_wide';
}) {
  captureCalculatorEvent('python_code_copied', {
    report_id: params?.reportId,
    calc_type: params?.calcType ? normalizeCalcType(params.calcType) : undefined,
  });
}

/** Fires when a landing page is viewed */
export function trackLandingPageViewed(params: { page: string; countryId: string }) {
  captureCalculatorEvent('landing_page_viewed', {
    page: params.page,
    country_id: params.countryId,
  });
}
