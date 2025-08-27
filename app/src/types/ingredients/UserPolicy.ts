/**
 * UserPolicy type containing mutable user-specific data
 */
export interface UserPolicy {
  id?: string;
  userId: string;
  policyId: string;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}
