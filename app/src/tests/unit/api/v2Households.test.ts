import { describe, expect, test } from 'vitest';
import { ApiSavedHouseholdStore } from '@/api/savedHouseholdStore';
import { fetchV2Household, storeV2Household } from '@/api/v2Households';
import { userHouseholdItem } from '@/tests/fixtures/api/savedHouseholdMocks';
import { requestsFor, routedClient } from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import { itemResponse } from '@/tests/fixtures/api/v2UserMocks';
import {
  storedV2Household,
  US_SINGLE_PARENT,
  US_SINGLE_PARENT_V2_BODY,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';

const STORE = 'POST /v2/households';

describe('storeV2Household', () => {
  test('given a household then it is stored through POST /v2/households, and the stored record returned', async () => {
    // Given
    const stored = storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data);
    const { householdClient, fetchMock } = routedClient({
      [STORE]: () => itemResponse(stored, 201),
    });

    // When
    const item = await storeV2Household(US_SINGLE_PARENT, householdClient);

    // Then
    const [request] = requestsFor(fetchMock, STORE);
    expect(new URL(request.url).searchParams.get('country_id')).toBe('us');
    expect(await request.json()).toEqual(US_SINGLE_PARENT_V2_BODY);
    expect(item).toEqual(stored);
  });

  test('given the saved-household store then saving a household stores it with the same request, as the account', async () => {
    // Given
    const stored = storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data);
    const { householdClient, fetchMock } = routedClient({
      [STORE]: () => itemResponse(stored, 201),
      'POST /v2/user-households': () =>
        itemResponse(userHouseholdItem({ household_id: stored.id }), 201),
    });
    const store = new ApiSavedHouseholdStore({ client: householdClient, countryId: 'us' });

    // When
    await store.save({ household: US_SINGLE_PARENT, label: 'Single parent' });

    // Then
    const [request] = requestsFor(fetchMock, STORE);
    expect(new URL(request.url).searchParams.get('country_id')).toBe('us');
    expect(await request.json()).toEqual(US_SINGLE_PARENT_V2_BODY);
  });
});

describe('fetchV2Household', () => {
  test('given a stored household ID then it is read in its country', async () => {
    // Given
    const stored = storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data);
    const { householdClient, fetchMock } = routedClient({
      [`GET /v2/households/${stored.id}`]: () => itemResponse(stored),
    });

    // When
    const item = await fetchV2Household('us', stored.id, householdClient);

    // Then
    const [request] = requestsFor(fetchMock, `GET /v2/households/${stored.id}`);
    expect(new URL(request.url).searchParams.get('country_id')).toBe('us');
    expect(item).toEqual(stored);
  });
});
