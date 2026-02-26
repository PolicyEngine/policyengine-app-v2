import type { Meta, StoryObj } from '@storybook/react';
import type { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import type { Policy } from '@/types/ingredients/Policy';
import type { PolicyColumn } from '@/utils/policyTableHelpers';
import ParameterTable from './ParameterTable';

const meta: Meta<typeof ParameterTable> = {
  title: 'Report output/ParameterTable',
  component: ParameterTable,
};

export default meta;
type Story = StoryObj<typeof ParameterTable>;

// Mock parameter metadata with hierarchical labels
const mockParameters: Record<string, ParameterMetadata> = {
  'gov.irs.credits.ctc.amount.base': {
    label: 'Base amount',
    description: 'The base Child Tax Credit amount per qualifying child',
    parameter: 'gov.irs.credits.ctc.amount.base',
    unit: 'currency-USD',
    period: 'year',
    values: { '2026-01-01': 2000 },
    economy: true,
    household: true,
    type: 'parameter',
    indexInPSL: null,
    possibleValues: null,
  } as ParameterMetadata,
  'gov.irs.credits.ctc.phase_out.threshold.joint': {
    label: 'Joint threshold',
    description: 'Phase-out threshold for married filing jointly',
    parameter: 'gov.irs.credits.ctc.phase_out.threshold.joint',
    unit: 'currency-USD',
    period: 'year',
    values: { '2026-01-01': 400000 },
    economy: true,
    household: true,
    type: 'parameter',
    indexInPSL: null,
    possibleValues: null,
  } as ParameterMetadata,
  'gov.irs.deductions.standard.amount.joint': {
    label: 'Joint amount',
    description: 'Standard deduction for married filing jointly',
    parameter: 'gov.irs.deductions.standard.amount.joint',
    unit: 'currency-USD',
    period: 'year',
    values: { '2026-01-01': 30000 },
    economy: true,
    household: true,
    type: 'parameter',
    indexInPSL: null,
    possibleValues: null,
  } as ParameterMetadata,
  'gov.irs.income.bracket.rates.1': {
    label: 'Rate 1',
    description: 'First income tax bracket rate',
    parameter: 'gov.irs.income.bracket.rates.1',
    unit: '/1',
    period: 'year',
    values: { '2026-01-01': 0.1 },
    economy: true,
    household: true,
    type: 'parameter',
    indexInPSL: null,
    possibleValues: null,
  } as ParameterMetadata,
  'gov.irs.income.bracket.rates.2': {
    label: 'Rate 2',
    description: 'Second income tax bracket rate',
    parameter: 'gov.irs.income.bracket.rates.2',
    unit: '/1',
    period: 'year',
    values: { '2026-01-01': 0.12 },
    economy: true,
    household: true,
    type: 'parameter',
    indexInPSL: null,
    possibleValues: null,
  } as ParameterMetadata,
};

const parameterNames = Object.keys(mockParameters);

const mockPolicy: Policy = {
  id: 'policy-1',
  label: 'Expand CTC to $4,000',
  countryId: 'us',
};

const mockPolicy2: Policy = {
  id: 'policy-2',
  label: 'Flat tax at 25%',
  countryId: 'us',
};

const singleColumn: PolicyColumn = {
  policies: [mockPolicy],
  label: 'Reform',
  policyLabels: ['Expand CTC to $4,000'],
};

const twoColumns: PolicyColumn[] = [
  {
    policies: [mockPolicy],
    label: 'Reform 1',
    policyLabels: ['Expand CTC to $4,000'],
  },
  {
    policies: [mockPolicy2],
    label: 'Reform 2',
    policyLabels: ['Flat tax at 25%'],
  },
];

const reformValues: Record<string, Record<string, string>> = {
  'Expand CTC to $4,000': {
    'gov.irs.credits.ctc.amount.base': '$4,000',
    'gov.irs.credits.ctc.phase_out.threshold.joint': '$400,000',
    'gov.irs.deductions.standard.amount.joint': '$30,000',
    'gov.irs.income.bracket.rates.1': '10%',
    'gov.irs.income.bracket.rates.2': '12%',
  },
  'Flat tax at 25%': {
    'gov.irs.credits.ctc.amount.base': '$0',
    'gov.irs.credits.ctc.phase_out.threshold.joint': '$0',
    'gov.irs.deductions.standard.amount.joint': '$15,000',
    'gov.irs.income.bracket.rates.1': '25%',
    'gov.irs.income.bracket.rates.2': '25%',
  },
};

const currentLawValues: Record<string, string> = {
  'gov.irs.credits.ctc.amount.base': '$2,000',
  'gov.irs.credits.ctc.phase_out.threshold.joint': '$400,000',
  'gov.irs.deductions.standard.amount.joint': '$30,000',
  'gov.irs.income.bracket.rates.1': '10%',
  'gov.irs.income.bracket.rates.2': '12%',
};

export const SinglePolicy: Story = {
  args: {
    parameterNames,
    parameters: mockParameters,
    columns: [singleColumn],
    needsCurrentLawColumn: true,
    labelColumnWidth: 50,
    valueColumnWidth: 25,
    renderColumnHeader: (col: PolicyColumn) => col.policyLabels[0],
    renderCurrentLawValue: (paramName: string) => currentLawValues[paramName] ?? '—',
    renderColumnValue: (col: PolicyColumn, paramName: string) =>
      reformValues[col.policyLabels[0]]?.[paramName] ?? '—',
  },
};

export const TwoPolicies: Story = {
  args: {
    parameterNames,
    parameters: mockParameters,
    columns: twoColumns,
    needsCurrentLawColumn: true,
    labelColumnWidth: 40,
    valueColumnWidth: 20,
    renderColumnHeader: (col: PolicyColumn) => col.policyLabels[0],
    renderCurrentLawValue: (paramName: string) => currentLawValues[paramName] ?? '—',
    renderColumnValue: (col: PolicyColumn, paramName: string) =>
      reformValues[col.policyLabels[0]]?.[paramName] ?? '—',
  },
};

// Use all identical values for current law and reform to test visual appearance
export const IdenticalValues: Story = {
  args: {
    parameterNames,
    parameters: mockParameters,
    columns: [singleColumn],
    needsCurrentLawColumn: true,
    labelColumnWidth: 50,
    valueColumnWidth: 25,
    renderColumnHeader: (col: PolicyColumn) => col.policyLabels[0],
    renderCurrentLawValue: (paramName: string) => currentLawValues[paramName] ?? '—',
    renderColumnValue: (_col: PolicyColumn, paramName: string) =>
      currentLawValues[paramName] ?? '—',
  },
};
