export type CalculatorCalcType = 'household' | 'society_wide';

export interface HouseholdSnapshot {
  household_id?: string;
  people_count: number;
  people: string[];
  group_counts: Record<string, number>;
  variable_names: string[];
  household_data: Record<string, unknown>;
}

export interface SimulationSnapshot {
  simulation_id?: string;
  label: string | null;
  policy_id?: string;
  population_id?: string;
  population_type?: 'household' | 'geography';
  population_label?: string | null;
}

export interface ReportConfigSnapshot {
  report_id?: string;
  label?: string | null;
  year?: string;
  simulation_count: number;
  calc_type?: CalculatorCalcType;
  simulation_ids?: string[];
  simulations: SimulationSnapshot[];
}

export interface CalcConfigSnapshot {
  calc_id: string;
  target_type: 'report' | 'simulation';
  country_id: string;
  year: string;
  report_id?: string;
  calc_type: CalculatorCalcType;
  simulations: SimulationSnapshot[];
  households: HouseholdSnapshot[];
  geographies: Array<{
    geography_id?: string;
    scope?: string;
  }>;
}

interface CalculatorBaseEventProperties {
  country_id?: string;
  year?: string;
  report_id?: string;
  simulation_id?: string;
  calc_id?: string;
  calc_type?: CalculatorCalcType;
  target_type?: 'report' | 'simulation';
  output_subpage?: string;
  active_view?: string;
  source?: string;
}

export interface CalculatorEventPayloadMap {
  calculation_completed: CalculatorBaseEventProperties & {
    duration_ms?: number;
    calc_config_snapshot?: CalcConfigSnapshot;
  };
  calculation_failed: CalculatorBaseEventProperties & {
    duration_ms?: number;
    error_message?: string;
    error_name?: string;
    calc_config_snapshot?: CalcConfigSnapshot;
  };
  calculation_started: CalculatorBaseEventProperties & {
    calc_config_snapshot: CalcConfigSnapshot;
  };
  chart_csv_downloaded: CalculatorBaseEventProperties & {
    chart_name?: string;
  };
  contact_clicked: Record<string, never>;
  household_builder_opened: CalculatorBaseEventProperties & {
    mode?: 'report' | 'standalone';
  };
  household_saved: CalculatorBaseEventProperties & {
    household_id?: string;
    marital_status: 'single' | 'married';
    num_children: number;
    household_snapshot: HouseholdSnapshot;
    mode?: 'report' | 'standalone';
  };
  household_variable_added: CalculatorBaseEventProperties & {
    variable_name: string;
    variable_label?: string;
    entity_scope: 'person' | 'household';
    entity_name?: string;
    people_count?: number;
    selected_variable_count?: number;
  };
  household_variable_removed: CalculatorBaseEventProperties & {
    variable_name: string;
    entity_scope: 'person' | 'household';
    entity_name?: string;
    people_count?: number;
    selected_variable_count?: number;
  };
  landing_page_viewed: CalculatorBaseEventProperties & {
    page: string;
  };
  newsletter_signup: Record<string, never>;
  policy_created: CalculatorBaseEventProperties & {
    parameter_count?: number;
    has_label?: boolean;
    policy_id?: string;
  };
  python_code_copied: CalculatorBaseEventProperties;
  report_created: CalculatorBaseEventProperties & {
    report_config_snapshot: ReportConfigSnapshot;
  };
  report_output_subpage_viewed: CalculatorBaseEventProperties & {
    report_config_snapshot?: ReportConfigSnapshot;
  };
  report_output_viewed: CalculatorBaseEventProperties & {
    report_config_snapshot?: ReportConfigSnapshot;
  };
  report_started: CalculatorBaseEventProperties & {
    report_config_snapshot: ReportConfigSnapshot;
  };
  society_wide_builder_opened: CalculatorBaseEventProperties;
  tool_engaged: {
    tool_slug: string;
    tool_title: string;
  };
}

export type CalculatorEventName = keyof CalculatorEventPayloadMap;
