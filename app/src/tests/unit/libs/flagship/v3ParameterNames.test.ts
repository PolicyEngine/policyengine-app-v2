import { describe, expect, test } from 'vitest';
import { growthIndexPaths } from '@/libs/flagship/uprating';
import {
  draftParameterNames,
  groupMemberPaths,
  reformParameterNames,
} from '@/libs/flagship/v3ParameterNames';

const SINGLE = 'gov.irs.deductions.standard.amount.SINGLE';
const JOINT = 'gov.irs.deductions.standard.amount.JOINT';
const FIRST_BRACKET_RATE = 'gov.irs.income.bracket.rates[0].rate';
const SECOND_BRACKET_RATE = 'gov.irs.income.bracket.rates[1].rate';
const CTC_REFUNDABLE = 'gov.irs.credits.ctc.refundable.fully_refundable';
const ADDABLE = new Set([SINGLE, JOINT, FIRST_BRACKET_RATE, SECOND_BRACKET_RATE, CTC_REFUNDABLE]);

describe('groupMemberPaths', () => {
  test('given a breakdown member then its other members come with it', () => {
    expect(groupMemberPaths(SINGLE, ADDABLE).sort()).toEqual([JOINT, SINGLE].sort());
  });

  test("given a bracket field then the schedule's other brackets come with it", () => {
    expect(groupMemberPaths(FIRST_BRACKET_RATE, ADDABLE).sort()).toEqual(
      [FIRST_BRACKET_RATE, SECOND_BRACKET_RATE].sort()
    );
  });

  test('given a parameter that stands alone then it is the only name', () => {
    expect(groupMemberPaths(CTC_REFUNDABLE, ADDABLE)).toEqual([CTC_REFUNDABLE]);
  });

  test('given the parameters a draft can take are not in yet then the path alone is named', () => {
    expect(groupMemberPaths(SINGLE, new Set())).toEqual([SINGLE]);
  });
});

describe('draftParameterNames', () => {
  test('given a draft then it names provisions, their groups, their growth and the indexes', () => {
    const names = draftParameterNames(
      [
        { path: SINGLE, growth: 'gov.bls.cpi.cpi_u' },
        { path: CTC_REFUNDABLE, growth: 'fixed' },
      ],
      ADDABLE,
      'us'
    );

    expect(names).toEqual(
      [...new Set([SINGLE, JOINT, CTC_REFUNDABLE, ...growthIndexPaths('us')])].sort()
    );
  });
});

describe('reformParameterNames', () => {
  test('given reforms then each changed parameter is named once', () => {
    const names = reformParameterNames([
      { parameters: [{ name: SINGLE, values: [] }] },
      {
        parameters: [
          { name: SINGLE, values: [] },
          { name: CTC_REFUNDABLE, values: [] },
        ],
      },
    ]);

    expect(names).toEqual([CTC_REFUNDABLE, SINGLE]);
  });
});
