import { UserReport } from '@/types/ingredients/UserReport';

/**
 * Adapter for converting between UserReport and API formats
 * NOTE: This is a template implementation - modify as the UserReport structure evolves
 */
export class UserReportAdapter {
  /**
   * Converts UserReport association from API/storage to UserReport type
   * NOTE: This is a placeholder - actual implementation will depend on API structure
   */
  static fromAssociation(association: any): UserReport {
    return {
      id: association.id || parseInt(association.reportId),
      userId: parseInt(association.userId),
      reportId: parseInt(association.reportId),
      label: association.label,
      createdAt: association.createdAt,
      updatedAt: association.updatedAt,
      isCreated: true,
    };
  }
  
  /**
   * Converts UserReport to format for creating/updating association
   * NOTE: This is a placeholder - actual implementation will depend on API structure
   */
  static toAssociation(userReport: UserReport): any {
    return {
      userId: userReport.userId.toString(),
      reportId: userReport.reportId.toString(),
      label: userReport.label,
      updatedAt: new Date().toISOString(),
    };
  }
}