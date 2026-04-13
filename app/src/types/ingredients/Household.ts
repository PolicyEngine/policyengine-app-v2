import type {
  CanonicalHouseholdInputData,
  CanonicalHouseholdInputEnvelope,
  CanonicalHouseholdInputGroup,
  CanonicalHouseholdInputPerson,
} from '@/models/household/canonicalTypes';

/**
 * Legacy compatibility aliases.
 *
 * These names are still used broadly across the app, but they now point at the
 * canonical household-input type family. New household model work should prefer
 * the explicit canonical/v1/v2 type modules under `models/household`.
 */

/** @deprecated Prefer `CanonicalHouseholdInputEnvelope`. */
export type Household = CanonicalHouseholdInputEnvelope;

/** @deprecated Prefer `CanonicalHouseholdInputData`. */
export type HouseholdData = CanonicalHouseholdInputData;

/** @deprecated Prefer `CanonicalHouseholdInputPerson`. */
export type HouseholdPerson = CanonicalHouseholdInputPerson;

/** @deprecated Prefer `CanonicalHouseholdInputGroup`. */
export type HouseholdGroupEntity = CanonicalHouseholdInputGroup;
