import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiFlagshipReportStore, LocalStorageFlagshipReportStore } from '@/api/flagshipReportStore';
import { ReportSchemaError } from '@/libs/flagship/reportSchema';
import { mockJsonResponse, mockNewReport } from '@/tests/fixtures/api/flagshipStoreMocks';
import {
  CENTRAL_REPORT_ID,
  OWNED_REPORTS_KEY,
  ownedReport,
  seedOwnedItems,
} from '@/tests/fixtures/libs/flagship/ownedItemsMocks';
import {
  CURRENT_SCHEMA_VERSION,
  currentRecord,
  historicRecords,
  LOCAL_REPORT_ID,
  recordFromNewerVersion,
  recordWithoutUserId,
  REPORTS_KEY,
  rowWithoutUserId,
} from '@/tests/fixtures/libs/flagship/reportSchemaMocks';
import { mockReportValidationSnapshot } from '@/tests/fixtures/libs/flagship/reportValidationMocks';

const UNREADABLE_ID = 'lfr-unreadable';
const unreadableEntry = { ...recordWithoutUserId, id: UNREADABLE_ID, provisions: 'oops' };

function storedEntries(): any[] {
  return JSON.parse(localStorage.getItem(REPORTS_KEY) ?? '[]');
}

function seedEntries(entries: unknown[]): void {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(entries));
}

describe('LocalStorageFlagshipReportStore and the report schema', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('given a new report then the stored entry is stamped with the current version', async () => {
    await new LocalStorageFlagshipReportStore().create(mockNewReport);

    expect(storedEntries()[0].schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  test('given records in every earlier shape then each is listed in the current shape', async () => {
    seedEntries(
      historicRecords.map(([_name, stored], index) => ({
        ...(stored as object),
        id: `lfr-${index}`,
      }))
    );

    const mine = await new LocalStorageFlagshipReportStore().findMine('us');

    expect(mine).toEqual(
      historicRecords.map(([_name, _stored, expected], index) => ({
        ...expected,
        id: `lfr-${index}`,
      }))
    );
  });

  test('given an unreadable entry then the list leaves it out', async () => {
    seedEntries([unreadableEntry, recordWithoutUserId]);

    const mine = await new LocalStorageFlagshipReportStore().findMine();

    expect(mine).toEqual([currentRecord]);
  });

  test('given an unreadable entry then finding it throws a ReportSchemaError', async () => {
    seedEntries([unreadableEntry]);

    await expect(new LocalStorageFlagshipReportStore().findById(UNREADABLE_ID)).rejects.toThrow(
      ReportSchemaError
    );
  });

  test('given an unversioned record then pinning a validation writes it in the current shape', async () => {
    seedEntries([recordWithoutUserId]);

    await new LocalStorageFlagshipReportStore().saveValidation(
      LOCAL_REPORT_ID,
      mockReportValidationSnapshot
    );

    expect(storedEntries()[0]).toEqual({
      ...currentRecord,
      validation: mockReportValidationSnapshot,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
  });

  test('given entries this version can not read then writes keep them as stored', async () => {
    seedEntries([recordFromNewerVersion, unreadableEntry]);

    await new LocalStorageFlagshipReportStore().create(mockNewReport);

    expect(storedEntries().slice(1)).toEqual([recordFromNewerVersion, unreadableEntry]);
  });

  test('given a record a newer version saved then pinning it fails and leaves it as stored', async () => {
    seedEntries([recordFromNewerVersion]);

    await expect(
      new LocalStorageFlagshipReportStore().saveValidation(
        recordFromNewerVersion.id,
        mockReportValidationSnapshot
      )
    ).rejects.toThrow(ReportSchemaError);
    expect(storedEntries()).toEqual([recordFromNewerVersion]);
  });
});

describe('ApiFlagshipReportStore and the report schema', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    localStorage.clear();
    seedOwnedItems(OWNED_REPORTS_KEY, [ownedReport]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given a central row then it reads in the current shape', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse(rowWithoutUserId));

    const record = await new ApiFlagshipReportStore().findById(CENTRAL_REPORT_ID);

    expect(record).toEqual({ ...currentRecord, id: CENTRAL_REPORT_ID });
  });

  test('given an unreadable row then the list leaves it out', async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse([rowWithoutUserId, { ...rowWithoutUserId, country_id: 'fr' }])
    );

    const mine = await new ApiFlagshipReportStore().findMine();

    expect(mine.map((record) => record.id)).toEqual([CENTRAL_REPORT_ID]);
  });

  test('given an unreadable row then reading it throws a ReportSchemaError', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ ...rowWithoutUserId, provisions: 'oops' }));

    await expect(new ApiFlagshipReportStore().findById(CENTRAL_REPORT_ID)).rejects.toThrow(
      ReportSchemaError
    );
  });
});
