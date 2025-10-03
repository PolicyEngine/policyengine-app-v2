/**
 * Report element templates - predefined chart/analysis types that can be quickly added to reports
 * These templates generate the record requests needed for specific chart types without requiring LLM
 */

import { CreateAggregateChangeRequest } from './aggregateChanges';

export interface ReportElementTemplate {
  id: string;
  name: string;
  description: string;
  category: 'budget' | 'distributional' | 'poverty' | 'inequality' | 'labour' | 'household';
  aggregateChangeRequests?: (params: {
    modelId: string;
    baselineSimulationId: string;
    comparisonSimulationId: string;
    year: number;
  }) => CreateAggregateChangeRequest[];
  recordRequests?: (params: {
    country: string;
    baselinePolicyId: number;
    reformPolicyId: number;
    timePeriod: string;
    region?: string;
  }) => Array<{
    endpoint: string;
    params: Record<string, any>;
    description?: string;
  }>;
}

export const reportElementTemplates: ReportElementTemplate[] = [
  {
    id: 'budgetary-impact',
    name: 'Budgetary impact',
    description: 'Top-level government revenue, spending and balance',
    category: 'budget',
  },
  {
    id: 'detailed-budgetary-impact',
    name: 'Detailed budgetary impact',
    description: 'Breakdown by major programmes and taxes',
    category: 'budget',
  },
  {
    id: 'impact-by-decile',
    name: 'Impact by income decile',
    description: 'Average household income impact by income decile',
    category: 'distributional',
  },
  {
    id: 'poverty-impact',
    name: 'Poverty impact',
    description: 'Main poverty rates (BHC/AHC, absolute/relative)',
    category: 'poverty',
  },
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): ReportElementTemplate | undefined {
  return reportElementTemplates.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: ReportElementTemplate['category']): ReportElementTemplate[] {
  return reportElementTemplates.filter(t => t.category === category);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): Array<{ id: ReportElementTemplate['category']; name: string }> {
  return [
    { id: 'budget', name: 'Budgetary' },
    { id: 'distributional', name: 'Distributional' },
    { id: 'poverty', name: 'Poverty' },
  ];
}