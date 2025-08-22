/**
 * UserReport type containing mutable user-specific data
 */
export interface UserReport {
  id?: number;
  userId: number;
  reportId: number;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}