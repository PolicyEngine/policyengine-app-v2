import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  ApiFlagshipReportStore,
  getFlagshipReportStore,
  LocalStorageFlagshipReportStore,
  resetFlagshipReportStoreAvailability,
} from '@/api/flagshipReportStore';
import {
  EDIT_TOKEN_HEADER,
  findOwnedReportByApiReportId,
  ItemNotOwnedError,
} from '@/libs/flagship/ownedItems';
import { validationToWire } from '@/libs/flagship/reportValidation';
import {
  HTTP_STATUS,
  LEGACY_REPORTS_KEY,
  legacyLocalReform,
  legacyLocalReport,
  mockErrorResponse,
  mockJsonResponse,
  mockNewReport,
  mockReportRow,
} from '@/tests/fixtures/api/flagshipStoreMocks';
import {
  API_REPORT_ID,
  CENTRAL_REFORM_ID,
  CENTRAL_REPORT_ID,
  EDIT_TOKEN,
  OTHER_API_REPORT_ID,
  OWNED_REPORTS_KEY,
  ownedReport,
  seedOwnedItems,
} from '@/tests/fixtures/libs/flagship/ownedItemsMocks';
import { mockReportValidationSnapshot } from '@/tests/fixtures/libs/flagship/reportValidationMocks';

const fetchMock = vi.fn();

describe('LocalStorageFlagshipReportStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('given a created report then it is found by its API report id', async () => {
    const store = new LocalStorageFlagshipReportStore();
    const created = await store.create(mockNewReport);

    await expect(store.findByApiReportId(API_REPORT_ID)).resolves.toEqual(created);
    await expect(store.findByApiReportId(OTHER_API_REPORT_ID)).resolves.toBeNull();
  });

  test('given a record saved under the old shared user id then it is listed as mine', async () => {
    localStorage.setItem(LEGACY_REPORTS_KEY, JSON.stringify([legacyLocalReport]));

    const mine = await new LocalStorageFlagshipReportStore().findMine('us');

    expect(mine.map((record) => record.id)).toEqual([legacyLocalReport.id]);
  });

  test('given a saved validation then it persists on the record', async () => {
    const store = new LocalStorageFlagshipReportStore();
    const created = await store.create(mockNewReport);

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

describe('ApiFlagshipReportStore', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given a new report then it is POSTed without a user id and indexed with its edit token', async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({ ...mockReportRow, edit_token: EDIT_TOKEN }, HTTP_STATUS.CREATED)
    );

    const record = await new ApiFlagshipReportStore().create(mockNewReport);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('user_id');
    expect(record.id).toBe(CENTRAL_REPORT_ID);
    expect(findOwnedReportByApiReportId(API_REPORT_ID)).toMatchObject({
      id: CENTRAL_REPORT_ID,
      editToken: EDIT_TOKEN,
    });
  });

  test('given a report from a reform still in the localStorage fallback then no reform_id is sent', async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({ ...mockReportRow, edit_token: EDIT_TOKEN }, HTTP_STATUS.CREATED)
    );

    await new ApiFlagshipReportStore().create({ ...mockNewReport, reformId: legacyLocalReform.id });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).reform_id).toBeNull();
  });

  test('given a report from a central reform then its reform_id is sent', async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({ ...mockReportRow, edit_token: EDIT_TOKEN }, HTTP_STATUS.CREATED)
    );

    await new ApiFlagshipReportStore().create({ ...mockNewReport, reformId: CENTRAL_REFORM_ID });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).reform_id).toBe(CENTRAL_REFORM_ID);
  });

  test('given an indexed API report then its record is read by id, never searched by API report id', async () => {
    seedOwnedItems(OWNED_REPORTS_KEY, [ownedReport]);
    fetchMock.mockResolvedValue(
      mockJsonResponse({
        ...mockReportRow,
        validation: validationToWire(mockReportValidationSnapshot),
      })
    );

    const record = await new ApiFlagshipReportStore().findByApiReportId(API_REPORT_ID);

    expect(fetchMock).toHaveBeenCalledWith(`/api/reports/${CENTRAL_REPORT_ID}`);
    expect(record?.validation).toEqual(mockReportValidationSnapshot);
  });

  test('given an API report this browser did not run then no record is looked up', async () => {
    const record = await new ApiFlagshipReportStore().findByApiReportId(OTHER_API_REPORT_ID);

    expect(record).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given indexed records then finding mine reads them by id', async () => {
    seedOwnedItems(OWNED_REPORTS_KEY, [ownedReport]);
    fetchMock.mockResolvedValue(mockJsonResponse([mockReportRow]));

    const records = await new ApiFlagshipReportStore().findMine('us');

    expect(fetchMock).toHaveBeenCalledWith(`/api/reports?ids=${CENTRAL_REPORT_ID}`);
    expect(records.map((record) => record.id)).toEqual([CENTRAL_REPORT_ID]);
  });

  test('given an owned record then the snapshot is PATCHed in wire form with its edit token', async () => {
    seedOwnedItems(OWNED_REPORTS_KEY, [ownedReport]);
    fetchMock.mockResolvedValue(mockJsonResponse(mockReportRow));

    await new ApiFlagshipReportStore().saveValidation(
      CENTRAL_REPORT_ID,
      mockReportValidationSnapshot
    );

    expect(fetchMock).toHaveBeenCalledWith(`/api/reports/${CENTRAL_REPORT_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', [EDIT_TOKEN_HEADER]: EDIT_TOKEN },
      body: JSON.stringify({ validation: validationToWire(mockReportValidationSnapshot) }),
    });
  });

  test('given a record this browser did not create then pinning throws without a request', async () => {
    await expect(
      new ApiFlagshipReportStore().saveValidation(CENTRAL_REPORT_ID, mockReportValidationSnapshot)
    ).rejects.toThrow(ItemNotOwnedError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('getFlagshipReportStore', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    localStorage.clear();
    resetFlagshipReportStoreAvailability();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given the central store is unconfigured then a new record is saved locally', async () => {
    fetchMock.mockResolvedValue(mockErrorResponse(HTTP_STATUS.SERVICE_UNAVAILABLE));

    const record = await getFlagshipReportStore().create(mockNewReport);

    expect(record.id).toMatch(/^lfr-/);
    expect(findOwnedReportByApiReportId(API_REPORT_ID)).toBeNull();
  });

  test('given a pre-existing local record then it is found and pinned locally without a request', async () => {
    localStorage.setItem(LEGACY_REPORTS_KEY, JSON.stringify([legacyLocalReport]));
    const store = getFlagshipReportStore();

    const record = await store.findByApiReportId(legacyLocalReport.apiReportId);
    const pinned = await store.saveValidation(record!.id, mockReportValidationSnapshot);

    expect(pinned.validation).toEqual(mockReportValidationSnapshot);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given central and pre-existing local records then both are listed, newest first', async () => {
    seedOwnedItems(OWNED_REPORTS_KEY, [ownedReport]);
    localStorage.setItem(LEGACY_REPORTS_KEY, JSON.stringify([legacyLocalReport]));
    fetchMock.mockResolvedValue(mockJsonResponse([mockReportRow]));

    const records = await getFlagshipReportStore().findMine('us');

    expect(records.map((record) => record.id)).toEqual([CENTRAL_REPORT_ID, legacyLocalReport.id]);
  });
});
