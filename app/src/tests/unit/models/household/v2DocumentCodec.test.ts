import { describe, expect, test } from 'vitest';
import {
  householdFromV2Item,
  householdToV2CreateBody,
  V2HouseholdDocumentError,
} from '@/models/household/v2DocumentCodec';
import {
  STORED_V2_HOUSEHOLD_ID,
  storedV2Household,
  UK_DOCUMENT_WITHOUT_SOURCE_NAMES,
  UK_SINGLE_PARENT,
  UK_SINGLE_PARENT_V2_BODY,
  US_COUPLE_WITH_TWO_CHILDREN,
  US_PERSON_WITHOUT_MARITAL_UNIT,
  US_SINGLE_PARENT,
  US_SINGLE_PARENT_V2_BODY,
} from '@/tests/fixtures/models/v2DocumentCodecMocks';

describe('householdToV2CreateBody', () => {
  test('given a US household then it is the document the Public API translates its v1 form into', () => {
    expect(householdToV2CreateBody(US_SINGLE_PARENT)).toEqual(US_SINGLE_PARENT_V2_BODY);
  });

  test('given a UK household then it has people, households and benefit units only', () => {
    expect(householdToV2CreateBody(UK_SINGLE_PARENT)).toEqual(UK_SINGLE_PARENT_V2_BODY);
  });

  test('given a labelled household then the label is not sent: v2 households have no presentation fields', () => {
    const body = householdToV2CreateBody(US_SINGLE_PARENT.withLabel('Our family'));

    expect(JSON.stringify(body)).not.toContain('Our family');
  });

  test('given a person outside one of the collections then it fails, naming the collection', () => {
    expect(() => householdToV2CreateBody(US_PERSON_WITHOUT_MARITAL_UNIT)).toThrow(
      V2HouseholdDocumentError
    );
    expect(() => householdToV2CreateBody(US_PERSON_WITHOUT_MARITAL_UNIT)).toThrow(
      'child is not in any marital unit.'
    );
  });
});

describe('householdFromV2Item', () => {
  test('given a stored US household then it reads back as the household that was saved', () => {
    const stored = storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data);

    const household = householdFromV2Item(stored);

    expect(household.toV1CreationPayload()).toEqual(US_SINGLE_PARENT.toV1CreationPayload());
    expect(household.spm).toEqual({ geography_kind: 'national' });
  });

  test('given a household saved and read back then nothing is lost', () => {
    for (const original of [US_COUPLE_WITH_TWO_CHILDREN, UK_SINGLE_PARENT]) {
      const body = householdToV2CreateBody(original);

      const household = householdFromV2Item(
        storedV2Household(body.country_id, body.household_data)
      );

      expect(household.toV1CreationPayload()).toEqual(original.toV1CreationPayload());
    }
  });

  test('given a stored household then it carries the stored id and year', () => {
    const household = householdFromV2Item(
      storedV2Household('uk', UK_SINGLE_PARENT_V2_BODY.household_data)
    );

    expect(household.id).toBe(STORED_V2_HOUSEHOLD_ID);
    expect(household.countryId).toBe('uk');
    expect(household.year).toBe(2026);
  });

  test('given a household stored without v1 names then its ids name its people and groups', () => {
    const household = householdFromV2Item(
      storedV2Household('uk', UK_DOCUMENT_WITHOUT_SOURCE_NAMES)
    );

    const data = household.toV1CreationPayload().data;
    expect(Object.keys(data.people)).toEqual(['adult']);
    expect(data.households).toEqual({ home: { members: ['adult'] } });
    expect(data.benunits).toEqual({ family: { members: ['adult'] } });
  });
});
