import { beforeEach, describe, expect, test } from 'vitest';
import {
  ApiFlagshipReportStore,
  getFlagshipReportStore,
  LocalStorageFlagshipReportStore,
  NewFlagshipReport,
  provisionsFromWire,
  provisionsToWire,
} from '@/api/flagshipReportStore';
import { recordImportedIds, resolveImportedId } from '@/libs/auth/importedIds';
import { validationToWire } from '@/libs/flagship/reportValidation';
import {
  ASSOCIATION_IDS,
  createTestApiContext,
  fetchCall,
  itemResponse,
  pageResponse,
  PE_USER_ID,
  reportItem,
} from '@/tests/fixtures/api/v2UserMocks';
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
      value: 2500,
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
});

const DATED_PROVISION = {
  path: 'gov.irs.credits.ctc.amount.base[0].amount',
  breadcrumb: 'IRS → Credits → CTC → Amount',
  unit: 'currency-USD',
  baselineValue: 2200,
  value: 2500,
  intervals: [
    { startDate: '2026-01-01', endDate: '2026-12-31', value: 2500 },
    { startDate: '2027-01-01', endDate: '2100-12-31', value: 3000 },
  ],
};

const DATED_PROVISION_WIRE = {
  path: 'gov.irs.credits.ctc.amount.base[0].amount',
  breadcrumb: 'IRS → Credits → CTC → Amount',
  unit: 'currency-USD',
  baseline_value: 2200,
  value: 2500,
  intervals: [
    { start_date: '2026-01-01', end_date: '2026-12-31', value: 2500 },
    { start_date: '2027-01-01', end_date: '2100-12-31', value: 3000 },
  ],
};

describe('provisions wire mapping', () => {
  test('given dated provisions then they map to snake_case with start_date and end_date', () => {
    expect(provisionsToWire([DATED_PROVISION])).toEqual([DATED_PROVISION_WIRE]);
  });

  test('given a single-value provision then intervals are null on the wire', () => {
    expect(provisionsToWire(newReport.provisions)[0].intervals).toBeNull();
  });

  test('given wire provisions then they map back to camelCase', () => {
    expect(provisionsFromWire([DATED_PROVISION_WIRE])).toEqual([DATED_PROVISION]);
    expect(provisionsFromWire(null)).toEqual([]);
  });
});

describe('ApiFlagshipReportStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('given a run then one /v2/user-reports row carries the v3 fields', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(
      itemResponse(
        reportItem({
          legacy_report_id: Number(API_REPORT_ID),
          name: 'CTC to $2,500',
          source_note: 'Hand-built draft',
          provisions: provisionsToWire(newReport.provisions),
          user_policy_id: ASSOCIATION_IDS.REFORM,
        }),
        201
      )
    );
    const store = new ApiFlagshipReportStore(context);

    // When
    const record = await store.create({ ...newReport, reformId: ASSOCIATION_IDS.REFORM });

    // Then
    const call = fetchCall(fetchMock);
    expect(call.path).toBe('/v2/user-reports');
    expect(call.body).toEqual({
      country_id: 'us',
      legacy_report_id: Number(API_REPORT_ID),
      name: 'CTC to $2,500',
      source_note: 'Hand-built draft',
      provisions: provisionsToWire(newReport.provisions),
      user_policy_id: ASSOCIATION_IDS.REFORM,
      last_run_at: expect.any(String),
    });
    expect(call.body).not.toHaveProperty('user_id');
    expect(call.body).not.toHaveProperty('year');
    expect(record).toMatchObject({
      id: ASSOCIATION_IDS.REPORT,
      userId: PE_USER_ID,
      apiReportId: API_REPORT_ID,
      title: 'CTC to $2,500',
      sourceNote: 'Hand-built draft',
      reformId: ASSOCIATION_IDS.REFORM,
      provisions: newReport.provisions,
    });
  });

  test('given a local reform id then the link uses its imported account id, or is left out', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(async () => itemResponse(reportItem(), 201));
    recordImportedIds(PE_USER_ID, { 'rf-imported': ASSOCIATION_IDS.REFORM });
    const store = new ApiFlagshipReportStore(context);

    // When
    await store.create({ ...newReport, reformId: 'rf-imported' });
    await store.create({ ...newReport, reformId: 'rf-never-imported' });

    // Then
    expect(fetchCall(fetchMock, 0).body.user_policy_id).toBe(ASSOCIATION_IDS.REFORM);
    expect(fetchCall(fetchMock, 1).body).not.toHaveProperty('user_policy_id');
  });

  test('given an API report id then findByApiReportId filters by legacy_report_id', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(
      pageResponse([reportItem({ legacy_report_id: Number(API_REPORT_ID) })])
    );
    const store = new ApiFlagshipReportStore(context);

    // When
    const record = await store.findByApiReportId(PE_USER_ID, API_REPORT_ID);

    // Then
    expect(fetchCall(fetchMock).query).toEqual({
      country_id: 'us',
      legacy_report_id: API_REPORT_ID,
      limit: '1',
    });
    expect(record?.apiReportId).toBe(API_REPORT_ID);
  });

  test('given a snapshot then saveValidation patches the validation wire format', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const wire = validationToWire(mockReportValidationSnapshot);
    fetchMock.mockResolvedValue(itemResponse(reportItem({ validation: wire })));
    const store = new ApiFlagshipReportStore(context);

    // When
    const record = await store.saveValidation(ASSOCIATION_IDS.REPORT, mockReportValidationSnapshot);

    // Then
    const call = fetchCall(fetchMock);
    expect(call.method).toBe('PATCH');
    expect(call.path).toBe(`/v2/user-reports/${ASSOCIATION_IDS.REPORT}`);
    expect(call.body).toEqual({ validation: wire });
    expect(record.validation).toEqual(mockReportValidationSnapshot);
  });
});

describe('ApiFlagshipReportStore with records kept only in this browser', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('given an lfr- record never imported then it is read from this browser', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const local = new LocalStorageFlagshipReportStore();
    const localRecord = await local.create(newReport);
    const store = new ApiFlagshipReportStore(context, local);

    // When
    const found = await store.findById(localRecord.id);

    // Then
    expect(found?.title).toBe(newReport.title);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given an lfr- record never imported then pinning validation saves it to the account', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const local = new LocalStorageFlagshipReportStore();
    const localRecord = await local.create(newReport);
    const wire = validationToWire(mockReportValidationSnapshot);
    fetchMock.mockResolvedValue(
      itemResponse(reportItem({ legacy_report_id: Number(API_REPORT_ID), validation: wire }), 201)
    );
    const store = new ApiFlagshipReportStore(context, local);

    // When
    await store.saveValidation(localRecord.id, mockReportValidationSnapshot);

    // Then
    const call = fetchCall(fetchMock);
    expect(call.method).toBe('POST');
    expect(call.body).toMatchObject({
      legacy_report_id: Number(API_REPORT_ID),
      validation: wire,
      client_ref: localRecord.id,
    });
    expect(resolveImportedId(PE_USER_ID, localRecord.id)).toBe(ASSOCIATION_IDS.REPORT);
  });
});

describe('getFlagshipReportStore', () => {
  test('given no account then records stay in localStorage', () => {
    expect(getFlagshipReportStore(null)).toBeInstanceOf(LocalStorageFlagshipReportStore);
  });

  test('given an account then records go to the account', () => {
    expect(getFlagshipReportStore(createTestApiContext().context)).toBeInstanceOf(
      ApiFlagshipReportStore
    );
  });
});
