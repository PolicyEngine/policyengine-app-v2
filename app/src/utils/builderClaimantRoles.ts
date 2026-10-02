import { UK_CLAIMANT_OR_PARTNER_VARIABLE, type Household } from '@/models/Household';
import type { MetadataState } from '@/types/metadata';

export type ClaimantRoleModelMetadata = Pick<MetadataState, 'currentCountry' | 'variables'>;

function withoutClaimantRoles(household: Household): Household {
  const people = household.people;
  return Object.keys(people)
    .filter((personKey) => people[personKey][UK_CLAIMANT_OR_PARTNER_VARIABLE] !== undefined)
    .reduce(
      (next, personKey) =>
        next.removeEntityVariable('people', personKey, UK_CLAIMANT_OR_PARTNER_VARIABLE),
      household
    );
}

/**
 * Prepares a household's claimant and partner roles for the loaded model before it is saved,
 * so policyengine-uk does not infer a couple from ages alone.
 *
 * policyengine-core rejects a situation that names a variable its model lacks. So when the loaded
 * model information for the household's country defines the variable, a UK builder household
 * gets its roles; when it does not, any roles the household already carries are removed. Until
 * model information for the household's country has loaded, the household is left unchanged.
 */
export function withSupportedBuilderClaimantRoles(
  household: Household,
  metadata: ClaimantRoleModelMetadata | undefined,
  year: string | number | null = household.year
): Household {
  if (metadata?.currentCountry !== household.countryId) {
    return household;
  }

  if (!metadata.variables?.[UK_CLAIMANT_OR_PARTNER_VARIABLE]) {
    return withoutClaimantRoles(household);
  }

  return year === null ? household : household.withBuilderClaimantRoles(String(year));
}
