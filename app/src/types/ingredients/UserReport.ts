import { countryIds } from '@/libs/countries';

/**
 * UserReport type containing mutable user-specific data
 */
export interface UserReport {
  id: string;
  userId: string;
  reportId: string;
  countryId: (typeof countryIds)[number];
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}
