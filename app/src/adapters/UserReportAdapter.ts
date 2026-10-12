import { toLegacyId } from '@/api/v2Associations';
import { UserReport } from '@/types/ingredients/UserReport';
import type {
  AssociationCountryId,
  UserReportCreateBody,
  UserReportItem,
  UserReportPatchBody,
} from '@/types/v2User';

/**
 * Converts between UserReport and the `/v2/user-reports` wire format.
 * `reportId` is the requested v1 report ID (`legacy_report_id`). The v3
 * fields on the same rows are mapped by the flagship report store.
 */
export class UserReportAdapter {
  static toCreationPayload(
    userReport: Pick<UserReport, 'reportId' | 'label'>,
    countryId: AssociationCountryId
  ): UserReportCreateBody {
    return {
      country_id: countryId,
      legacy_report_id: toLegacyId(userReport.reportId, 'report'),
      ...(userReport.label ? { name: userReport.label } : {}),
    };
  }

  static toUpdatePayload(updates: Partial<UserReport>): UserReportPatchBody {
    const body: UserReportPatchBody = {};
    if ('label' in updates) {
      body.name = updates.label || null;
    }
    if (updates.reportId !== undefined) {
      body.legacy_report_id = toLegacyId(updates.reportId, 'report');
    }
    return body;
  }

  static hasLegacyReport(item: UserReportItem): boolean {
    return item.legacy_report_id !== null && item.legacy_report_id !== undefined;
  }

  static fromApiItem(item: UserReportItem): UserReport {
    return {
      id: item.id,
      userId: item.user_id,
      reportId: String(item.legacy_report_id),
      countryId: item.country_id,
      label: item.name ?? undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      isCreated: true,
    };
  }
}
