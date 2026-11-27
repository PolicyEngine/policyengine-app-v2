/**
 * Type definitions for the congressional district data context
 */

import type { DistrictLabelLookup } from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import type { CongressionalDistrictScope } from './utils';

/**
 * What the provider gives a report's congressional district views
 */
export interface CongressionalDistrictDataContextValue {
  /** Reform policy ID, for a nationwide report's state runs */
  reformPolicyId: string;
  /** Baseline policy ID, for a nationwide report's state runs */
  baselinePolicyId: string;
  /** The report's year */
  year: string;
  /** Label lookup for district display names */
  labelLookup: DistrictLabelLookup;
  /** The state code of a state report (e.g., 'ca', 'dc'), null for national */
  stateCode: string | null;
  /** The report's districts: every state's, one state's, or none (a district or place report). */
  scope: CongressionalDistrictScope | null;
}

/**
 * Props for the CongressionalDistrictDataProvider
 */
export interface CongressionalDistrictDataProviderProps {
  children: React.ReactNode;
  reformPolicyId: string;
  baselinePolicyId: string;
  year: string;
  /** The report's region: 'us' (or none) for nationwide, 'state/ca' for a state, or another region. */
  region?: string;
}
