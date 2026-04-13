import type {
  CanonicalStructuredHouseholdState,
  ComparableHousehold,
} from './canonicalTypes';
import { sortRecordKeysRecursively } from './utils';
import { buildV2HouseholdShape } from './v2Codec';

export function buildComparableHousehold(
  state: CanonicalStructuredHouseholdState
): ComparableHousehold {
  const v2Shape = buildV2HouseholdShape(state);
  const comparableData = {
    people: v2Shape.people,
    tax_unit: v2Shape.tax_unit ?? null,
    family: v2Shape.family ?? null,
    spm_unit: v2Shape.spm_unit ?? null,
    marital_unit: v2Shape.marital_unit ?? null,
    household: v2Shape.household ?? null,
    benunit: v2Shape.benunit ?? null,
  };

  return {
    id: state.id,
    countryId: state.countryId,
    year: v2Shape.year,
    label: state.label,
    data: sortRecordKeysRecursively(comparableData) as Record<string, unknown>,
  };
}
