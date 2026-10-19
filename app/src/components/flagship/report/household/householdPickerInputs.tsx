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

/** In order of how often a household needs them; the picker shows the first it offers. */
export const COMMON_HOUSEHOLD_INPUTS: CommonInput[] = [
  // A person's
  { name: 'pre_subsidy_rent', label: 'Rent' },
  {
    name: 'self_employment_income_before_lsr',
    label: 'Self-employment income',
  },
  { name: 'tip_income', label: 'Tips' },
  {
    name: 'unemployment_compensation',
    label: 'Unemployment benefits',
  },
  {
    name: 'social_security_retirement',
    label: 'Social Security retirement',
  },
  {
    name: 'social_security_disability',
    label: 'Social Security disability',
  },
  {
    name: 'taxable_private_pension_income',
    label: 'Pension income',
  },
  { name: 'taxable_interest_income', label: 'Interest income' },
  {
    name: 'other_medical_expenses',
    label: 'Medical expenses',
  },
  {
    name: 'qualified_dividend_income',
    label: 'Qualified dividends',
  },
  {
    name: 'child_support_received',
    label: 'Child support received',
  },
  {
    name: 'health_insurance_premiums',
    label: 'Health insurance premiums',
  },
  { name: 'student_loan_interest', label: 'Student loan interest' },
  // The household's
  {
    name: 'spm_unit_pre_subsidy_childcare_expenses',
    label: 'Child care expenses',
  },
  { name: 'pre_subsidy_electricity_expense', label: 'Electricity' },
  { name: 'gas_expense', label: 'Gas' },
  { name: 'water_expense', label: 'Water' },
  { name: 'mortgage_payments', label: 'Mortgage payments' },
  {
    name: 'homeowners_insurance',
    label: 'Homeowners insurance',
  },
  { name: 'spm_unit_assets', label: 'Savings and assets' },
  { name: 'household_vehicles_owned', label: 'Vehicles owned' },
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
