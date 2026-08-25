import { describe, expect, test } from 'vitest';
import { buildUsAskContext, executeUsAskTool } from '@/libs/flagship/usAskAgent';
import type { ParameterSearchEntry } from '@/libs/parameterSearch';

const CTC_PATH = 'gov.irs.credits.ctc.amount.base';

const ENTRIES: ParameterSearchEntry[] = [
  {
    path: CTC_PATH,
    label: 'amount',
    breadcrumb: 'IRS → Credits → Child tax credit → Amount',
    unit: 'currency-USD',
    description: 'The base child tax credit amount per child.',
    isContrib: false,
    stateCode: null,
  },
  {
    path: 'gov.irs.income.bracket.rates.top',
    label: 'top rate',
    breadcrumb: 'IRS → Income tax → Top rate',
    unit: '/1',
    description: null,
    isContrib: false,
    stateCode: null,
  },
];

const PARAMETERS = {
  [CTC_PATH]: { values: { '2018-01-01': 2000, '2026-01-01': 2200 } },
  'gov.irs.income.bracket.rates.top': { values: { '2018-01-01': 0.37 } },
};

const context = buildUsAskContext(ENTRIES, [], PARAMETERS);

describe('executeUsAskTool', () => {
  test('given a search query then matching paths return with current values', () => {
    const { output, isError } = executeUsAskTool(context, 'search_parameters', {
      query: 'child tax credit',
    });

    expect(isError).toBe(false);
    const parsed = JSON.parse(output);
    expect(parsed.results[0].path).toBe(CTC_PATH);
    expect(parsed.results[0].current_value).toBe('$2,200');
  });

  test('given an empty query then an error returns', () => {
    const { isError } = executeUsAskTool(context, 'search_parameters', { query: ' ' });
    expect(isError).toBe(true);
  });

  test('given a known path then get_parameter returns values history', () => {
    const { output, isError } = executeUsAskTool(context, 'get_parameter', { path: CTC_PATH });

    expect(isError).toBe(false);
    const parsed = JSON.parse(output);
    expect(parsed.current_value).toBe(2200);
    expect(parsed.recent_values).toEqual([
      { from: '2018-01-01', value: 2000 },
      { from: '2026-01-01', value: 2200 },
    ]);
  });

  test('given an unknown path then get_parameter errors', () => {
    const { isError, output } = executeUsAskTool(context, 'get_parameter', {
      path: 'gov.made.up',
    });
    expect(isError).toBe(true);
    expect(output).toContain('unknown parameter path');
  });

  test('given a valid reform then validate_reform returns provisions with baselines', () => {
    const { output, isError } = executeUsAskTool(context, 'validate_reform', {
      reform: { [CTC_PATH]: 3600 },
    });

    expect(isError).toBe(false);
    const parsed = JSON.parse(output);
    expect(parsed.valid).toBe(true);
    expect(parsed.provisions).toEqual([
      {
        path: CTC_PATH,
        breadcrumb: 'IRS → Credits → Child tax credit → Amount',
        current_value: 2200,
        proposed_value: 3600,
      },
    ]);
  });

  test('given an invented path then validate_reform reports the error', () => {
    const { output, isError } = executeUsAskTool(context, 'validate_reform', {
      reform: { 'gov.invented.path': 5 },
    });

    expect(isError).toBe(true);
    expect(JSON.parse(output).errors[0]).toContain('Unknown parameter path');
  });

  test('given a non-numeric value then validate_reform rejects it', () => {
    const { isError, output } = executeUsAskTool(context, 'validate_reform', {
      reform: { [CTC_PATH]: 'a lot' },
    });

    expect(isError).toBe(true);
    expect(JSON.parse(output).errors[0]).toContain('must be a number or boolean');
  });

  test('given an unknown tool then an error returns', () => {
    const { isError } = executeUsAskTool(context, 'launch_rockets', {});
    expect(isError).toBe(true);
  });
});
