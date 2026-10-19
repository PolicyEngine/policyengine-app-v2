/**
 * What the report's household picker opens on: the inputs most
 * households need, as tiles with short names, and an icon per topic.
 * A tile shows only where its input is offered, so one list serves the
 * person picker and the household picker alike.
 */
import {
  IconBabyCarriage,
  IconBolt,
  IconBriefcase,
  IconBuildingBank,
  IconBuildingCommunity,
  IconCar,
  IconCash,
  IconChartLine,
  IconCoin,
  IconDots,
  IconDroplet,
  IconFlame,
  IconHeartHandshake,
  IconHome,
  IconHomeDollar,
  IconPigMoney,
  IconReceiptTax,
  IconSchool,
  IconShieldHeart,
  IconStethoscope,
  IconUserHeart,
  IconUsers,
  IconWallet,
  IconWheelchair,
} from '@tabler/icons-react';
import type { CommonInput } from '@/components/household/VariablePickerDialog';
import type { VariableInfo } from '@/utils/VariableResolver';

const ICON = { size: 18, stroke: 1.75 };

/** In order of how often a household needs them; the picker shows the first it offers. */
export const COMMON_HOUSEHOLD_INPUTS: CommonInput[] = [
  // A person's
  { name: 'pre_subsidy_rent', label: 'Rent', icon: <IconHome {...ICON} /> },
  {
    name: 'self_employment_income_before_lsr',
    label: 'Self-employment income',
    icon: <IconBriefcase {...ICON} />,
  },
  { name: 'tip_income', label: 'Tips', icon: <IconCoin {...ICON} /> },
  {
    name: 'unemployment_compensation',
    label: 'Unemployment benefits',
    icon: <IconWallet {...ICON} />,
  },
  {
    name: 'social_security_retirement',
    label: 'Social Security retirement',
    icon: <IconHeartHandshake {...ICON} />,
  },
  {
    name: 'social_security_disability',
    label: 'Social Security disability',
    icon: <IconWheelchair {...ICON} />,
  },
  {
    name: 'taxable_private_pension_income',
    label: 'Pension income',
    icon: <IconBuildingBank {...ICON} />,
  },
  { name: 'taxable_interest_income', label: 'Interest income', icon: <IconPigMoney {...ICON} /> },
  {
    name: 'other_medical_expenses',
    label: 'Medical expenses',
    icon: <IconStethoscope {...ICON} />,
  },
  {
    name: 'qualified_dividend_income',
    label: 'Qualified dividends',
    icon: <IconChartLine {...ICON} />,
  },
  {
    name: 'child_support_received',
    label: 'Child support received',
    icon: <IconUserHeart {...ICON} />,
  },
  {
    name: 'health_insurance_premiums',
    label: 'Health insurance premiums',
    icon: <IconShieldHeart {...ICON} />,
  },
  { name: 'student_loan_interest', label: 'Student loan interest', icon: <IconSchool {...ICON} /> },
  // The household's
  {
    name: 'spm_unit_pre_subsidy_childcare_expenses',
    label: 'Child care expenses',
    icon: <IconBabyCarriage {...ICON} />,
  },
  { name: 'pre_subsidy_electricity_expense', label: 'Electricity', icon: <IconBolt {...ICON} /> },
  { name: 'gas_expense', label: 'Gas', icon: <IconFlame {...ICON} /> },
  { name: 'water_expense', label: 'Water', icon: <IconDroplet {...ICON} /> },
  { name: 'mortgage_payments', label: 'Mortgage payments', icon: <IconHomeDollar {...ICON} /> },
  {
    name: 'homeowners_insurance',
    label: 'Homeowners insurance',
    icon: <IconShieldHeart {...ICON} />,
  },
  { name: 'spm_unit_assets', label: 'Savings and assets', icon: <IconPigMoney {...ICON} /> },
  { name: 'household_vehicles_owned', label: 'Vehicles owned', icon: <IconCar {...ICON} /> },
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
