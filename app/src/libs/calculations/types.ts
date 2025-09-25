import { Simulation } from '@/types/ingredients/Simulation';
import { Household } from '@/types/ingredients/Household';
import { Geography } from '@/types/ingredients/Geography';

export type CalculationType = 'household' | 'economy';

/**
 * Pure type determination
 */
export function determineCalculationType(
  simulation: Simulation | null
): CalculationType {
  if (simulation?.populationType === 'household') {
    return 'household';
  }
  if (simulation?.populationType === 'geography') {
    return 'economy';
  }
  throw new Error(`Unknown population type: ${simulation?.populationType}`);
}

/**
 * Extract population ID based on calculation type
 */
export function extractPopulationId(
  type: CalculationType,
  household?: Household | null,
  geography?: Geography | null
): string {
  if (type === 'household') {
    if (!household?.id) {
      throw new Error('Household ID required for household calculation');
    }
    return household.id;
  }

  if (!geography) {
    throw new Error('Geography required for economy calculation');
  }
  return geography.geographyId || geography.id || '';
}

/**
 * Determine if region parameter is needed
 */
export function extractRegion(
  geography?: Geography | null
): string | undefined {
  if (geography?.scope === 'subnational' && geography.geographyId) {
    return geography.geographyId;
  }
  return undefined;
}