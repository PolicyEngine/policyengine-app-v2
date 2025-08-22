import { countryIds } from '@/libs/countries';

/**
 * Base Report type containing only immutable values sent to the API
 * NOTE: This is a template and open to modification in the future
 */
export interface Report {
  id: number;
  countryId: (typeof countryIds)[number];
  apiVersion: string;
  simulationId: number;
  reportData: ReportData;
  reportHash: string;
}

export interface ReportData {
  [key: string]: any; // TODO: Define specific report data structure when available
}