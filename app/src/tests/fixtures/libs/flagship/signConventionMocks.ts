import type { RelatedScorecardClaim } from '@/libs/flagship/scorecardComparisons';
import type { SignRelation } from '@/libs/flagship/signConvention';

/** A UK scorecard claim with a recorded sign convention. */
export const ukClaim = ({
  metric,
  convention,
  changeDirection,
  external = 1e9,
  value = 1e9,
  annotations = [],
}: {
  metric: string;
  convention?: string;
  changeDirection?: string;
  external?: number;
  value?: number | null;
  annotations?: string[];
}): RelatedScorecardClaim => ({
  claim_id: `uk-${metric}`,
  country: 'UK',
  source: 'hmrc',
  name: 'UK claim',
  metric,
  unit_concept: 'gbp',
  period: 2026,
  reform_framework: 'policy_ref',
  reform_key: 'uk-reform',
  external_value: external,
  conditions: { sign_convention: convention, change_direction: changeDirection },
  latest: { value, status: 'constructed', construction: '', annotations },
  matchBasis: 'parameter',
});

/** HMRC's ready reckoner: "Change personal allowance by 1%", a cost printed without a sign. */
export const PERSONAL_ALLOWANCE_1PCT = {
  ...ukClaim({
    metric: 'revenue_change',
    convention: 'magnitude_with_direction_in_label',
    changeDirection: 'unsigned',
    external: 1e9,
    value: -1_131_417_187,
  }),
  name: 'Change personal allowance by 1%',
};

/**
 * The most frequent UK conventions in the scorecard feed (by row count),
 * verbatim, with the relation to PolicyEngine's sign for their metric.
 */
export const UK_SIGN_CONVENTIONS: Array<[string, string, SignRelation]> = [
  ['positive = gain to households', 'average_household_income_change', 'same'],
  [
    "positive = yield to the Exchequer (reduces borrowing); negative = cost to the Exchequer (no legend printed in the document; convention observed from the costings' own wording, e.g. 'yield' rows carry + and 'cost' rows carry -)",
    'revenue_change',
    'same',
  ],
  ['positive_gain_to_exchequer', 'revenue_change', 'same'],
  ['positive = gain to households', 'pct_change_after_tax_income', 'same'],
  [
    'Note (verbatim): A positive sign implies an increase in borrowing.',
    'revenue_change',
    'opposite',
  ],
  [
    "positive = increase in borrowing (no note printed on this table; chapter convention per the Table 3.1 note 'A positive sign implies an increase in borrowing' and the Box 3.3 Table A note 'Here we present higher taxes as positive numbers, in contrast to the tables elsewhere in this chapter')",
    'revenue_change',
    'opposite',
  ],
  ['positive = yield to the Exchequer', 'revenue_change', 'same'],
  [
    'Note (verbatim): This table uses the convention that a negative figure means a reduction in PSNB.',
    'revenue_change',
    'opposite',
  ],
  ['positive = reduction in public spending', 'revenue_change', 'same'],
  [
    'Note (verbatim): Here we present higher taxes as positive numbers, in contrast to the tables elsewhere in this chapter.',
    'revenue_change',
    'same',
  ],
  ['positive = more people in poverty under the reform', 'poverty_count_change', 'same'],
  [
    'positive = gain to households (percentage change in net income)',
    'pct_change_after_tax_income',
    'same',
  ],
  ['positive = children brought out of poverty', 'poverty_count_change', 'opposite'],
  ['count', 'income_aggregate', 'same'],
  ['positive = higher government revenue (gain to the Exchequer)', 'revenue_change', 'same'],
  [
    'positive = net gain to the Exchequer (revenue change minus expenditure change)',
    'revenue_change',
    'same',
  ],
  ['positive = cost to the Exchequer', 'revenue_change', 'opposite'],
  ['positive = children lifted out of poverty', 'poverty_count_change', 'opposite'],
  ['as worded (positive = yield / reduction in borrowing)', 'revenue_change', 'same'],
  ['level (£ billion of income)', 'income_aggregate', 'same'],
  [
    'Note (verbatim): The static yield values in this table use the convention that a negative figure means a reduction in PSNB.',
    'revenue_change',
    'opposite',
  ],
  ['as worded (positive = cost / increase in borrowing)', 'revenue_change', 'opposite'],
  ['magnitude_with_direction_in_label', 'revenue_change', 'magnitude'],
  [
    'positive = loss to households (printed as a loss)',
    'average_household_income_change',
    'opposite',
  ],
  ['positive = reduction in the child poverty rate', 'poverty_rate_change', 'opposite'],
  ['positive = fewer children in poverty', 'poverty_count_change', 'opposite'],
  // Rare or unestablished: no gap rather than a guess.
  ["positive = increase in the employee's tax liability", 'average_tax_change', 'unknown'],
  ['positive = saving', 'energy_bill_change', 'unknown'],
  [
    'positive = increase in borrowing (no note printed on this table; chapter convention) (this table: positive = higher UC spending)',
    'revenue_change',
    'unknown',
  ],
  [
    'negative = reduction in the number of people at risk of hunger and hardship (as printed)',
    'poverty_count_change',
    'unknown',
  ],
];
