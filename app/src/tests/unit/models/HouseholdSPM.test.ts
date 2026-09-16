import { describe, expect, test } from 'vitest';
import { Household } from '@/models/Household';
import {
  COUNTY_SPM,
  NATIONAL_SPM,
  RESOLVED_CANONICAL_METADATA,
  RESOLVED_LEGACY_METADATA,
  SPM_TEST_YEAR,
  stateOnlyHousehold,
} from '@/tests/fixtures/spm/spmMocks';
import { HouseholdValidation } from '@/utils/HouseholdValidation';
import { getSPMSelectionError } from '@/utils/spmSelection';

describe('household SPM settings', () => {
  test('given a selected geography then edits and saved-household replay preserve it', () => {
    const initial = stateOnlyHousehold().withSPM(NATIONAL_SPM);
    const edited = initial
      .withId('saved-household')
      .withLabel('Household')
      .setPersonVariableAtYear('you', 'employment_income', SPM_TEST_YEAR, 50000)
      .withBuilderChildCount(SPM_TEST_YEAR, 1);
    const payload = edited.toV1CreationPayload();
    expect(payload.spm).toEqual(NATIONAL_SPM);
    expect(payload.data).not.toHaveProperty('spm');
    const reloaded = Household.fromV1Metadata({
      id: edited.id,
      country_id: 'us',
      label: edited.label,
      household_json: payload.data,
      spm: payload.spm,
      api_version: 'test',
      household_hash: 'test-hash',
    });
    expect(reloaded.toV1CreationPayload()).toEqual(payload);
    expect(Household.fromAppInput(JSON.parse(JSON.stringify(edited))).spm).toEqual(NATIONAL_SPM);
    expect(Household.fromV1CreationPayload(payload).spm).toEqual(NATIONAL_SPM);
  });

  test('given different geography choices then household identity differs', () => {
    const household = stateOnlyHousehold();
    expect(household.withSPM(NATIONAL_SPM).isEqual(household.withSPM(COUNTY_SPM))).toBe(false);
  });

  test('given canonical availability then a state-only household requires an explicit choice', () => {
    const household = stateOnlyHousehold();
    expect(getSPMSelectionError(household, SPM_TEST_YEAR, RESOLVED_CANONICAL_METADATA)).toContain(
      'choose national or local'
    );
    expect(
      HouseholdValidation.isReadyForSimulation(
        household,
        'us',
        SPM_TEST_YEAR,
        RESOLVED_CANONICAL_METADATA
      ).isValid
    ).toBe(false);
    expect(
      getSPMSelectionError(
        household.withSPM(NATIONAL_SPM),
        SPM_TEST_YEAR,
        RESOLVED_CANONICAL_METADATA
      )
    ).toBeNull();
  });

  test('given local thresholds then only explicit county_fips satisfies geography input', () => {
    const household = stateOnlyHousehold()
      .withSPM(COUNTY_SPM)
      .setGroupVariableAtYear(
        'households',
        'your household',
        'county',
        SPM_TEST_YEAR,
        'LOS_ANGELES_COUNTY_CA'
      );
    expect(getSPMSelectionError(household, SPM_TEST_YEAR, RESOLVED_CANONICAL_METADATA)).toContain(
      'five-digit county'
    );
    const withCounty = household.setGroupVariableAtYear(
      'households',
      'your household',
      'county_fips',
      SPM_TEST_YEAR,
      '06037'
    );
    expect(getSPMSelectionError(withCounty, SPM_TEST_YEAR, RESOLVED_CANONICAL_METADATA)).toBeNull();
  });

  test('given an unavailable canonical model then saved settings cannot silently fall back', () => {
    expect(
      getSPMSelectionError(stateOnlyHousehold().withSPM(NATIONAL_SPM), SPM_TEST_YEAR, {
        ...RESOLVED_LEGACY_METADATA,
        spm: { available: false },
      })
    ).toContain('certified model release');
  });

  test('given legacy metadata or UK then existing households stay unchanged', () => {
    expect(
      getSPMSelectionError(stateOnlyHousehold(), SPM_TEST_YEAR, RESOLVED_LEGACY_METADATA)
    ).toBeNull();
    const uk = Household.starter('uk', SPM_TEST_YEAR);
    expect(
      getSPMSelectionError(uk, SPM_TEST_YEAR, {
        ...RESOLVED_CANONICAL_METADATA,
        currentCountry: 'uk',
      })
    ).toBeNull();
    expect(uk.toV1CreationPayload()).not.toHaveProperty('spm');
    expect(stateOnlyHousehold().toV1CreationPayload()).not.toHaveProperty('spm');
  });
});
