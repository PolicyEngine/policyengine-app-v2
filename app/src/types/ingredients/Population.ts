import type { CanonicalHouseholdInputEnvelope } from '@/models/household/canonicalTypes';
import { Geography } from './Geography';

/**
 * Population type for Redux state management
 * Can contain either a Household or Geography, plus metadata
 */
export interface Population {
  label?: string | null;
  isCreated?: boolean;
  household?: CanonicalHouseholdInputEnvelope | null;
  geography?: Geography | null;
}
