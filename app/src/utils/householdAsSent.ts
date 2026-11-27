import type { Household } from '@/models/Household';
import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';
import {
  withSupportedBuilderClaimantRoles,
  type ClaimantRoleModelMetadata,
} from '@/utils/builderClaimantRoles';

/**
 * A household as the app sends it to API v1, wherever it is calculated,
 * reproduced or saved: a UK builder household with its claimant and
 * partner roles prepared for the loaded model (#1240), so policyengine-uk
 * does not read a lone parent and their adult child as a couple. Every
 * caller that sends a household goes through this (or
 * householdCreationPayload), so the same household is sent the same way
 * whichever page starts it, and a household on screen is compared with
 * one sent in the same form.
 */
export function householdAsSent(
  household: Household,
  metadata: ClaimantRoleModelMetadata | undefined,
  /** The year the roles are set in; the household's own unless given. */
  year?: string | number | null
): Household {
  return withSupportedBuilderClaimantRoles(household, metadata, year);
}

/** API v1's creation payload for a household as it is sent (householdAsSent). */
export function householdCreationPayload(
  household: Household,
  metadata: ClaimantRoleModelMetadata | undefined,
  year?: string | number | null
): V1HouseholdCreateEnvelope {
  return householdAsSent(household, metadata, year).toV1CreationPayload();
}
