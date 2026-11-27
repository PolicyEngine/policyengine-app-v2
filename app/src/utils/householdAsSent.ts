import type { Household } from '@/models/Household';
import {
  withSupportedBuilderClaimantRoles,
  type ClaimantRoleModelMetadata,
} from '@/utils/builderClaimantRoles';

/**
 * A household as v3 sends it to API v1, wherever it is calculated,
 * reproduced or saved: a UK builder household with its claimant and
 * partner roles prepared for the loaded model (#1240), so policyengine-uk
 * does not read a lone parent and their adult child as a couple. The
 * Household tab and the standalone household report send their
 * households through it (useRequestedHouseholdRun); the standalone
 * report's saved households are stored through it (SaveHouseholdForm),
 * and the tab's background save (useSaveCalculatedHousehold) points at
 * the household its run already sent. So the same household is sent the
 * same way whichever v3 page starts it, and a household on screen is
 * compared with one sent in the same form. The v2 report builder's own
 * flows still call withSupportedBuilderClaimantRoles themselves.
 */
export function householdAsSent(
  household: Household,
  metadata: ClaimantRoleModelMetadata | undefined,
  /** The year the roles are set in; the household's own unless given. */
  year?: string | number | null
): Household {
  return withSupportedBuilderClaimantRoles(household, metadata, year);
}
