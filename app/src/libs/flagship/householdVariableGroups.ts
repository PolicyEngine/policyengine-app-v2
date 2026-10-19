/**
 * Groups for the household builder's variable search, from where the
 * model files each input (its module): income, people, housing, and so
 * on, in the order a reader looks for them. State and local programs'
 * inputs belong to one state, so only the household's state's show. The
 * UK model files no input under a module, so the UK's group by name.
 */
import type { VariableInfo } from '@/utils/VariableResolver';

export const HOUSEHOLD_VARIABLE_GROUPS = [
  'Income',
  'People',
  'Housing and utilities',
  'Health',
  'Other expenses',
  'Assets',
  'Benefits and taxes',
  'State and local',
  'Other',
] as const;

export type HouseholdVariableGroup = (typeof HOUSEHOLD_VARIABLE_GROUPS)[number];

export function householdVariableGroup(variable: VariableInfo): HouseholdVariableGroup {
  const module = variable.moduleName ?? '';
  if (module.startsWith('household.income')) {
    return 'Income';
  }
  if (module.startsWith('household.demographic') || module.startsWith('input.geography')) {
    return 'People';
  }
  if (
    module.startsWith('household.expense.housing') ||
    module.startsWith('household.expense.utilities')
  ) {
    return 'Housing and utilities';
  }
  if (module.startsWith('household.expense.health')) {
    return 'Health';
  }
  if (module.startsWith('household.expense')) {
    return 'Other expenses';
  }
  if (module.startsWith('household.assets')) {
    return 'Assets';
  }
  if (module.startsWith('gov.states') || module.startsWith('gov.local')) {
    return 'State and local';
  }
  if (module.startsWith('gov.') && !module.startsWith('gov.puf')) {
    return 'Benefits and taxes';
  }
  return 'Other';
}

/** The two-letter state a state or local program's input belongs to, e.g. "ca"; null otherwise. */
function programState(variable: VariableInfo): string | null {
  const match = /^gov\.(?:states|local)\.([a-z]{2})(?:\.|$)/.exec(variable.moduleName ?? '');
  return match ? match[1] : null;
}

/**
 * Whether the search lists a variable for a household in `stateCode`
 * ("CA"): every input but other states' programs. With no state chosen,
 * no state's programs show — choosing one brings them.
 */
export function listsForState(variable: VariableInfo, stateCode: string | null): boolean {
  const state = programState(variable);
  return state === null || (!!stateCode && state === stateCode.toLowerCase());
}

/** Income's parts, in the order a reader looks for them. */
export const HOUSEHOLD_INCOME_SUBGROUPS = [
  'Wages and work',
  'Self-employment and business',
  'Investments',
  'Retirement',
  'Other income',
] as const;

type IncomeSubgroup = (typeof HOUSEHOLD_INCOME_SUBGROUPS)[number];

const WORK_MODULES = new Set([
  'hourly_wage',
  'hours_worked_last_week',
  'is_paid_hourly',
  'is_union_member_or_covered',
  'tip_income',
  'fsla_overtime_premium',
  'weekly_hours_worked',
  'dependent_care_employer_benefits',
]);
const BUSINESS_MODULES = new Set(['self_employment', 'farm', 'estate']);
const INVESTMENT_MODULES = new Set([
  'capital_gains',
  'dividends',
  'interest',
  'us_govt_interest_person',
  'property_sales_net_capital_gain',
  'form_4972_lumpsum_distributions',
]);

/**
 * The part of its group a variable reads under, from its module: Income
 * splits into wages, business, investments, retirement and the rest.
 * Null for groups without parts.
 */
export function householdVariableSubgroup(variable: VariableInfo): string | null {
  if (householdVariableGroup(variable) !== 'Income') {
    return null;
  }
  // `household.income.person.dividends…` → "dividends"; a module at the top keeps its own name.
  const parts = (variable.moduleName ?? '').split('.');
  const leaf = ['person', 'tax_unit', 'spm_unit', 'household'].includes(parts[2])
    ? parts[3]
    : parts[2];
  if (WORK_MODULES.has(leaf)) {
    return 'Wages and work';
  }
  if (BUSINESS_MODULES.has(leaf)) {
    return 'Self-employment and business';
  }
  if (INVESTMENT_MODULES.has(leaf)) {
    return 'Investments';
  }
  if (leaf === 'retirement') {
    return 'Retirement';
  }
  return 'Other income';
}

/**
 * Inputs that only the microdata sets, by name: ids and roles, the
 * entities' own holders, survey weights, take-up and random draws, and
 * the UK model's survey flags, baselines and public-spending imputations.
 */
const MICRODATA_INPUT = new RegExp(
  [
    '(^|_)(id|role)$',
    '^(people|families|households|benunits)$',
    '(^|_)weight$',
    '^would_(claim|evade)_',
    '^baseline_.+_entitlement$',
    'random_draw$',
    '^(in_original_frs|spi_imputed|uc_migrated|base_net_income)$',
    '^nhs_.+_spending$',
    '^(dfe_education_spending|bus_subsidy_spending)$',
  ].join('|')
);

/**
 * Inputs the UK model keeps only for old API callers, which its
 * documentation does not mark: `pension_income` gave way to
 * `private_pension_income`, which is the one the model reads.
 */
const UK_DEPRECATED_INPUTS = new Set(['pension_income']);

/**
 * Inputs a reader does not describe a household with: amounts the survey
 * reports for a whole unit, analysts' incidence inputs, inputs the
 * microdata sets (ids, weights, take-up draws), and inputs the model
 * keeps only for old API callers.
 */
export function describesAHousehold(variable: VariableInfo, countryId: string = 'us'): boolean {
  const module = variable.moduleName ?? '';
  return !(
    /^deprecated/i.test(variable.documentation ?? '') ||
    /(^|_)reported($|_)/.test(variable.name) ||
    MICRODATA_INPUT.test(variable.name) ||
    (countryId === 'uk' && UK_DEPRECATED_INPUTS.has(variable.name)) ||
    module.startsWith('household.income.spm_unit') ||
    module.startsWith('household.income.household.cbo')
  );
}

/**
 * The UK model files no input under a module, so its inputs group by
 * name: the first rule that matches wins, and an unmatched input is
 * "Other". Each rule names its group and, for Income, its part.
 */
const UK_RULES: Array<[HouseholdVariableGroup, IncomeSubgroup | null, RegExp]> = [
  [
    'Income',
    'Wages and work',
    /^(employment_income_before_lsr|hours_worked|employment_status|employment_sector|employment_expenses|sic_industry_division|statutory_(sick|maternity|paternity)_pay|is_apprentice|is_about_to_start_paid_work)$/,
  ],
  [
    'Income',
    'Self-employment and business',
    /^(self_employment_income|self_employment_gross_receipts|trading_loss|capital_allowances|is_newly_self_employed|is_engaged_in_owned_company_trade|stands_as_sole_owner_or_partner_of_company)$|^owned_company_/,
  ],
  [
    'Income',
    'Investments',
    /^(savings_interest_income|individual_savings_account_interest_income|dividend_income|property_income|property_rental_income|property_finance_costs|property_finance_costs_brought_forward|other_investment_income|sublet_income)$|^capital_gains_/,
  ],
  ['Income', 'Retirement', /^(private_pension_income|pension_income)$/],
  [
    'Income',
    'Other income',
    /^(maintenance_income|private_transfer_income|lump_sum_income|miscellaneous_income|student_loans|education_grants|access_fund|adult_ema|child_ema|external_child_payments)$/,
  ],
  [
    'People',
    null,
    /^(age|gender|is_disabled_for_benefits|is_blind|care_hours|in_FE|in_HE|highest_education|is_parent|aa_category|is_looked_after_by_local_authority|is_in_approved_training|age_started_or_accepted_current_education_or_training|region|local_authority|in_rural_fuel_duty_relief_area)$|^(pip|dla)_.+_category$/,
  ],
  [
    'Housing and utilities',
    null,
    /^(rent|council_tax|council_tax_band|tenure_type|num_bedrooms|accommodation_type|is_shared_accommodation|housing_service_charges|water_and_sewerage_charges|rent_paid_as_boarder|rent_paid_as_lodger|meals_included_in_rent|liable_for_share_of_household_rent|domestic_energy_consumption|electricity_consumption|gas_consumption|uses_energy_prepayment_meter|domestic_rates|structural_insurance_payments|non_residential_rent|cumulative_residential_rent|cumulative_non_residential_rent|household_owns_tv|property_purchased|main_residential_property_purchased_is_first_home)$|^mortgage_.+_repayment$/,
  ],
  [
    'Health',
    null,
    /^(a_and_e_visits|admitted_patient_visits|outpatient_visits|health_consumption)$/,
  ],
  [
    'Assets',
    null,
    /^(savings|cash_isa|stocks_and_shares_isa|lifetime_isa_balance|main_residence_value|other_residential_property_value|non_residential_property_value|owned_land|private_pension_wealth|gross_financial_wealth|net_financial_wealth|consumer_debt|mortgage_debt|corporate_wealth)$/,
  ],
  [
    'Other expenses',
    null,
    /^(childcare_expenses|maintenance_expenses|gift_aid|covenanted_payments|charitable_investment_gifts|personal_pension_contributions|employer_pension_contributions|pension_contributions_via_salary_sacrifice|student_loan_plan|student_loan_balance|num_vehicles|petrol_spending|diesel_spending|lpg_kg|natural_gas_kg|full_rate_vat_expenditure_rate|rail_usage|bus_in_london_trips|other_local_bus_trips|max_free_entitlement_hours_used|maximum_extended_childcare_hours_usage)$|^car_|_consumption$|^(beer|cider|sparkling_cider|wine|spirits|other_fermented)_(litres|draught_share)$|^(cigarettes|cigars_grams|hand_rolling_tobacco_grams|heated_tobacco_grams|other_tobacco_grams)_per_week$/,
  ],
  [
    'Benefits and taxes',
    null,
    /^(uc|tax_free_childcare|childcare_grant|bursary_fund_16_to_19|travel_grant|adult_dependants_grant|disabled_students_allowance)_|^(child_benefit_opts_out|working_tax_credit_run_on|blind_persons_allowance|married_couples_allowance|ni_class_3|other_tax_credits|other_deductions|deficiency_relief|armed_forces_independence_payment|receives_benefits_in_own_right|receives_limited_capability_for_work_credits|is_before_universal_credit_qualifying_young_person_terminal_date|ebr_energy_bills_credit_eligible|scottish_funded_early_learning_childcare_start_date_reached|housing_benefit_board_and_attendance_determination|in_specified_or_temporary_accommodation|free_school_meals|free_school_fruit_veg|free_school_milk|healthy_start_vouchers|bus_pass_eligible)$/,
  ],
];

function ukRule(variable: VariableInfo) {
  return UK_RULES.find(([, , pattern]) => pattern.test(variable.name));
}

/** A UK input's group, by its name. */
export function ukHouseholdVariableGroup(variable: VariableInfo): HouseholdVariableGroup {
  return ukRule(variable)?.[0] ?? 'Other';
}

/** A UK input's part of Income, by its name; null outside Income. */
export function ukHouseholdVariableSubgroup(variable: VariableInfo): string | null {
  const rule = ukRule(variable);
  return rule?.[0] === 'Income' ? (rule[1] ?? 'Other income') : null;
}

/** The group function for a country's inputs: the UK's by name, the rest by module. */
export function householdVariableGroupOf(
  countryId: string
): (variable: VariableInfo) => HouseholdVariableGroup {
  return countryId === 'uk' ? ukHouseholdVariableGroup : householdVariableGroup;
}

/** The Income-part function for a country's inputs. */
export function householdVariableSubgroupOf(
  countryId: string
): (variable: VariableInfo) => string | null {
  return countryId === 'uk' ? ukHouseholdVariableSubgroup : householdVariableSubgroup;
}
