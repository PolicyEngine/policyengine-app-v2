import type {
  CanonicalHouseholdInputData,
  CanonicalHouseholdInputEnvelope,
  CanonicalStructuredEntityValues,
  CanonicalStructuredGroup,
  CanonicalStructuredHouseholdData,
  CanonicalStructuredHouseholdState,
  ComparableHousehold,
  HouseholdModelData,
} from './canonicalTypes';
import type {
  V1HouseholdCreateEnvelope,
  V1HouseholdData,
  V1HouseholdMetadataEnvelope,
} from './v1Types';
import type {
  V2CreateHouseholdEnvelope,
  V2HouseholdEnvelope,
  V2StoredHouseholdEnvelope,
} from './v2Types';

export type { ComparableHousehold, HouseholdModelData } from './canonicalTypes';
export type {
  CanonicalGroupSetup,
  CanonicalHouseholdInputData,
  CanonicalHouseholdInputEnvelope,
  CanonicalHouseholdInputGroup,
  CanonicalHouseholdInputPerson,
  CanonicalHouseholdSetup,
  CanonicalPersonSetup,
} from './canonicalTypes';
export type {
  V1HouseholdCreateEnvelope,
  V1HouseholdData,
  V1HouseholdGroupData,
  V1HouseholdGroupProperties,
  V1HouseholdMemberGroup,
  V1HouseholdMetadataEnvelope,
  V1HouseholdPersonData,
} from './v1Types';
export type {
  V2CreateHouseholdEnvelope,
  V2HouseholdCalculationPayload,
  V2HouseholdData,
  V2HouseholdEnvelope,
  V2HouseholdGroupData,
  V2HouseholdPersonData,
  V2StoredHouseholdEnvelope,
} from './v2Types';

// Transitional aliases used by the current household implementation.
export type HouseholdInput = CanonicalHouseholdInputEnvelope;
export type CanonicalEntityValues = CanonicalStructuredEntityValues;
export type CanonicalGroup = CanonicalStructuredGroup;
export type CanonicalHouseholdData = CanonicalStructuredHouseholdData;
export type CanonicalHouseholdState = CanonicalStructuredHouseholdState;
export type HouseholdV1PayloadData = V1HouseholdData;
export type HouseholdV1Metadata = V1HouseholdMetadataEnvelope;
export type HouseholdComparableShape = V2CreateHouseholdEnvelope;

// Transitional aliases to keep the current model/codecs stable while the taxonomy
// becomes explicit in follow-up commits.
export type LegacyHouseholdModelData = HouseholdModelData;
export type LegacyHouseholdInputData = CanonicalHouseholdInputData;
export type LegacyV1HouseholdCreateEnvelope = V1HouseholdCreateEnvelope;
