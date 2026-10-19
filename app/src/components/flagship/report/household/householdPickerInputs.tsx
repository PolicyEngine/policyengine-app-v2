/**
 * What the report's household picker opens on: the inputs most
 * households need, with short names, and an icon per topic. An input
 * shows only where it is offered, so one list serves the person picker
 * and the household picker alike.
 */
import {
  IconBuildingCommunity,
  IconCash,
  IconDots,
  IconHome,
  IconPigMoney,
  IconReceiptTax,
  IconStethoscope,
  IconUsers,
  IconWallet,
} from '@tabler/icons-react';
import type { CommonInput } from '@/components/household/VariablePickerDialog';
import type { VariableInfo } from '@/utils/VariableResolver';

/**
 * In order of how often a household needs them; the picker shows the first
 * it offers. The model has no description for most of them
 * (PolicyEngine/policyengine-us), so each carries its own.
 */
export const COMMON_HOUSEHOLD_INPUTS: CommonInput[] = [
  // A person's
  {
    name: 'pre_subsidy_rent',
    label: 'Rent',
    description: 'Rent this person pays for the home in a year, before any housing assistance.',
  },
  {
    name: 'self_employment_income_before_lsr',
    label: 'Self-employment income',
    description:
      'Net earnings from self-employment in a year: business income minus business expenses.',
  },
  {
    name: 'tip_income',
    label: 'Tips',
    description: 'Tips received in a year, in cash or through an employer.',
  },
  {
    name: 'unemployment_compensation',
    label: 'Unemployment benefits',
    description: 'Unemployment insurance benefits received in a year.',
  },
  {
    name: 'social_security_retirement',
    label: 'Social Security retirement',
    description: 'Social Security retirement benefits received in a year.',
  },
  {
    name: 'social_security_disability',
    label: 'Social Security disability',
    description: 'Social Security Disability Insurance (SSDI) benefits received in a year.',
  },
  {
    name: 'taxable_private_pension_income',
    label: 'Pension income',
    description: 'Taxable pension income from a private (non-government) employer in a year.',
  },
  {
    name: 'taxable_interest_income',
    label: 'Interest income',
    description: 'Taxable interest from bank accounts, bonds and similar holdings in a year.',
  },
  {
    name: 'other_medical_expenses',
    label: 'Medical expenses',
    description: 'Out-of-pocket medical costs in a year, other than insurance premiums.',
  },
  {
    name: 'qualified_dividend_income',
    label: 'Qualified dividends',
    description: 'Dividends taxed at the lower capital gains rates, received in a year.',
  },
  {
    name: 'child_support_received',
    label: 'Child support received',
    description: 'Child support payments received in a year.',
  },
  {
    name: 'health_insurance_premiums',
    label: 'Health insurance premiums',
    description: 'Health insurance premiums this person pays in a year.',
  },
  {
    name: 'student_loan_interest',
    label: 'Student loan interest',
    description: 'Interest paid on student loans in a year.',
  },
  // The household's
  {
    name: 'spm_unit_pre_subsidy_childcare_expenses',
    label: 'Child care expenses',
    description: 'What the household pays for child care in a year, before any child care subsidy.',
  },
  {
    name: 'pre_subsidy_electricity_expense',
    label: 'Electricity',
    description:
      'What the household pays for electricity in a year, before any utility assistance.',
  },
  {
    name: 'gas_expense',
    label: 'Gas',
    description: 'What the household pays for natural gas in a year.',
  },
  {
    name: 'water_expense',
    label: 'Water',
    description: 'What the household pays for water in a year.',
  },
  {
    name: 'mortgage_payments',
    label: 'Mortgage payments',
    description: 'Mortgage payments the household makes in a year.',
  },
  {
    name: 'homeowners_insurance',
    label: 'Homeowners insurance',
    description: 'Homeowners insurance premiums the household pays in a year.',
  },
  {
    name: 'spm_unit_assets',
    label: 'Savings and assets',
    description:
      "The value of the household's savings and other assets, which benefit asset tests count.",
  },
  {
    name: 'household_vehicles_owned',
    label: 'Vehicles owned',
    description: 'The number of vehicles the household owns.',
  },
];

const TOPIC_ICONS: Record<string, typeof IconHome> = {
  Income: IconCash,
  People: IconUsers,
  'Housing and utilities': IconHome,
  Health: IconStethoscope,
  'Other expenses': IconWallet,
  Assets: IconPigMoney,
  'Benefits and taxes': IconReceiptTax,
  'State and local': IconBuildingCommunity,
  Other: IconDots,
};

export function householdTopicIcon(group: string) {
  const Icon = TOPIC_ICONS[group] ?? IconDots;
  return <Icon size={16} stroke={1.75} />;
}

const SHORT_NAMES = new Map(COMMON_HOUSEHOLD_INPUTS.map((input) => [input.name, input.label]));

/**
 * An input's name as the picker lists it: a tile's short name, else the
 * model's label in sentence case without its modeling notes.
 */
export function householdInputName(variable: VariableInfo): string {
  const short = SHORT_NAMES.get(variable.name);
  if (short) {
    return short;
  }
  const label = variable.label.replace(/\s*\(before labor supply responses\)/i, '').trim();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const DESCRIPTIONS = new Map(
  COMMON_HOUSEHOLD_INPUTS.map((input) => [input.name, input.description])
);

/** What to enter for an input: the model's documentation, else ours for a featured one. */
export function householdInputDescription(variable: VariableInfo): string | undefined {
  return variable.documentation || DESCRIPTIONS.get(variable.name);
}
