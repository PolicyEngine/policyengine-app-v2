/**
 * UserReport type containing mutable user-specific data
 */
export interface UserReport {
  id?: string;
  userId: string;
  reportId: string;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}
