import { describe, expect, test, vi } from 'vitest';
import {
  buildUsAskContext,
  buildUsAskContextFromMetadata,
  createReferenceFetcher,
  executeUsAskTool,
  parameterSourceFiles,
  parseParameterReferences,
} from '@/libs/flagship/usAskAgent';
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

/** A small slice of /us/metadata: a Georgia folder with a rate, a switch, and a contributed bill. */
const METADATA: any = {
  gov: { parameter: 'gov', type: 'parameterNode', label: 'Government' },
  'gov.states': { parameter: 'gov.states', type: 'parameterNode', label: 'States' },
  'gov.states.ga': { parameter: 'gov.states.ga', type: 'parameterNode', label: 'Georgia' },
  'gov.states.ga.tax': { parameter: 'gov.states.ga.tax', type: 'parameterNode', label: 'Tax' },
  'gov.states.ga.tax.income': {
    parameter: 'gov.states.ga.tax.income',
    type: 'parameterNode',
    label: 'Income tax',
  },
  'gov.states.ga.tax.income.flat_rate': {
    parameter: 'gov.states.ga.tax.income.flat_rate',
    type: 'parameter',
    label: 'Georgia flat income tax rate',
    unit: '/1',
    economy: true,
    household: true,
    values: { '2024-01-01': 0.0539, '2026-01-01': 0.0519 },
  },
  'gov.states.ga.tax.income.exemptions.in_effect': {
    parameter: 'gov.states.ga.tax.income.exemptions.in_effect',
    type: 'parameter',
    label: 'Georgia exemptions in effect',
    unit: 'bool',
    economy: true,
    household: true,
    values: { '2020-01-01': true },
  },
  'gov.states.ga.tax.income.deductions': {
    parameter: 'gov.states.ga.tax.income.deductions',
    type: 'parameterNode',
    label: 'Deductions',
  },
  'gov.states.ga.tax.income.deductions.standard': {
    parameter: 'gov.states.ga.tax.income.deductions.standard',
    type: 'parameterNode',
    label: 'Standard deduction',
  },
  ...Object.fromEntries(
    ['SINGLE', 'JOINT', 'SEPARATE'].map((status, i) => [
      `gov.states.ga.tax.income.deductions.standard.${status}`,
      {
        parameter: `gov.states.ga.tax.income.deductions.standard.${status}`,
        type: 'parameter',
        label: status,
        unit: 'currency-USD',
        economy: true,
        household: true,
        values: { '2024-01-01': [12000, 24000, 12000][i] },
      },
    ])
  ),
  'gov.contrib.states.ga.hb1001.in_effect': {
    parameter: 'gov.contrib.states.ga.hb1001.in_effect',
    type: 'parameter',
    label: 'Georgia HB1001 in effect',
    unit: 'bool',
    economy: true,
    household: true,
    values: { '2020-01-01': false },
  },
};

describe('executeUsAskTool', () => {
  test('given a search query then matching paths return with current values', async () => {
    const { output, isError } = await executeUsAskTool(context, 'search_parameters', {
      query: 'child tax credit',
    });

    expect(isError).toBe(false);
    const parsed = JSON.parse(output);
    expect(parsed.results[0].path).toBe(CTC_PATH);
    expect(parsed.results[0].current_value).toBe('$2,200');
  });

  test('given an empty query then an error returns', async () => {
    const { isError } = await executeUsAskTool(context, 'search_parameters', { query: ' ' });
    expect(isError).toBe(true);
  });

  test('given a known path then get_parameter returns values history', async () => {
    const { output, isError } = await executeUsAskTool(context, 'get_parameter', {
      path: CTC_PATH,
    });

    expect(isError).toBe(false);
    const parsed = JSON.parse(output);
    expect(parsed.current_value).toBe(2200);
    expect(parsed.values).toEqual([
      { from: '2018-01-01', value: 2000 },
      { from: '2026-01-01', value: 2200 },
    ]);
    expect(parsed).not.toHaveProperty('references');
  });

  test('given references are available then get_parameter includes them', async () => {
    const fetchReferences = vi
      .fn()
      .mockResolvedValue([
        { title: '26 U.S.C. 24', href: 'https://www.law.cornell.edu/uscode/text/26/24' },
      ]);

    const { output } = await executeUsAskTool({ ...context, fetchReferences }, 'get_parameter', {
      path: CTC_PATH,
    });

    expect(fetchReferences).toHaveBeenCalledWith(CTC_PATH);
    expect(JSON.parse(output).references[0].title).toBe('26 U.S.C. 24');
  });

  test('given an unknown path then get_parameter errors', async () => {
    const { isError, output } = await executeUsAskTool(context, 'get_parameter', {
      path: 'gov.made.up',
    });
    expect(isError).toBe(true);
    expect(output).toContain('unknown parameter path');
  });

  test('given a valid reform then validate_reform returns provisions with baselines', async () => {
    const { output, isError } = await executeUsAskTool(context, 'validate_reform', {
      reform: { [CTC_PATH]: 3600 },
    });

    expect(isError).toBe(false);
    const parsed = JSON.parse(output);
    expect(parsed.valid).toBe(true);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.provisions).toEqual([
      {
        path: CTC_PATH,
        breadcrumb: 'IRS → Credits → Child tax credit → Amount',
        current_value: 2200,
        proposed_value: 3600,
      },
    ]);
  });

  test('given an invented path then validate_reform reports the error', async () => {
    const { output, isError } = await executeUsAskTool(context, 'validate_reform', {
      reform: { 'gov.invented.path': 5 },
    });

    expect(isError).toBe(true);
    expect(JSON.parse(output).errors[0]).toContain('Unknown parameter path');
  });

  test('given a non-numeric value then validate_reform rejects it', async () => {
    const { isError, output } = await executeUsAskTool(context, 'validate_reform', {
      reform: { [CTC_PATH]: 'a lot' },
    });

    expect(isError).toBe(true);
    expect(JSON.parse(output).errors[0]).toContain('must be a number or boolean');
  });

  test('given a rate written as a percentage then validate_reform warns', async () => {
    const { output, isError } = await executeUsAskTool(context, 'validate_reform', {
      reform: { 'gov.irs.income.bracket.rates.top': 39.6 },
    });

    expect(isError).toBe(false);
    expect(JSON.parse(output).warnings[0]).toContain('Did you mean 0.396?');
  });

  test('given an unknown tool then an error returns', async () => {
    const { isError } = await executeUsAskTool(context, 'launch_rockets', {});
    expect(isError).toBe(true);
  });
});

describe('agentic search tools', () => {
  const full = buildUsAskContextFromMetadata(METADATA);

  test('given a folder then list_children shows its folders and parameters', async () => {
    const { output, isError } = await executeUsAskTool(full, 'list_children', {
      path: 'gov.states.ga.tax.income',
    });

    expect(isError).toBe(false);
    const parsed = JSON.parse(output);
    expect(parsed.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'gov.states.ga.tax.income.exemptions', kind: 'folder' }),
        expect.objectContaining({
          path: 'gov.states.ga.tax.income.flat_rate',
          kind: 'parameter',
          current_value: '5.19%',
        }),
      ])
    );
  });

  test('given an empty path or gov then list_children shows the top level', async () => {
    const top = await executeUsAskTool(full, 'list_children', { path: '' });
    const gov = await executeUsAskTool(full, 'list_children', { path: 'gov' });

    expect(JSON.parse(top.output).children.map((child: any) => child.path)).toEqual([
      'gov.contrib',
      'gov.states',
    ]);
    expect(JSON.parse(gov.output).children).toEqual(JSON.parse(top.output).children);
  });

  test('given a parameter or unknown path then list_children says what to do instead', async () => {
    const leaf = await executeUsAskTool(full, 'list_children', {
      path: 'gov.states.ga.tax.income.flat_rate',
    });
    const unknown = await executeUsAskTool(full, 'list_children', { path: 'gov.nowhere' });

    expect(leaf.output).toContain('Use get_parameter');
    expect(unknown.isError).toBe(true);
  });

  test('given a state scope then search keeps to that state', async () => {
    const { output } = await executeUsAskTool(full, 'search_parameters', {
      query: 'income tax rate',
      scope: 'GA',
    });

    const paths = JSON.parse(output).results.map((result: any) => result.path);
    expect(paths).toContain('gov.states.ga.tax.income.flat_rate');
  });

  test('given include_proposals then contributed parameters become searchable', async () => {
    const without = await executeUsAskTool(full, 'search_parameters', { query: 'HB1001' });
    const withProposals = await executeUsAskTool(full, 'search_parameters', {
      query: 'HB1001',
      include_proposals: true,
    });

    expect(JSON.parse(without.output).results).toEqual([]);
    expect(JSON.parse(withProposals.output).results[0].path).toBe(
      'gov.contrib.states.ga.hb1001.in_effect'
    );
  });

  test('given a folder or a number for a switch then validate_reform explains the fix', async () => {
    const folder = await executeUsAskTool(full, 'validate_reform', {
      reform: { 'gov.states.ga.tax.income': 0.05 },
    });
    const switchValue = await executeUsAskTool(full, 'validate_reform', {
      reform: { 'gov.states.ga.tax.income.exemptions.in_effect': 1 },
    });

    expect(JSON.parse(folder.output).errors[0]).toContain('is a folder');
    expect(JSON.parse(switchValue.output).errors[0]).toContain('use true or false');
  });

  test('given some filing statuses of a parameter then validate_reform lists the rest', async () => {
    const partial = await executeUsAskTool(full, 'validate_reform', {
      reform: {
        'gov.states.ga.tax.income.deductions.standard.SINGLE': 15000,
        'gov.states.ga.tax.income.deductions.standard.JOINT': 30000,
      },
    });
    const complete = await executeUsAskTool(full, 'validate_reform', {
      reform: {
        'gov.states.ga.tax.income.deductions.standard.SINGLE': 15000,
        'gov.states.ga.tax.income.deductions.standard.JOINT': 30000,
        'gov.states.ga.tax.income.deductions.standard.SEPARATE': 15000,
      },
    });

    const warning = JSON.parse(partial.output).warnings[0];
    expect(partial.isError).toBe(false);
    expect(warning).toContain('set for 2 of 3 categories');
    expect(warning).toContain('SEPARATE (current 12000)');
    expect(JSON.parse(complete.output).warnings).toEqual([]);
  });

  test('given a mistyped path then validate_reform suggests close matches', async () => {
    const { output } = await executeUsAskTool(full, 'validate_reform', {
      reform: { 'gov.states.ga.tax.income.flatrate': 0.05 },
    });

    expect(JSON.parse(output).errors[0]).toContain('gov.states.ga.tax.income.flat_rate');
  });
});

describe('parameter references', () => {
  const YAML = `description: Maryland standard deduction.
metadata:
  unit: currency-USD
  reference:
    - title: Maryland 2025 Resident Tax Forms
      href: https://www.marylandcomptroller.gov/booklet.pdf#page=21
    - title: "Maryland House Bill 352"
      href: https://mgaleg.maryland.gov/hb0352.pdf
  label: Maryland standard deduction flat amount
JOINT:
  2025-01-01: 6_700
`;

  test('given a reference block then titles and links are read', () => {
    expect(parseParameterReferences(YAML)).toEqual([
      {
        title: 'Maryland 2025 Resident Tax Forms',
        href: 'https://www.marylandcomptroller.gov/booklet.pdf#page=21',
      },
      { title: 'Maryland House Bill 352', href: 'https://mgaleg.maryland.gov/hb0352.pdf' },
    ]);
  });

  test('given a breakdown or bracket parameter then its parent files are candidates', () => {
    expect(
      parameterSourceFiles('gov.states.md.tax.income.deductions.standard.amount.JOINT')
    ).toEqual([
      'gov/states/md/tax/income/deductions/standard/amount/JOINT.yaml',
      'gov/states/md/tax/income/deductions/standard/amount.yaml',
      'gov/states/md/tax/income/deductions/standard.yaml',
      'gov/states/md/tax/income/deductions.yaml',
    ]);
    expect(parameterSourceFiles('gov.irs.income.bracket.rates.joint[1].rate')[0]).toBe(
      'gov/irs/income/bracket/rates/joint.yaml'
    );
  });

  test('given the most specific file has references then those are returned and cached', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.endsWith('/amount.yaml')
        ? new Response(YAML, { status: 200 })
        : new Response('Not found', { status: 404 })
    ) as unknown as typeof fetch;
    const fetchReferences = createReferenceFetcher(fetchImpl);

    const first = await fetchReferences('gov.states.md.deductions.amount.JOINT');
    const second = await fetchReferences('gov.states.md.deductions.amount.JOINT');

    expect(first.map((reference) => reference.title)).toEqual([
      'Maryland 2025 Resident Tax Forms',
      'Maryland House Bill 352',
    ]);
    expect(second).toBe(first);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });
});
