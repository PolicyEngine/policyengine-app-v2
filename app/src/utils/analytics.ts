/**
 * GA4 event tracking utility
 *
 * Wraps window.gtag calls. The gtag script is loaded by the page shell
 * (calculator-app/src/app/layout.tsx).
 * This module provides typed helpers so components don't call window.gtag
 * directly.
 *
 * v3 (flagship) events. Each fires once per user action, from an event
 * handler (never from render, nor from an effect that strict mode can
 * repeat), and only in v3 code paths. Parameter keys are snake_case. No
 * event carries household input values, names, free text or search text.
 *
 * | Event                         | When                                      | Parameters |
 * | ----------------------------- | ----------------------------------------- | ---------- |
 * | household_added               | "Add a household" in a report             | country_id, household_count |
 * | household_removed             | A household's "Remove"                    | country_id, household_count |
 * | household_calculated          | A household run ends (success or failure) | country_id, household_count, people_count, non_default_inputs, duration_ms, success, error_category (failure only: network, timeout, invalid_result, other) |
 * | household_calculation_retried | "Try again" on a failed household         | country_id |
 * | household_output_viewed       | A household output tab is opened          | country_id, tab (summary, net_income, varying_earnings, marginal_tax_rates) |
 * | household_picker_opened       | The household variable picker opens       | country_id, entity (person, group) |
 * | household_variable_added      | An input is added from the picker         | country_id, variable (model variable name), source (featured, related, topic, search), entity (person, group) |
 * | report_tab_viewed             | A report section tab is opened            | country_id, tab, region_kind |
 * | report_adjusted               | "Recompute" in the report's adjust panel  | country_id, region_kind, values_changed, years_changed, region_changed, provisions_removed, renamed |
 * | local_area_map_toggled        | A UK report's local area map is switched  | country_id, area (constituencies, local_authorities) |
 * | parameter_search_selected     | A Build search result is picked           | country_id, rank (1-based), is_breakdown, in_folder, query_length |
 * | report_run_started            | "Save and run" in Build                   | country_id, region_kind, years_in_window, provision_count, baseline (current_law, saved_reform) |
 *
 * region_kind is one of national, state, district, place, country,
 * constituency, local_authority or other: never the region itself.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

/** Fires when a calculation (household or economy) completes successfully */
export function trackSimulationCompleted(params: {
  calcType: 'household' | 'societyWide';
  countryId: string;
}) {
  trackEvent('simulation_completed', params);
}

/** Fires after 15s on an iframe tool page */
export function trackToolEngaged(params: { toolSlug: string; toolTitle: string }) {
  trackEvent('tool_engaged', {
    ...params,
    tool_name: params.toolSlug,
    tool_title: params.toolTitle,
  });
}

/** Fires when user clicks the email contact link */
export function trackContactClicked() {
  trackEvent('contact_clicked');
}

/** Fires on successful newsletter subscription */
export function trackNewsletterSignup() {
  trackEvent('newsletter_signup');
}

/** Fires when user clicks "Build Report" to start the creation flow */
export function trackReportStarted() {
  trackEvent('report_started');
}

/** Fires when user saves a custom policy */
export function trackPolicyCreated() {
  trackEvent('policy_created');
}

/** Fires when user downloads CSV data from a chart */
export function trackChartCsvDownloaded() {
  trackEvent('chart_csv_downloaded');
}

/** Fires when user downloads an SVG image of a chart */
export function trackChartSvgDownload() {
  trackEvent('chart_svg_downloaded');
}

/** Fires when user copies Python reproduction code */
export function trackPythonCodeCopied() {
  trackEvent('python_code_copied');
}

/** Fires when a landing page is viewed */
export function trackLandingPageViewed(params: { page: string; countryId: string }) {
  trackEvent('landing_page_viewed', params);
}

// ---------------------------------------------------------------------------
// v3 (flagship) events: see the table at the top of this file.
// ---------------------------------------------------------------------------

/** The kind of region a report runs on; never the region itself. */
export type RegionKind =
  | 'national'
  | 'state'
  | 'district'
  | 'place'
  | 'country'
  | 'constituency'
  | 'local_authority'
  | 'other';

const REGION_PREFIXES: Array<[string, RegionKind]> = [
  ['state/', 'state'],
  ['congressional_district/', 'district'],
  ['place/', 'place'],
  ['country/', 'country'],
  ['constituency/', 'constituency'],
  ['local_authority/', 'local_authority'],
];

/** "state/ca" → "state"; no region, or the country itself, → "national". */
export function regionKindOf(region: string | null | undefined, countryId?: string): RegionKind {
  const code = (region ?? '').trim().toLowerCase();
  if (!code || code === countryId || code === 'us' || code === 'uk' || code === 'national') {
    return 'national';
  }
  return REGION_PREFIXES.find(([prefix]) => code.startsWith(prefix))?.[1] ?? 'other';
}

/** Why a household run failed, as a fixed category: never the message. */
export type HouseholdErrorCategory = 'network' | 'timeout' | 'invalid_result' | 'other';

export function householdErrorCategory(error: unknown): HouseholdErrorCategory {
  const cause = error instanceof Error ? error.cause : undefined;
  if (error instanceof TypeError || cause instanceof TypeError) {
    return 'network';
  }
  const message = error instanceof Error ? error.message : '';
  if (/timed out|took too long/i.test(message)) {
    return 'timeout';
  }
  if (/no net income/i.test(message)) {
    return 'invalid_result';
  }
  return 'other';
}

export type HouseholdEntityKind = 'person' | 'group';
export type HouseholdVariableSource = 'featured' | 'related' | 'topic' | 'search';
export type HouseholdOutputTab =
  | 'summary'
  | 'net_income'
  | 'varying_earnings'
  | 'marginal_tax_rates';

/** Fires when the reader adds a household to a report */
export function trackHouseholdAdded(params: { countryId: string; householdCount: number }) {
  trackEvent('household_added', {
    country_id: params.countryId,
    household_count: params.householdCount,
  });
}

/** Fires when the reader removes a household from a report */
export function trackHouseholdRemoved(params: { countryId: string; householdCount: number }) {
  trackEvent('household_removed', {
    country_id: params.countryId,
    household_count: params.householdCount,
  });
}

/** Fires once when a household run ends, successfully or not */
export function trackHouseholdCalculated(params: {
  countryId: string;
  householdCount: number;
  peopleCount: number;
  nonDefaultInputs: number;
  durationMs: number;
  success: boolean;
  errorCategory?: HouseholdErrorCategory;
}) {
  trackEvent('household_calculated', {
    country_id: params.countryId,
    household_count: params.householdCount,
    people_count: params.peopleCount,
    non_default_inputs: params.nonDefaultInputs,
    duration_ms: Math.max(0, Math.round(params.durationMs)),
    success: params.success,
    ...(params.success ? {} : { error_category: params.errorCategory ?? 'other' }),
  });
}

/** Fires when the reader retries a failed household run */
export function trackHouseholdCalculationRetried(params: { countryId: string }) {
  trackEvent('household_calculation_retried', { country_id: params.countryId });
}

/** Fires when the reader opens a household output tab */
export function trackHouseholdOutputViewed(params: { countryId: string; tab: HouseholdOutputTab }) {
  trackEvent('household_output_viewed', { country_id: params.countryId, tab: params.tab });
}

/** Fires when the household variable picker opens */
export function trackHouseholdPickerOpened(params: {
  countryId: string;
  entity: HouseholdEntityKind;
}) {
  trackEvent('household_picker_opened', { country_id: params.countryId, entity: params.entity });
}

/** Fires when the reader adds an input to a household; `variable` is a model variable name */
export function trackHouseholdVariableAdded(params: {
  countryId: string;
  variable: string;
  source: HouseholdVariableSource;
  entity: HouseholdEntityKind;
}) {
  trackEvent('household_variable_added', {
    country_id: params.countryId,
    variable: params.variable,
    source: params.source,
    entity: params.entity,
  });
}

/** Fires when the reader opens a report section tab */
export function trackReportTabViewed(params: {
  countryId: string;
  tab: string;
  regionKind: RegionKind;
}) {
  trackEvent('report_tab_viewed', {
    country_id: params.countryId,
    tab: params.tab,
    region_kind: params.regionKind,
  });
}

/** Fires when the reader recomputes a report from its adjust panel */
export function trackReportAdjusted(params: {
  countryId: string;
  regionKind: RegionKind;
  valuesChanged: boolean;
  yearsChanged: boolean;
  regionChanged: boolean;
  provisionsRemoved: number;
  renamed: boolean;
}) {
  trackEvent('report_adjusted', {
    country_id: params.countryId,
    region_kind: params.regionKind,
    values_changed: params.valuesChanged,
    years_changed: params.yearsChanged,
    region_changed: params.regionChanged,
    provisions_removed: params.provisionsRemoved,
    renamed: params.renamed,
  });
}

/** Fires when the reader switches a UK report's local area map */
export function trackLocalAreaMapToggled(params: {
  countryId: string;
  area: 'constituencies' | 'local_authorities';
}) {
  trackEvent('local_area_map_toggled', { country_id: params.countryId, area: params.area });
}

/** Fires when the reader picks a parameter search result in Build; never the query text */
export function trackParameterSearchSelected(params: {
  countryId: string;
  rank: number;
  isBreakdown: boolean;
  inFolder: boolean;
  queryLength: number;
}) {
  trackEvent('parameter_search_selected', {
    country_id: params.countryId,
    rank: params.rank,
    is_breakdown: params.isBreakdown,
    in_folder: params.inFolder,
    query_length: params.queryLength,
  });
}

/** Fires when the reader starts a report run from Build */
export function trackReportRunStarted(params: {
  countryId: string;
  regionKind: RegionKind;
  yearsInWindow: number;
  provisionCount: number;
  baseline: 'current_law' | 'saved_reform';
}) {
  trackEvent('report_run_started', {
    country_id: params.countryId,
    region_kind: params.regionKind,
    years_in_window: params.yearsInWindow,
    provision_count: params.provisionCount,
    baseline: params.baseline,
  });
}
