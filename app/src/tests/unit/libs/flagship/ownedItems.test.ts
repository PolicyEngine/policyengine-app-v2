import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  addOwnedItem,
  EDIT_TOKEN_HEADER,
  editTokenHeaders,
  findOwnedItem,
  findOwnedReportByApiReportId,
  ItemNotOwnedError,
  readOwnedItems,
  removeOwnedItem,
} from '@/libs/flagship/ownedItems';
import {
  API_REPORT_ID,
  CENTRAL_REFORM_ID,
  CENTRAL_REPORT_ID,
  EDIT_TOKEN,
  OTHER_API_REPORT_ID,
  OTHER_CENTRAL_REFORM_ID,
  OWNED_REFORMS_KEY,
  OWNED_REPORTS_KEY,
  ownedReport,
  ownedUkReform,
  ownedUsReform,
  seedOwnedItems,
  UK_CENTRAL_REFORM_ID,
} from '@/tests/fixtures/libs/flagship/ownedItemsMocks';

describe('ownedItems', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('given an added item then it is found by id with its token and a timestamp', () => {
    // When
    addOwnedItem('reforms', { id: CENTRAL_REFORM_ID, countryId: 'us', editToken: EDIT_TOKEN });

    // Then
    const item = findOwnedItem('reforms', CENTRAL_REFORM_ID);
    expect(item).toMatchObject({ id: CENTRAL_REFORM_ID, countryId: 'us', editToken: EDIT_TOKEN });
    expect(Number.isNaN(Date.parse(item!.addedAt))).toBe(false);
  });

  test('given items for two countries then reading one country returns only its items', () => {
    // Given
    seedOwnedItems(OWNED_REFORMS_KEY, [ownedUsReform, ownedUkReform]);

    // When
    const ukOnly = readOwnedItems('reforms', 'uk');

    // Then
    expect(ukOnly.map((item) => item.id)).toEqual([UK_CENTRAL_REFORM_ID]);
  });

  test('given two added items then the newest is listed first', () => {
    // Given
    addOwnedItem('reforms', { id: CENTRAL_REFORM_ID, countryId: 'us', editToken: EDIT_TOKEN });

    // When
    addOwnedItem('reforms', {
      id: OTHER_CENTRAL_REFORM_ID,
      countryId: 'us',
      editToken: EDIT_TOKEN,
    });

    // Then
    expect(readOwnedItems('reforms').map((item) => item.id)).toEqual([
      OTHER_CENTRAL_REFORM_ID,
      CENTRAL_REFORM_ID,
    ]);
  });

  test('given reforms and reports then each kind keeps its own index', () => {
    // When
    addOwnedItem('reforms', { id: CENTRAL_REFORM_ID, countryId: 'us', editToken: EDIT_TOKEN });

    // Then
    expect(readOwnedItems('reports')).toEqual([]);
  });

  test('given a removed item then it is no longer found', () => {
    // Given
    seedOwnedItems(OWNED_REFORMS_KEY, [ownedUsReform, ownedUkReform]);

    // When
    removeOwnedItem('reforms', CENTRAL_REFORM_ID);

    // Then
    expect(findOwnedItem('reforms', CENTRAL_REFORM_ID)).toBeNull();
    expect(findOwnedItem('reforms', UK_CENTRAL_REFORM_ID)).not.toBeNull();
  });

  test('given a report record then it is found by the API report it points at', () => {
    // When
    addOwnedItem('reports', {
      id: CENTRAL_REPORT_ID,
      countryId: 'us',
      editToken: EDIT_TOKEN,
      apiReportId: API_REPORT_ID,
    });

    // Then
    expect(findOwnedReportByApiReportId(API_REPORT_ID)?.id).toBe(CENTRAL_REPORT_ID);
    expect(findOwnedReportByApiReportId(OTHER_API_REPORT_ID)).toBeNull();
  });

  test('given corrupt JSON in storage then reads come back empty', () => {
    // Given
    localStorage.setItem(OWNED_REFORMS_KEY, '{not json');

    // Then
    expect(readOwnedItems('reforms')).toEqual([]);
  });

  test('given malformed entries in storage then only well-formed items are read', () => {
    // Given
    localStorage.setItem(
      OWNED_REFORMS_KEY,
      JSON.stringify([ownedUsReform, { id: 42 }, null, { id: 'x', countryId: 'us' }])
    );

    // Then
    expect(readOwnedItems('reforms')).toEqual([ownedUsReform]);
  });

  test('given storage that throws then reads are empty and writes do not throw', () => {
    // Given
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    // Then
    expect(readOwnedItems('reforms')).toEqual([]);
    expect(() =>
      addOwnedItem('reforms', { id: CENTRAL_REFORM_ID, countryId: 'us', editToken: EDIT_TOKEN })
    ).not.toThrow();
    expect(() => removeOwnedItem('reforms', CENTRAL_REFORM_ID)).not.toThrow();
  });

  test('given an owned item then its edit token goes in the request header', () => {
    // Given
    seedOwnedItems(OWNED_REPORTS_KEY, [ownedReport]);

    // Then
    expect(editTokenHeaders('reports', CENTRAL_REPORT_ID)).toEqual({
      [EDIT_TOKEN_HEADER]: EDIT_TOKEN,
    });
  });

  test('given an item this browser did not create then asking for its token throws', () => {
    expect(() => editTokenHeaders('reforms', CENTRAL_REFORM_ID)).toThrow(ItemNotOwnedError);
  });
});
