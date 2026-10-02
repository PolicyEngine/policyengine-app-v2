import { UK_CLAIMANT_OR_PARTNER_VARIABLE, type Household } from '@/models/Household';
import type { MetadataState } from '@/types/metadata';

export type ClaimantRoleModelMetadata = Pick<MetadataState, 'currentCountry' | 'variables'>;

/**
 * Adds explicit claimant and partner roles to a UK builder household before it is saved, so
 * policyengine-uk does not infer a couple from ages alone.
 *
 * policyengine-core rejects a situation that names a variable its model lacks, so the roles are
 * added only when the loaded model information for the household's country defines the
 * variable. Until the API's model does, households save exactly as before.
 */
export function withSupportedBuilderClaimantRoles(
  household: Household,
  metadata: ClaimantRoleModelMetadata | undefined,
  year: string | number | null = household.year
): Household {
  if (
    year === null ||
    metadata?.currentCountry !== household.countryId ||
    !metadata.variables?.[UK_CLAIMANT_OR_PARTNER_VARIABLE]
  ) {
    return household;
  }

  return household.withBuilderClaimantRoles(String(year));
}
