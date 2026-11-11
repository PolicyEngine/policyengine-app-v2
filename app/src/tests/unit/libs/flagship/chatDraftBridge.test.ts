import { describe, expect, test } from 'vitest';
import { provisionsFromChatReform, reformFromToolInput } from '@/libs/flagship/chatDraftBridge';
import type { ParameterSearchEntry } from '@/libs/parameterSearch';

const PERSONAL_ALLOWANCE_PATH = 'gov.hmrc.income_tax.allowances.personal_allowance.amount';

const ENTRIES: ParameterSearchEntry[] = [
  {
    path: PERSONAL_ALLOWANCE_PATH,
    label: 'amount',
    breadcrumb: 'HMRC → Income tax → Personal allowance → Amount',
    unit: 'currency-GBP',
    description: null,
    isContrib: false,
    stateCode: null,
  },
];

const PARAMETERS = {
  [PERSONAL_ALLOWANCE_PATH]: { values: { '2020-01-01': 12570 } },
};

describe('reformFromToolInput', () => {
  test('given a simulation tool carrying a reform then the mapping returns', () => {
    const reform = reformFromToolInput('run_society_simulation', {
      reform: { [PERSONAL_ALLOWANCE_PATH]: 15000 },
      year: 2026,
    });

    expect(reform).toEqual({ [PERSONAL_ALLOWANCE_PATH]: 15000 });
  });

  test('given a baseline simulation without a reform then null returns', () => {
    expect(reformFromToolInput('run_society_simulation', { year: 2026 })).toBeNull();
    expect(reformFromToolInput('run_society_simulation', { reform: {} })).toBeNull();
  });

  test('given a non-reform tool then null returns even with a reform-shaped input', () => {
    expect(
      reformFromToolInput('search_parameters', { reform: { [PERSONAL_ALLOWANCE_PATH]: 1 } })
    ).toBeNull();
  });
});

describe('provisionsFromChatReform', () => {
  test('given a scalar reform value then a provision with local baseline builds', () => {
    const { provisions, unknownPaths } = provisionsFromChatReform(
      { [PERSONAL_ALLOWANCE_PATH]: 15000 },
      ENTRIES,
      PARAMETERS
    );

    expect(unknownPaths).toEqual([]);
    expect(provisions).toEqual([
      {
        path: PERSONAL_ALLOWANCE_PATH,
        breadcrumb: 'HMRC → Income tax → Personal allowance → Amount',
        unit: 'currency-GBP',
        baselineValue: 12570,
        value: 15000,
      },
    ]);
  });

  test('given a date-map reform value then it collapses to the scalar', () => {
    const { provisions } = provisionsFromChatReform(
      { [PERSONAL_ALLOWANCE_PATH]: { '2026-01-01.2100-12-31': 16000 } },
      ENTRIES,
      PARAMETERS
    );

    expect(provisions[0].value).toBe(16000);
  });

  test('given a path the local index does not know then it lands in unknownPaths', () => {
    const { provisions, unknownPaths } = provisionsFromChatReform(
      { 'gov.hmrc.brand_new.parameter': 5 },
      ENTRIES,
      PARAMETERS
    );

    expect(provisions).toEqual([]);
    expect(unknownPaths).toEqual(['gov.hmrc.brand_new.parameter']);
  });
});
