import { beforeEach, describe, expect, test } from 'vitest';
import {
  ApiFlagshipReportStore,
  LocalStorageFlagshipReportStore,
  provisionsToWire,
  type NewFlagshipReport,
} from '@/api/flagshipReportStore';
import { ReportSchemaError } from '@/libs/flagship/reportSchema';
import { validationToWire } from '@/libs/flagship/reportValidation';
import {
  ASSOCIATION_IDS,
  createTestApiContext,
  itemResponse,
  pageResponse,
  reportItem,
  TIMESTAMPS,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  API_REPORT_ID,
  CTC_PROVISION,
  CURRENT_SCHEMA_VERSION,
  currentRecord,
  GROWING_PROVISION,
  historicRecords,
  LOCAL_REPORT_ID,
  recordFromNewerVersion,
  recordWithoutUserId,
  REPORTS_KEY,
} from '@/tests/fixtures/libs/flagship/reportSchemaMocks';
import { mockReportValidationSnapshot } from '@/tests/fixtures/libs/flagship/reportValidationMocks';

const mockNewReport: NewFlagshipReport = {
  countryId: 'us',
  apiReportId: API_REPORT_ID,
  title: 'CTC to $2,500',
  sourceNote: 'Hand-built draft',
  provisions: [CTC_PROVISION],
  year: '2026',
  reformId: null,
};

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
  /** The account's row for the report, as /v2/user-reports serves it. */
  const accountRow = reportItem({
    legacy_report_id: Number(API_REPORT_ID),
    name: 'CTC to $2,500',
    source_note: 'Hand-built draft',
    provisions: provisionsToWire([CTC_PROVISION, GROWING_PROVISION]),
    user_policy_id: ASSOCIATION_IDS.REFORM,
    baseline_user_policy_id: ASSOCIATION_IDS.POLICY,
    validation: validationToWire(mockReportValidationSnapshot),
    budget_window_years: 10,
  });

  beforeEach(() => {
    localStorage.clear();
  });

  test('given an account row then it reads in the current shape, growth and links included', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(accountRow));

    // When
    const record = await new ApiFlagshipReportStore(context).findById(ASSOCIATION_IDS.REPORT);

    // Then
    expect(record).toEqual({
      id: ASSOCIATION_IDS.REPORT,
      countryId: 'us',
      apiReportId: API_REPORT_ID,
      title: 'CTC to $2,500',
      sourceNote: 'Hand-built draft',
      provisions: [CTC_PROVISION, GROWING_PROVISION],
      createdAt: TIMESTAMPS.CREATED,
      reformId: ASSOCIATION_IDS.REFORM,
      validation: mockReportValidationSnapshot,
      budgetWindowYears: 10,
      baselineReformId: ASSOCIATION_IDS.POLICY,
    });
  });

  test('given an unreadable row then the list leaves it out', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const unreadableRow = {
      ...accountRow,
      id: 'unreadable-row',
      provisions: [{ ...provisionsToWire([CTC_PROVISION])[0], path: '' }],
    };
    fetchMock.mockResolvedValue(pageResponse([accountRow, unreadableRow]));

    // When
    const mine = await new ApiFlagshipReportStore(context).findMine('us');

    // Then
    expect(mine.map((record) => record.id)).toEqual([ASSOCIATION_IDS.REPORT]);
  });

  test('given an unreadable row then reading it throws a ReportSchemaError', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(
      itemResponse({
        ...accountRow,
        provisions: [{ ...provisionsToWire([GROWING_PROVISION])[0], growth_round: 'sideways' }],
      })
    );

    // When / Then
    await expect(
      new ApiFlagshipReportStore(context).findById(ASSOCIATION_IDS.REPORT)
    ).rejects.toThrow(ReportSchemaError);
  });
});
