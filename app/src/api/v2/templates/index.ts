/**
 * Template configurations registry
 */

import type { TemplateConfigGetter } from './types';
import { budgetaryImpactConfig } from './budgetaryImpact';
import { detailedBudgetaryImpactConfig } from './detailedBudgetaryImpact';
import { impactByDecileConfig } from './impactByDecile';
import { povertyImpactConfig } from './povertyImpact';

export type { TemplateVariableConfig, TemplateConfig, TemplateConfigGetter } from './types';

export const templateConfigs: Record<string, TemplateConfigGetter> = {
  'budgetary-impact': budgetaryImpactConfig,
  'detailed-budgetary-impact': detailedBudgetaryImpactConfig,
  'impact-by-decile': impactByDecileConfig,
  'poverty-impact': povertyImpactConfig,
};

export function getTemplateConfig(templateId: string, country: string | null) {
  const configGetter = templateConfigs[templateId];
  if (!configGetter) {
    throw new Error(`Unknown template: ${templateId}`);
  }
  return configGetter(country);
}
