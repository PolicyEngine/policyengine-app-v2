import { describe, expect, test } from 'vitest';
import {
  bracketFieldLabel,
  groupKeyFromPath,
  humanizeSegment,
  parameterGroup,
} from '@/libs/flagship/parameterGroups';
import { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

const node = (path: string, label: string) => ({
  [path]: { parameter: path, label, type: 'parameter' as const },
});

const PARAMETERS: ParameterMetadataCollection = {
  ...node('gov.irs.deductions.standard.amount', 'Standard deduction amount'),
  ...node('gov.irs.deductions.standard.amount.SINGLE', 'SINGLE'),
  ...node('gov.irs.deductions.standard.amount.HEAD_OF_HOUSEHOLD', 'HEAD OF HOUSEHOLD'),
  ...node('gov.irs.credits.eitc.max', 'EITC maximum'),
  ...node('gov.usda.snap.allotment.2', '2'),
  ...node('gov.usda.snap.allotment.10', '10'),
};

const DRAFTABLE = new Set([
  'gov.irs.deductions.standard.amount.SINGLE',
  'gov.irs.deductions.standard.amount.HEAD_OF_HOUSEHOLD',
  'gov.irs.credits.eitc.max[0].amount',
  'gov.irs.credits.eitc.max[0].threshold',
  'gov.irs.credits.eitc.max[1].amount',
  'gov.irs.credits.ctc.amount',
  'gov.usda.snap.allotment.2',
  'gov.usda.snap.allotment.10',
]);

describe('parameterGroup', () => {
  test('given a filing-status member then its siblings form the group, named for people', () => {
    const group = parameterGroup(
      'gov.irs.deductions.standard.amount.SINGLE',
      PARAMETERS,
      DRAFTABLE
    );

    expect(group?.label).toBe('Standard deduction amount');
    expect(group?.members.map((m) => m.label)).toEqual(['Single', 'Head of household']);
  });

  test('given a bracket field then every bracket of the schedule joins, in bracket order', () => {
    const group = parameterGroup('gov.irs.credits.eitc.max[1].amount', PARAMETERS, DRAFTABLE);

    expect(group?.label).toBe('EITC maximum');
    expect(group?.members.map((m) => m.label)).toEqual([
      'Bracket 1 · threshold',
      'Bracket 1 · amount',
      'Bracket 2 · amount',
    ]);
  });

  test('given a schedule then it lays out as brackets, each threshold first', () => {
    const group = parameterGroup('gov.irs.credits.eitc.max[1].amount', PARAMETERS, DRAFTABLE);

    expect(group?.brackets).toEqual({
      fields: ['threshold', 'amount'],
      rows: [
        {
          index: 0,
          cells: {
            threshold: 'gov.irs.credits.eitc.max[0].threshold',
            amount: 'gov.irs.credits.eitc.max[0].amount',
          },
        },
        { index: 1, cells: { amount: 'gov.irs.credits.eitc.max[1].amount' } },
      ],
    });
  });

  test('given a breakdown then it has no bracket layout', () => {
    const group = parameterGroup(
      'gov.irs.deductions.standard.amount.SINGLE',
      PARAMETERS,
      DRAFTABLE
    );

    expect(group?.brackets).toBeUndefined();
  });

  test('given household sizes then they sort by number', () => {
    const group = parameterGroup('gov.usda.snap.allotment.10', PARAMETERS, DRAFTABLE);

    expect(group?.members.map((m) => m.path)).toEqual([
      'gov.usda.snap.allotment.2',
      'gov.usda.snap.allotment.10',
    ]);
  });

  test('given an ordinary parameter then it stands alone', () => {
    expect(parameterGroup('gov.irs.credits.ctc.amount', PARAMETERS, DRAFTABLE)).toBeNull();
  });
});

describe('groupKeyFromPath', () => {
  test('given a grouped member then its key is the group key the index gives', () => {
    for (const path of [
      'gov.irs.deductions.standard.amount.SINGLE',
      'gov.irs.credits.eitc.max[1].amount',
      'gov.usda.snap.allotment.10',
    ]) {
      expect(groupKeyFromPath(path)).toBe(parameterGroup(path, PARAMETERS, DRAFTABLE)?.key);
    }
  });

  test('given members of one setting then they share a key', () => {
    expect(groupKeyFromPath('gov.irs.credits.eitc.max[0].threshold')).toBe(
      groupKeyFromPath('gov.irs.credits.eitc.max[1].amount')
    );
  });

  test('given an ordinary parameter then its key is its own path', () => {
    expect(groupKeyFromPath('gov.irs.credits.ctc.amount')).toBe('gov.irs.credits.ctc.amount');
  });
});

describe('humanizeSegment', () => {
  test('given a shouted enum then it reads as a phrase; sentence case stays', () => {
    expect(humanizeSegment('HEAD_OF_HOUSEHOLD')).toBe('Head of household');
    expect(humanizeSegment('Standard deduction')).toBe('Standard deduction');
  });

  test.each([
    ['NORTHERN_IRELAND', 'Northern Ireland'],
    ['UNITED KINGDOM', 'United Kingdom'],
    ['ENGLAND OUTSIDE LONDON', 'England outside London'],
    ['EAST_OF_ENGLAND', 'East of England'],
    ['YORKSHIRE_AND_THE_HUMBER', 'Yorkshire and the Humber'],
    ['WEST_MIDLANDS', 'West Midlands'],
    ['ARMAGH CITY BANBRIDGE AND CRAIGAVON', 'Armagh City Banbridge and Craigavon'],
    ['NEWRY_MOURNE_AND_DOWN', 'Newry Mourne and Down'],
    ['BELFAST', 'Belfast'],
  ])('given the UK place %s then it reads as the proper name %s', (segment, expected) => {
    expect(humanizeSegment(segment)).toBe(expected);
  });

  test('given a sentence-case UK label then its place names keep their capitals', () => {
    expect(humanizeSegment('United kingdom private rental prices growth')).toBe(
      'United Kingdom private rental prices growth'
    );
    expect(humanizeSegment('Northern ireland private rental prices growth')).toBe(
      'Northern Ireland private rental prices growth'
    );
  });

  test.each([
    ['SINGLE', 'Single'],
    ['SURVIVING_SPOUSE', 'Surviving spouse'],
    ['ADAMS_COUNTY_CO', 'Adams county co'],
    ['BALTIMORE_CITY_MD', 'Baltimore city md'],
    ['CA', 'Ca'],
  ])('given the US member %s then it reads as before, %s', (segment, expected) => {
    expect(humanizeSegment(segment)).toBe(expected);
  });
});

describe('parameterGroup for the UK', () => {
  const UK_PARAMETERS: ParameterMetadataCollection = {
    ...node('gov.dwp.universal_credit.standard_allowance', 'Standard allowance'),
    ...node('gov.dwp.universal_credit.standard_allowance.amount', 'amount'),
    ...node(
      'gov.dwp.universal_credit.standard_allowance.amount.SINGLE_OLD',
      'Universal Credit single amount (over 25)'
    ),
    ...node(
      'gov.dwp.universal_credit.standard_allowance.amount.COUPLE_OLD',
      'Universal Credit couple amount (one over 25)'
    ),
    ...node('gov.local_authorities.domestic_rates', 'Domestic Rates'),
    ...node('gov.local_authorities.domestic_rates.rates', 'rates'),
    ...node('gov.local_authorities.domestic_rates.rates.BELFAST', 'BELFAST'),
    ...node(
      'gov.local_authorities.domestic_rates.rates.ARMAGH_CITY_BANBRIDGE_AND_CRAIGAVON',
      'ARMAGH CITY BANBRIDGE AND CRAIGAVON'
    ),
    ...node('gov.dft.bus.boardings_per_trip', 'bus boardings per trip'),
    ...node('gov.dft.bus.boardings_per_trip.LONDON', 'LONDON'),
    ...node('gov.dft.bus.boardings_per_trip.ENGLAND_OUTSIDE_LONDON', 'ENGLAND OUTSIDE LONDON'),
  };
  const UK_DRAFTABLE = new Set([
    'gov.dwp.universal_credit.standard_allowance.amount.SINGLE_OLD',
    'gov.dwp.universal_credit.standard_allowance.amount.COUPLE_OLD',
    'gov.local_authorities.domestic_rates.rates.BELFAST',
    'gov.local_authorities.domestic_rates.rates.ARMAGH_CITY_BANBRIDGE_AND_CRAIGAVON',
    'gov.dft.bus.boardings_per_trip.LONDON',
    'gov.dft.bus.boardings_per_trip.ENGLAND_OUTSIDE_LONDON',
  ]);

  test('given a group whose own label is "amount" then the setting above names it', () => {
    const group = parameterGroup(
      'gov.dwp.universal_credit.standard_allowance.amount.SINGLE_OLD',
      UK_PARAMETERS,
      UK_DRAFTABLE
    );
    expect(group?.label).toBe('Standard allowance amount');
  });

  test('given Northern Ireland councils then the group and its members read as names', () => {
    const group = parameterGroup(
      'gov.local_authorities.domestic_rates.rates.BELFAST',
      UK_PARAMETERS,
      UK_DRAFTABLE
    );
    expect(group?.label).toBe('Domestic Rates');
    expect(group?.members.map((member) => member.label)).toEqual([
      'Belfast',
      'Armagh City Banbridge and Craigavon',
    ]);
  });

  test('given regions then the members keep their capitals', () => {
    const group = parameterGroup(
      'gov.dft.bus.boardings_per_trip.LONDON',
      UK_PARAMETERS,
      UK_DRAFTABLE
    );
    expect(group?.label).toBe('Bus boardings per trip');
    expect(group?.members.map((member) => member.label)).toEqual([
      'London',
      'England outside London',
    ]);
  });
});

describe('bracketFieldLabel', () => {
  test('given a threshold then a threshold; a rate amount then a rate', () => {
    expect(bracketFieldLabel('threshold', 'child')).toBe('threshold');
    expect(bracketFieldLabel('amount', '/1')).toBe('rate');
    expect(bracketFieldLabel('rate', '/1')).toBe('rate');
    expect(bracketFieldLabel('amount', 'currency-USD')).toBe('amount');
  });
});
