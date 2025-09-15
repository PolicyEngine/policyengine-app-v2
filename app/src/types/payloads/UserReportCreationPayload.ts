/**
 * Payload format for creating a user-report association via the API
 */
export interface UserReportCreationPayload {
  userId: string;
  reportId: string;
  label?: string;
  updatedAt?: string;
}