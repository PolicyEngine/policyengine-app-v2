import { countryIds } from '@/libs/countries';

/**
 * UserReport type containing mutable user-specific data
 */
export interface UserReport {
  id: string;
  userId: string;
  reportId: string;
  countryId: (typeof countryIds)[number];
  outputType?: 'household' | 'economy';
  simulationIds?: string[];
  year?: string;
  label?: string;
  lastRunAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}
