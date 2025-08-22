/**
 * UserPolicy type containing mutable user-specific data
 */
export interface UserPolicy {
  id?: number;
  userId: number;
  policyId: number;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}
