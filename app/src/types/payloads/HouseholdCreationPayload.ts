import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';

/**
 * Legacy compatibility alias for the v1 household create payload.
 *
 * New household model work should prefer `V1HouseholdCreateEnvelope`.
 */
export type HouseholdCreationPayload = V1HouseholdCreateEnvelope;
