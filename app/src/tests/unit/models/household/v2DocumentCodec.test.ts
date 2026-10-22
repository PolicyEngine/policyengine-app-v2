import { describe, expect, test } from 'vitest';
import {
  haveSameStoredContent,
  householdFromV2Item,
  householdToV2CreateBody,
  V2HouseholdDocumentError,
} from '@/models/household/v2DocumentCodec';
import {
  STORED_V2_HOUSEHOLD_ID,
  storedV2Household,
  UK_DOCUMENT_WITH_TWO_YEARS,
  UK_DOCUMENT_WITHOUT_SOURCE_NAMES,
  UK_DOCUMENT_WITHOUT_YEARS,
  UK_SINGLE_PARENT,
  UK_SINGLE_PARENT_V2_BODY,
  US_COUPLE_WITH_TWO_CHILDREN,
  US_PERSON_WITHOUT_MARITAL_UNIT,
  US_SINGLE_PARENT,
  US_SINGLE_PARENT_V2_BODY,
  V2_CODEC_YEAR,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';

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

  test.each([
    ['inputs in two years', UK_DOCUMENT_WITH_TWO_YEARS],
    ['values that name no year', UK_DOCUMENT_WITHOUT_YEARS],
  ])(
    'given a stored household with %s then it reads back in its stored default year',
    (_case, document) => {
      const household = householdFromV2Item(storedV2Household('uk', document));

      expect(household.year).toBe(2026);
      expect(householdToV2CreateBody(household).default_year).toBe(2026);
    }
  );

  test('given a stored household without a default year then it reads back in the year its values name', () => {
    const household = householdFromV2Item({
      ...storedV2Household('uk', UK_SINGLE_PARENT_V2_BODY.household_data),
      default_year: null,
    });

    expect(household.year).toBe(Number(V2_CODEC_YEAR));
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

describe('haveSameStoredContent', () => {
  test('given a household and the same household read back from the Public API then they are the same', () => {
    const body = householdToV2CreateBody(US_COUPLE_WITH_TWO_CHILDREN);
    const readBack = householdFromV2Item(storedV2Household(body.country_id, body.household_data));

    expect(haveSameStoredContent(US_COUPLE_WITH_TWO_CHILDREN, readBack)).toBe(true);
  });

  test('given a different label or id then they are still the same stored household', () => {
    expect(
      haveSameStoredContent(
        US_SINGLE_PARENT,
        US_SINGLE_PARENT.withLabel('Our family').withId(STORED_V2_HOUSEHOLD_ID)
      )
    ).toBe(true);
  });

  test('given a changed input then they differ', () => {
    const edited = US_SINGLE_PARENT.setPersonVariableAtYear(
      'you',
      'employment_income',
      V2_CODEC_YEAR,
      40000
    );

    expect(haveSameStoredContent(US_SINGLE_PARENT, edited)).toBe(false);
  });

  test('given a household that cannot be stored then it is compared as changed', () => {
    expect(
      haveSameStoredContent(US_PERSON_WITHOUT_MARITAL_UNIT, US_PERSON_WITHOUT_MARITAL_UNIT)
    ).toBe(false);
  });
});
