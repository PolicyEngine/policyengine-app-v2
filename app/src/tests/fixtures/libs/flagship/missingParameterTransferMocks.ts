import type { RunReportProvision } from '@/libs/flagship/runReport';
import { REMOVED_US_PARAMETER } from '@/tests/fixtures/libs/flagship/missingParametersMocks';
import type { Reform } from '@/types/ingredients/Reform';
import type { Parameter } from '@/types/subIngredients/parameter';

/** A parameter the current model still has. */
export const KEPT_PARAMETER = 'gov.irs.credits.ctc.amount.base[0].amount';

/** A saved reform's change to a parameter the model still has. */
export const KEPT_PARAMETER_CHANGE: Parameter = {
  name: KEPT_PARAMETER,
  values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
};

/** A saved reform's change to a parameter the model no longer has. */
export const REMOVED_PARAMETER_CHANGE: Parameter = {
  name: REMOVED_US_PARAMETER,
  values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 0 }],
};

/** A report's provision for the parameter the model still has. */
export const KEPT_PROVISION: RunReportProvision = {
  path: KEPT_PARAMETER,
  breadcrumb: 'IRS → Credits → CTC → Base amount',
  unit: 'currency-USD',
  baselineValue: 2000,
  value: 3600,
  intervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
};

/** A report's provision for the parameter the model no longer has. */
export const REMOVED_PROVISION: RunReportProvision = {
  path: REMOVED_US_PARAMETER,
  breadcrumb: REMOVED_US_PARAMETER,
  unit: null,
  baselineValue: null,
  value: 0,
  intervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 0 }],
};

/** A saved reform that changes a kept parameter and a removed one. */
export const REFORM_WITH_REMOVED_PARAMETER: Reform = {
  id: 'rf-removed',
  countryId: 'us',
  label: 'Reform with a removed parameter',
  policyId: '95762',
  parameters: [KEPT_PARAMETER_CHANGE, REMOVED_PARAMETER_CHANGE],
  missingParameters: [REMOVED_US_PARAMETER],
  baseline: 'current-policy',
  provenance: { source: 'chat', ref: 'session-1', confidence: 'exact' },
  updatedAt: '2026-08-01T00:00:00Z',
};

/** A saved reform whose only change is to a removed parameter. */
export const REFORM_WITH_ONLY_REMOVED_PARAMETERS: Reform = {
  ...REFORM_WITH_REMOVED_PARAMETER,
  id: 'rf-only-removed',
  label: 'Reform with only removed parameters',
  parameters: [REMOVED_PARAMETER_CHANGE],
};
