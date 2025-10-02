/**
 * Report element templates - predefined chart/analysis types that can be quickly added to reports
 * These templates generate the record requests needed for specific chart types without requiring LLM
 */

export interface ReportElementTemplate {
  id: string;
  name: string;
  description: string;
  category: 'budget' | 'distributional' | 'poverty' | 'inequality' | 'labor' | 'household';
  recordRequests: (params: {
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
  // Budget impact templates
  {
    id: 'budgetary-impact',
    name: 'Budgetary impact',
    description: 'Top-level government revenue, spending and balance',
    category: 'budget',
    recordRequests: ({ country, baselinePolicyId, reformPolicyId, timePeriod, region }) => [
      {
        endpoint: `/${country}/economy/${baselinePolicyId}/${reformPolicyId}`,
        params: {
          region: region || country,
          time_period: timePeriod,
        },
        description: 'Fetch budgetary impact data',
      }
    ],
  },
  {
    id: 'detailed-budgetary-impact',
    name: 'Detailed budgetary impact',
    description: 'Breakdown of budgetary impact by individual benefits and taxes',
    category: 'budget',
    recordRequests: ({ country, baselinePolicyId, reformPolicyId, timePeriod, region }) => [
      {
        endpoint: `/${country}/economy/${baselinePolicyId}/${reformPolicyId}`,
        params: {
          region: region || country,
          time_period: timePeriod,
        },
        description: 'Fetch detailed budgetary impact by program',
      }
    ],
  },

  // Distributional impact templates
  {
    id: 'average-impact-by-income-decile',
    name: 'Average impact by income decile',
    description: 'Bar chart showing average household income change by income decile',
    category: 'distributional',
    recordRequests: ({ country, baselinePolicyId, reformPolicyId, timePeriod, region }) => [
      {
        endpoint: `/${country}/economy/${baselinePolicyId}/${reformPolicyId}`,
        params: {
          region: region || country,
          time_period: timePeriod,
        },
        description: 'Fetch average income change by decile',
      }
    ],
  },
  {
    id: 'relative-impact-by-income-decile',
    name: 'Relative impact by income decile',
    description: 'Bar chart showing percentage income change by income decile',
    category: 'distributional',
    recordRequests: ({ country, baselinePolicyId, reformPolicyId, timePeriod, region }) => [
      {
        endpoint: `/${country}/economy/${baselinePolicyId}/${reformPolicyId}`,
        params: {
          region: region || country,
          time_period: timePeriod,
        },
        description: 'Fetch relative income change by decile',
      }
    ],
  },

  // Poverty impact templates
  {
    id: 'poverty-impact',
    name: 'Poverty impact',
    description: 'Bar chart showing relative change in poverty rates by age group',
    category: 'poverty',
    recordRequests: ({ country, baselinePolicyId, reformPolicyId, timePeriod, region }) => [
      {
        endpoint: `/${country}/economy/${baselinePolicyId}/${reformPolicyId}`,
        params: {
          region: region || country,
          time_period: timePeriod,
        },
        description: 'Fetch poverty rate changes by age group',
      }
    ],
  },
  {
    id: 'deep-poverty-impact',
    name: 'Deep poverty impact',
    description: 'Bar chart showing relative change in deep poverty rates by age group',
    category: 'poverty',
    recordRequests: ({ country, baselinePolicyId, reformPolicyId, timePeriod, region }) => [
      {
        endpoint: `/${country}/economy/${baselinePolicyId}/${reformPolicyId}`,
        params: {
          region: region || country,
          time_period: timePeriod,
        },
        description: 'Fetch deep poverty rate changes by age group',
      }
    ],
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
    { id: 'budget', name: 'Budget' },
    { id: 'distributional', name: 'Distributional' },
    { id: 'poverty', name: 'Poverty' },
    { id: 'inequality', name: 'Inequality' },
    { id: 'labor', name: 'Labour supply' },
    { id: 'household', name: 'Household' },
  ];
}