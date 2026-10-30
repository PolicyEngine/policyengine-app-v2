import { describe, expect, test } from 'vitest';
import { ApiFlagshipHouseholdStore } from '@/api/flagshipHouseholdStore';
import { MAX_STORE_NAME_LENGTH } from '@/libs/flagship/storeText';
import {
  ASSOCIATION_IDS,
  createTestApiContext,
  fetchCall,
  householdItem,
  itemResponse,
  LEGACY_IDS,
  pageResponse,
} from '@/tests/fixtures/api/v2UserMocks';

const HOUSEHOLD_SUMMARY = 'Single · no children · $50,000 earnings · California';
const CALCULATED_HOUSEHOLD_ID = String(LEGACY_IDS.HOUSEHOLD);

describe('ApiFlagshipHouseholdStore', () => {
  test('given a household the account has not saved then one /v2/user-households row points at it', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock
      .mockResolvedValueOnce(pageResponse([]))
      .mockResolvedValueOnce(itemResponse(householdItem({ name: HOUSEHOLD_SUMMARY }), 201));
    const store = new ApiFlagshipHouseholdStore(context);

    // When
    const saved = await store.saveCalculated({
      householdId: CALCULATED_HOUSEHOLD_ID,
      name: HOUSEHOLD_SUMMARY,
    });

    // Then
    const lookup = fetchCall(fetchMock, 0);
    expect(lookup.method).toBe('GET');
    expect(lookup.path).toBe('/v2/user-households');
    expect(lookup.query).toEqual({
      country_id: 'us',
      legacy_household_id: CALCULATED_HOUSEHOLD_ID,
      limit: '1',
    });
    const creation = fetchCall(fetchMock, 1);
    expect(creation.method).toBe('POST');
    expect(creation.path).toBe('/v2/user-households');
    expect(creation.body).toEqual({
      country_id: 'us',
      legacy_household_id: LEGACY_IDS.HOUSEHOLD,
      name: HOUSEHOLD_SUMMARY,
    });
    expect(saved.id).toBe(ASSOCIATION_IDS.HOUSEHOLD);
  });

  test('given the account already saved the household then no second row is created', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValueOnce(pageResponse([householdItem({ name: HOUSEHOLD_SUMMARY })]));
    const store = new ApiFlagshipHouseholdStore(context);

    // When
    const saved = await store.saveCalculated({
      householdId: CALCULATED_HOUSEHOLD_ID,
      name: HOUSEHOLD_SUMMARY,
    });

    // Then
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(saved.id).toBe(ASSOCIATION_IDS.HOUSEHOLD);
  });

  test('given a summary longer than the API takes then the row is named with it shortened', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock
      .mockResolvedValueOnce(pageResponse([]))
      .mockResolvedValueOnce(itemResponse(householdItem(), 201));
    const store = new ApiFlagshipHouseholdStore(context);
    const longSummary = 'Married · 6 children · '.repeat(20);

    // When
    await store.saveCalculated({ householdId: CALCULATED_HOUSEHOLD_ID, name: longSummary });

    // Then
    const savedName: string = fetchCall(fetchMock, 1).body.name;
    expect(Array.from(savedName)).toHaveLength(MAX_STORE_NAME_LENGTH);
  });

  test('given an ID that is not a v1 household ID then nothing is sent', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const store = new ApiFlagshipHouseholdStore(context);

    // When
    const saving = store.saveCalculated({ householdId: 'not-a-v1-id', name: HOUSEHOLD_SUMMARY });

    // Then
    await expect(saving).rejects.toThrow('not-a-v1-id');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
