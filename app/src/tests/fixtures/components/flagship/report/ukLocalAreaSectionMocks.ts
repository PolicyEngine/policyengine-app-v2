import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import {
  BREAKDOWN_BASELINE_POLICY_ID,
  BREAKDOWN_REFORM_POLICY_ID,
} from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import { MOCK_UK_REPORT_OUTPUT_WITH_LA } from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

/** A UK-wide report's identity, as ReportView passes it to the section. */
export const UK_SECTION_PROPS = {
  region: 'uk',
  year: '2026',
  reformPolicyId: BREAKDOWN_REFORM_POLICY_ID,
  baselinePolicyId: BREAKDOWN_BASELINE_POLICY_ID,
};

/** A national UK result from .py 6.10.0 on: no constituency or local authority impacts. */
export const NATIONAL_OUTPUT_WITHOUT_AREAS =
  createMockSocietyWideOutput() as unknown as SocietyWideReportOutput;

/** An older saved UK result that holds its area impacts. */
export const STORED_OUTPUT_WITH_AREAS = MOCK_UK_REPORT_OUTPUT_WITH_LA;

/** The area the breakdown fixture holds, by name. */
export const BREAKDOWN_CONSTITUENCY_NAME = 'East Kilbride and Strathaven';

/** A stored constituency, by name. */
export const STORED_CONSTITUENCY_NAME = 'Westminster North';
