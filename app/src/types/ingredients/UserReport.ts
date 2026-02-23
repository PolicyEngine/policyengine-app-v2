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
  lastRunAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}
