import { countryIds } from '@/libs/countries';

/**
 * UserPolicy type containing mutable user-specific data
 */
export interface UserPolicy {
  id?: string;
  userId: string;
  policyId: string;
  countryId: (typeof countryIds)[number];
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}
