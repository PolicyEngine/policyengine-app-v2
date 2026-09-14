import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  ApiFlagshipReportStore,
  LocalStorageFlagshipReportStore,
  NewFlagshipReport,
} from '@/api/flagshipReportStore';
import { validationToWire } from '@/libs/flagship/reportValidation';
import { mockReportValidationSnapshot } from '@/tests/fixtures/libs/flagship/reportValidationMocks';

const USER_ID = 'user-123';
const API_REPORT_ID = '4512';
const OTHER_API_REPORT_ID = '9999';

const newReport: NewFlagshipReport = {
  userId: USER_ID,
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
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 2500 }],
    },
  ],
  year: '2026',
  reformId: null,
};

describe('LocalStorageFlagshipReportStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('given a created report then it is found by its API report id for that user', async () => {
    const store = new LocalStorageFlagshipReportStore();
    const created = await store.create(newReport);

    await expect(store.findByApiReportId(USER_ID, API_REPORT_ID)).resolves.toEqual(created);
    await expect(store.findByApiReportId(USER_ID, OTHER_API_REPORT_ID)).resolves.toBeNull();
    await expect(store.findByApiReportId('someone-else', API_REPORT_ID)).resolves.toBeNull();
  });

  test('given a saved validation then it persists on the record', async () => {
    const store = new LocalStorageFlagshipReportStore();
    const created = await store.create(newReport);

    const updated = await store.saveValidation(created.id, mockReportValidationSnapshot);

    expect(updated.validation).toEqual(mockReportValidationSnapshot);
    const reloaded = await new LocalStorageFlagshipReportStore().findById(created.id);
    expect(reloaded?.validation).toEqual(mockReportValidationSnapshot);
  });

  test('given an unknown record then saving a validation fails', async () => {
    const store = new LocalStorageFlagshipReportStore();

    await expect(store.saveValidation('lfr-missing', mockReportValidationSnapshot)).rejects.toThrow(
      'Report not found'
    );
  });

  test('given a legacy scalar provision then reading converts it to dated values', async () => {
    localStorage.setItem(
      'pe-flagship-reports',
      JSON.stringify([
        {
          ...newReport,
          id: 'legacy-report',
          createdAt: '2026-01-01T00:00:00.000Z',
          provisions: [
            {
              path: newReport.provisions[0].path,
              breadcrumb: newReport.provisions[0].breadcrumb,
              unit: newReport.provisions[0].unit,
              baselineValue: 2200,
              value: 2500,
            },
          ],
        },
      ])
    );

    const record = await new LocalStorageFlagshipReportStore().findById('legacy-report');

    expect(record?.provisions[0].values).toEqual([
      { startDate: '2026-01-01', endDate: '2100-12-31', value: 2500 },
    ]);
    expect(record?.provisions[0]).not.toHaveProperty('value');
  });
});

describe('ApiFlagshipReportStore', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const storedRow = {
    id: 'rp-1',
    user_id: USER_ID,
    country_id: 'us',
    api_report_id: API_REPORT_ID,
    title: 'CTC to $2,500',
    source_note: 'Hand-built draft',
    provisions: [],
    reform_id: null,
    year: '2026',
    validation: validationToWire(mockReportValidationSnapshot),
    created_at: '2026-09-07T00:00:00.000Z',
  };

  test('given an API report id then the list route is queried for it and the pin decoded', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [storedRow] });
    const store = new ApiFlagshipReportStore();

    const record = await store.findByApiReportId(USER_ID, API_REPORT_ID);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/reports?user_id=${USER_ID}&api_report_id=${API_REPORT_ID}`
    );
    expect(record?.validation).toEqual(mockReportValidationSnapshot);
  });

  test('given a new report then the API receives dated values without a duplicate scalar', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => storedRow });
    const store = new ApiFlagshipReportStore();

    await store.create(newReport);

    const request = fetchMock.mock.calls[0][1];
    const body = JSON.parse(request.body);
    expect(body.provisions[0].values).toEqual(newReport.provisions[0].values);
    expect(body.provisions[0]).not.toHaveProperty('value');
  });

  test('given a snapshot then it is PATCHed in wire form', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => storedRow });
    const store = new ApiFlagshipReportStore();

    await store.saveValidation('rp-1', mockReportValidationSnapshot);

    expect(fetchMock).toHaveBeenCalledWith('/api/reports/rp-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validation: validationToWire(mockReportValidationSnapshot) }),
    });
  });
});
