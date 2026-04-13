import type {
  V1HouseholdData,
  V1HouseholdGroupProperties,
  V1HouseholdMemberGroup,
  V1HouseholdMetadataEnvelope,
  V1HouseholdPersonData,
} from '@/models/household/v1Types';

/**
 * Legacy compatibility aliases for the v1 household transport family.
 *
 * New household model work should prefer the explicit v1 household types under
 * `models/household/v1Types`.
 */

/** @deprecated Prefer `V1HouseholdMetadataEnvelope`. */
export type HouseholdMetadata = V1HouseholdMetadataEnvelope;

/** @deprecated Prefer `V1HouseholdData`. */
export type HouseholdData = V1HouseholdData;

/** @deprecated Prefer `V1HouseholdPersonData`. */
export type HouseholdPerson = V1HouseholdPersonData;

/** @deprecated Prefer `V1HouseholdMemberGroup`. */
export type MemberGroup = V1HouseholdMemberGroup;

/** @deprecated Prefer `V1HouseholdGroupProperties`. */
export type HouseholdProperties = V1HouseholdGroupProperties;
