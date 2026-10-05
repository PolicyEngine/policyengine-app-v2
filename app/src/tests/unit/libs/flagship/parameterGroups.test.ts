import { describe, expect, test } from 'vitest';
import { humanizeSegment, parameterGroup } from '@/libs/flagship/parameterGroups';
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
      'Bracket 1 · amount',
      'Bracket 1 · threshold',
      'Bracket 2 · amount',
    ]);
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

describe('humanizeSegment', () => {
  test('given a shouted enum then it reads as a phrase; sentence case stays', () => {
    expect(humanizeSegment('HEAD_OF_HOUSEHOLD')).toBe('Head of household');
    expect(humanizeSegment('Standard deduction')).toBe('Standard deduction');
  });
});
