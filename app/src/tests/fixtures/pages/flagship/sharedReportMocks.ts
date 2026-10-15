import {
  DEDUCTION_PARAMETERS,
  EXEMPTION_PATH,
} from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import {
  EXISTING_REPORT,
  EXISTING_SIMULATIONS,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';
import type { Policy } from '@/types/ingredients/Policy';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

/**
 * A report opened from a shared link: no provenance stashed in this
 * browser, so the page rebuilds the reform from its policy on the API.
 */

/** A report year after the current one, where current law has moved on. */
export const REPORT_YEAR_2028 = '2028';

/** The reform policy's id, as the reform simulation names it. */
export const SCHEDULE_POLICY_ID = EXISTING_SIMULATIONS[1].policyId!;

/** The personal exemption as metadata has it: 5,000 in 2026, 5,200 in 2028. */
export const EXEMPTION_METADATA = {
  [EXEMPTION_PATH]: DEDUCTION_PARAMETERS[EXEMPTION_PATH],
};

/** Current law for the exemption on 1 January 2028. */
export const EXEMPTION_CURRENT_LAW_2028 = 5200;

/** A phased reform: 6,000 for 2026 and 2027, then 8,000 from 2028 on. */
export const EXEMPTION_SCHEDULE = [
  { startDate: '2026-01-01', endDate: '2027-12-31', value: 6000 },
  { startDate: '2028-01-01', endDate: '2100-12-31', value: 8000 },
];

/** The schedule as the API's policy period map. */
export const EXEMPTION_SCHEDULE_PERIODS = {
  '2026-01-01.2027-12-31': 6000,
  '2028-01-01.2100-12-31': 8000,
};

export const EXEMPTION_SCHEDULE_POLICY: Policy = {
  id: SCHEDULE_POLICY_ID,
  countryId: 'us',
  label: 'Phased exemption',
  parameters: [{ name: EXEMPTION_PATH, values: EXEMPTION_SCHEDULE }],
};

/** The 2028 report of that reform, nationwide. */
export const SCHEDULE_REPORT_2028: Report = {
  ...EXISTING_REPORT,
  label: 'Phased exemption',
  year: REPORT_YEAR_2028,
};

/** A report whose simulations ran on one household, as the classic calculator saves them. */
export const HOUSEHOLD_SIMULATIONS: Simulation[] = EXISTING_SIMULATIONS.map((simulation) => ({
  ...simulation,
  populationId: '55123',
  populationType: 'household',
}));
