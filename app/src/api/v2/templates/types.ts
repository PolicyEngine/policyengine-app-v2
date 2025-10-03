/**
 * Shared types for report element templates
 */

export interface TemplateVariableConfig {
  variable: string;
  aggregateFunction?: 'sum' | 'mean' | 'median' | 'count';
  entity?: string;
  filterVariable?: string;
  filterValue?: string;
  filterQuantileLeq?: number;
  filterQuantileGeq?: number;
}

export interface TemplateConfig {
  variables: TemplateVariableConfig[];
}

export type TemplateConfigGetter = (country: string | null) => TemplateConfig;
