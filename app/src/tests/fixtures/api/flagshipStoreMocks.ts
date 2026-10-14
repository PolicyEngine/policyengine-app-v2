import { vi } from 'vitest';
import type { NewFlagshipReport } from '@/api/flagshipReportStore';
import type { NewReform } from '@/api/reformStore';
import {
  API_REPORT_ID,
  CENTRAL_REFORM_ID,
  CENTRAL_REPORT_ID,
  EDIT_TOKEN,
} from '@/tests/fixtures/libs/flagship/ownedItemsMocks';
import type { ReformCreatedMetadata, ReformMetadata } from '@/types/metadata/reformMetadata';

export const LEGACY_REFORMS_KEY = 'reforms';
export const LEGACY_REPORTS_KEY = 'pe-flagship-reports';

export const mockNewReform: NewReform = {
  countryId: 'us',
  label: 'CTC to $3,600 for children under 6',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0]',
      values: [{ startDate: '2026-01-01', endDate: '2026-12-31', value: 3600 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'chat', ref: 'session-1', confidence: 'exact' },
};

export const mockReformMetadata: ReformMetadata = {
  id: CENTRAL_REFORM_ID,
  country_id: 'us',
  label: 'CTC to $3,600 for children under 6',
  policy_id: null,
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0]',
      values: [{ start_date: '2026-01-01', end_date: '2026-12-31', value: 3600 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'chat', ref: 'session-1', confidence: 'exact' },
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
};

export const mockReformCreatedMetadata: ReformCreatedMetadata = {
  ...mockReformMetadata,
  edit_token: EDIT_TOKEN,
};

/**
 * A reform the localStorage fallback saved before user ids were dropped:
 * it still carries the shared mock user id.
 */
export const legacyLocalReform = {
  id: 'rf-mfz1abcd',
  userId: 'anonymous',
  countryId: 'us',
  label: 'Saved while the database was off',
  parameters: [
    {
      name: 'gov.irs.credits.eitc.max[0]',
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 700 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'manual' },
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
};

export const mockNewReport: NewFlagshipReport = {
  countryId: 'us',
  apiReportId: API_REPORT_ID,
  title: 'CTC to $2,500',
  sourceNote: 'Hand-built draft',
  provisions: [
    {
      path: 'gov.irs.credits.ctc.amount.base[0].amount',
      breadcrumb: 'IRS → Credits → CTC → Amount',
      unit: 'currency-USD',
      baselineValue: 2200,
      value: 2500,
    },
  ],
  year: '2026',
  reformId: null,
};

export const mockReportRow = {
  id: CENTRAL_REPORT_ID,
  country_id: 'us',
  api_report_id: API_REPORT_ID,
  title: 'CTC to $2,500',
  source_note: 'Hand-built draft',
  provisions: [],
  reform_id: null,
  year: '2026',
  validation: null,
  created_at: '2026-09-07T00:00:00.000Z',
};

/** A report record the localStorage fallback saved before user ids were dropped. */
export const legacyLocalReport = {
  id: 'lfr-mfz1abcdef',
  userId: 'anonymous',
  countryId: 'us',
  apiReportId: '3301',
  title: 'EITC expansion',
  sourceNote: 'Hand-built draft',
  provisions: [],
  year: '2026',
  createdAt: '2026-09-03T00:00:00.000Z',
  reformId: null,
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const mockJsonResponse = (body: unknown, status: number = HTTP_STATUS.OK) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(body),
});

export const mockErrorResponse = (status: number) => ({ ok: false, status });
