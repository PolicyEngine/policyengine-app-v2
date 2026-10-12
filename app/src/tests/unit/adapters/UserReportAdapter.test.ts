import { describe, expect, test } from 'vitest';
import { UserReportAdapter } from '@/adapters/UserReportAdapter';
import {
  ASSOCIATION_IDS,
  LEGACY_IDS,
  PE_USER_ID,
  reportItem,
  TIMESTAMPS,
} from '@/tests/fixtures/api/v2UserMocks';

describe('UserReportAdapter', () => {
  test('given a report association then the creation payload carries legacy_report_id', () => {
    expect(
      UserReportAdapter.toCreationPayload(
        { reportId: String(LEGACY_IDS.REPORT), label: 'Saved report' },
        'us'
      )
    ).toEqual({ country_id: 'us', legacy_report_id: LEGACY_IDS.REPORT, name: 'Saved report' });
  });

  test('given a replaced base report then the patch repoints legacy_report_id', () => {
    expect(UserReportAdapter.toUpdatePayload({ reportId: '999' })).toEqual({
      legacy_report_id: 999,
    });
  });

  test('given a rename then the patch sets the name', () => {
    expect(UserReportAdapter.toUpdatePayload({ label: 'Renamed' })).toEqual({ name: 'Renamed' });
  });

  test('given an API item then it maps to a UserReport with the UUID as id', () => {
    expect(UserReportAdapter.fromApiItem(reportItem({ name: 'Saved report' }))).toEqual({
      id: ASSOCIATION_IDS.REPORT,
      userId: PE_USER_ID,
      reportId: String(LEGACY_IDS.REPORT),
      countryId: 'us',
      label: 'Saved report',
      createdAt: TIMESTAMPS.CREATED,
      updatedAt: TIMESTAMPS.UPDATED,
      isCreated: true,
    });
  });
});
