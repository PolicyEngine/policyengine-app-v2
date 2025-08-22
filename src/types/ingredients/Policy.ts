import { countryIds } from '@/libs/countries';

// Copied from existing policy.ts and related files
export interface Parameter {
  name: string;
  values: ValueInterval[];
}

export interface ValueInterval {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  value: any;
}

/**
 * Base Policy type containing only immutable values sent to the API
 */
export interface Policy {
  id: number;
  countryId: (typeof countryIds)[number];
  apiVersion: string;
  parameters: Parameter[];
}