import { describe, expect, test } from 'vitest';
import {
  billLevel,
  billPlace,
  filterBills,
  NO_BILL_FILTERS,
  stateBillCounts,
} from '@/libs/flagship/billFilters';
import {
  FEDERAL_ENACTED,
  FEDERAL_PROPOSED,
  FEDERAL_UNTRACKED,
  FILTER_BILLS,
  GEORGIA_VETOED,
  UTAH_ENACTED,
  UTAH_PROPOSED,
} from '@/tests/fixtures/libs/flagship/billFilterMocks';

const ids = (bills: { id: string }[]) => bills.map((bill) => bill.id);

describe('billLevel', () => {
  test('given a bill with no state then it is federal', () => {
    expect(billLevel(FEDERAL_PROPOSED)).toBe('federal');
  });

  test('given a bill with a state then it is a state bill', () => {
    expect(billLevel(UTAH_PROPOSED)).toBe('state');
  });
});

describe('billPlace', () => {
  test('given a federal bill the tracker files under US then it reads Federal', () => {
    expect(billPlace(FEDERAL_ENACTED)).toBe('Federal');
  });

  test('given a state bill then it reads the state by name', () => {
    expect(billPlace(GEORGIA_VETOED)).toBe('Georgia');
  });
});

describe('filterBills', () => {
  test('given no filters then every bill stays, in order', () => {
    expect(ids(filterBills(FILTER_BILLS, NO_BILL_FILTERS))).toEqual(ids(FILTER_BILLS));
  });

  test('given the federal level then only federal bills stay', () => {
    expect(ids(filterBills(FILTER_BILLS, { ...NO_BILL_FILTERS, level: 'federal' }))).toEqual([
      FEDERAL_ENACTED.id,
      FEDERAL_PROPOSED.id,
      FEDERAL_UNTRACKED.id,
    ]);
  });

  test('given the state level then bills from every state stay', () => {
    expect(ids(filterBills(FILTER_BILLS, { ...NO_BILL_FILTERS, level: 'state' }))).toEqual([
      UTAH_ENACTED.id,
      UTAH_PROPOSED.id,
      GEORGIA_VETOED.id,
    ]);
  });

  test('given one state then only its bills stay', () => {
    expect(
      ids(filterBills(FILTER_BILLS, { ...NO_BILL_FILTERS, level: 'state', state: 'ut' }))
    ).toEqual([UTAH_ENACTED.id, UTAH_PROPOSED.id]);
  });

  test('given a state outside the state level then it is not read', () => {
    expect(
      ids(filterBills(FILTER_BILLS, { ...NO_BILL_FILTERS, level: 'federal', state: 'ut' }))
    ).toEqual([FEDERAL_ENACTED.id, FEDERAL_PROPOSED.id, FEDERAL_UNTRACKED.id]);
  });

  test('given the enacted stage then only enacted bills stay', () => {
    expect(ids(filterBills(FILTER_BILLS, { ...NO_BILL_FILTERS, stage: 'enacted' }))).toEqual([
      FEDERAL_ENACTED.id,
      UTAH_ENACTED.id,
    ]);
  });

  test('given the proposed stage then only proposals stay', () => {
    expect(ids(filterBills(FILTER_BILLS, { ...NO_BILL_FILTERS, stage: 'proposed' }))).toEqual([
      FEDERAL_PROPOSED.id,
      UTAH_PROPOSED.id,
    ]);
  });

  test('given a bill with no tracked status then it stays under all stages only', () => {
    const atStage = (stage: 'enacted' | 'proposed' | 'failed') =>
      ids(filterBills([FEDERAL_UNTRACKED], { ...NO_BILL_FILTERS, stage }));

    expect(ids(filterBills([FEDERAL_UNTRACKED], NO_BILL_FILTERS))).toEqual([FEDERAL_UNTRACKED.id]);
    expect([atStage('enacted'), atStage('proposed'), atStage('failed')]).toEqual([[], [], []]);
  });

  test('given a level and a stage then both apply', () => {
    expect(
      ids(filterBills(FILTER_BILLS, { level: 'state', state: 'all', stage: 'enacted' }))
    ).toEqual([UTAH_ENACTED.id]);
  });
});

describe('stateBillCounts', () => {
  test('given no stage then each state counts all its bills', () => {
    expect(stateBillCounts(FILTER_BILLS, NO_BILL_FILTERS)).toEqual({ all: 3, ut: 2, ga: 1 });
  });

  test('given a stage then each state counts its bills at that stage', () => {
    expect(stateBillCounts(FILTER_BILLS, { ...NO_BILL_FILTERS, stage: 'enacted' })).toEqual({
      all: 1,
      ut: 1,
    });
  });

  test('given listed states then a state with no bill at the stage counts 0', () => {
    expect(
      stateBillCounts(FILTER_BILLS, { ...NO_BILL_FILTERS, stage: 'enacted' }, ['UT', 'ga'])
    ).toEqual({ all: 1, ut: 1, ga: 0 });
  });
});
