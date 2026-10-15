import type { DistrictImpactRow } from '@/components/flagship/report/DistrictImpactCard';

/**
 * Maryland's eight districts under report 4327 (MD CTC increase, 2027): a
 * small state reform, so every relative change is a few thousandths of a
 * percent, and no one loses. The relative changes of the 3rd, 7th, 5th,
 * 2nd and 4th are the API's; the rest of each row is illustrative.
 */
export const MARYLAND_4327_DISTRICTS: DistrictImpactRow[] = [
  {
    district: 'MD-01',
    average_household_income_change: 3,
    relative_household_income_change: 2.9e-5,
    winner_percentage: 0.011,
    loser_percentage: 0,
  },
  {
    district: 'MD-02',
    average_household_income_change: 5,
    relative_household_income_change: 5.29e-5,
    winner_percentage: 0.016,
    loser_percentage: 0,
  },
  {
    district: 'MD-03',
    average_household_income_change: 11,
    relative_household_income_change: 9.98e-5,
    winner_percentage: 0.024,
    loser_percentage: 0,
  },
  {
    district: 'MD-04',
    average_household_income_change: 2,
    relative_household_income_change: 1.62e-5,
    winner_percentage: 0.009,
    loser_percentage: 0,
  },
  {
    district: 'MD-05',
    average_household_income_change: 9,
    relative_household_income_change: 7.65e-5,
    winner_percentage: 0.021,
    loser_percentage: 0,
  },
  {
    district: 'MD-06',
    average_household_income_change: 4,
    relative_household_income_change: 3.4e-5,
    winner_percentage: 0.013,
    loser_percentage: 0,
  },
  {
    district: 'MD-07',
    average_household_income_change: 8,
    relative_household_income_change: 8.7e-5,
    winner_percentage: 0.02,
    loser_percentage: 0,
  },
  {
    district: 'MD-08',
    average_household_income_change: 3,
    relative_household_income_change: 2.4e-5,
    winner_percentage: 0.01,
    loser_percentage: 0,
  },
];

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

/** Maryland's district names, as the district metadata gives them. */
export const MARYLAND_DISTRICT_LABELS = new Map(
  ORDINALS.map((ordinal, i) => [`MD-0${i + 1}`, `Maryland's ${ordinal} congressional district`])
);

/** Maryland's districts with one district's relative change set to a tiny loss. */
export function withTinyRelativeLoss(
  districts: DistrictImpactRow[],
  districtId: string
): DistrictImpactRow[] {
  return districts.map((row) =>
    row.district === districtId ? { ...row, relative_household_income_change: -1e-9 } : row
  );
}
