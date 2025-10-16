import { UserReport } from '@/types/ingredients/UserReport';
import { UserReportCreationPayload } from '@/types/payloads';

/**
 * Adapter for converting between UserReport and API formats
 */
export class UserReportAdapter {
  /**
   * Convert UserReport to API creation payload
   */
  static toCreationPayload(
    userReport: Omit<UserReport, 'id' | 'createdAt'>
  ): UserReportCreationPayload {
    return {
      userId: String(userReport.userId),
      reportId: String(userReport.reportId),
      countryId: userReport.countryId,
      label: userReport.label,
      updatedAt: userReport.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Convert API response to UserReport
   */
  static fromApiResponse(apiData: any): UserReport {
    return {
      id: apiData.id,
      userId: apiData.userId,
      reportId: apiData.reportId,
      countryId: apiData.countryId,
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: true,
    };
  }
}
