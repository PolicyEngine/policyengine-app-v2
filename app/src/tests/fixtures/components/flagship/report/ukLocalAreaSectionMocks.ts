import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import {
  BREAKDOWN_BASELINE_POLICY_ID,
  BREAKDOWN_REFORM_POLICY_ID,
} from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import {
  MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD,
  MOCK_UK_REPORT_OUTPUT_WITH_LA,
} from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

/** A UK-wide report's identity, as ReportView passes it to the section. */
export const UK_SECTION_PROPS = {
  region: 'uk',
  year: '2026',
  reformPolicyId: BREAKDOWN_REFORM_POLICY_ID,
  baselinePolicyId: BREAKDOWN_BASELINE_POLICY_ID,
};

/** The first .py release that serves local-area breakdowns, and one before it. */
export const BREAKDOWN_RELEASE_VERSION = '6.10.0';
export const OLDER_RELEASE_VERSION = '6.7.5';

/** A national UK result from .py 6.10.0 on: no constituency or local authority impacts. */
export const NATIONAL_OUTPUT_WITHOUT_AREAS = {
  ...createMockSocietyWideOutput(),
  policyengine_version: BREAKDOWN_RELEASE_VERSION,
} as unknown as SocietyWideReportOutput;

/** A stored result with no .py version and no area impacts (before February 2025). */
export const UNVERSIONED_OUTPUT_WITHOUT_AREAS =
  createMockSocietyWideOutput() as unknown as SocietyWideReportOutput;

/**
 * A stored result from an older release with constituencies but no local
 * authorities (before December 2025).
 */
export const OLDER_OUTPUT_WITHOUT_LOCAL_AUTHORITIES = {
  ...MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD,
  policyengine_version: OLDER_RELEASE_VERSION,
} as unknown as SocietyWideReportOutput;

/**
 * A result from a release that serves breakdowns, holding constituencies
 * but no local authorities: not one the API returns, but it exercises a
 * view's per-level decision.
 */
export const BREAKDOWN_RELEASE_OUTPUT_WITH_CONSTITUENCIES_ONLY = {
  ...MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD,
  policyengine_version: BREAKDOWN_RELEASE_VERSION,
} as unknown as SocietyWideReportOutput;

/** An older saved UK result that holds its area impacts. */
export const STORED_OUTPUT_WITH_AREAS = MOCK_UK_REPORT_OUTPUT_WITH_LA;

/** The area the breakdown fixture holds, by name. */
export const BREAKDOWN_CONSTITUENCY_NAME = 'East Kilbride and Strathaven';

/** A stored constituency, by name. */
export const STORED_CONSTITUENCY_NAME = 'Westminster North';

/** The local authority the breakdown fixture holds, by name. */
export const BREAKDOWN_LOCAL_AUTHORITY_NAME = 'Hartlepool';

/** The UK report ReportView's local-area tests open. */
export const UK_REPORT_TITLE = 'Higher personal allowance';
export const UK_REPORT_SOURCE_NOTE = 'Hand-built';
