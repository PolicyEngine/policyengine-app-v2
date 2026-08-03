import { countryIds } from '@/libs/countries';
import { ReformBaseline, ReformConfidence, ReformSource } from '@/types/ingredients/Reform';

/**
 * Wire format for reform parameters.
 * Uses snake_case to match API conventions.
 */
export interface ReformParameterMetadata {
  name: string;
  values: {
    start_date: string;
    end_date: string;
    value: any;
  }[];
}

export interface ReformProvenanceMetadata {
  source: ReformSource;
  ref?: string | null;
  confidence?: ReformConfidence | null;
}

/**
 * API response format for reforms
 * Uses snake_case to match API conventions
 */
export interface ReformMetadata {
  id: string;
  user_id: string;
  country_id: (typeof countryIds)[number];
  label?: string | null;
  policy_id?: string | null;
  parameters: ReformParameterMetadata[];
  baseline: ReformBaseline;
  provenance: ReformProvenanceMetadata;
  created_at?: string;
  updated_at?: string;
}

/**
 * API creation payload format for reforms
 * Uses snake_case to match API conventions
 */
export type ReformCreationMetadata = Omit<ReformMetadata, 'id' | 'created_at' | 'updated_at'>;

/**
 * API update payload format for reforms; all content fields optional
 */
export type ReformUpdateMetadata = Partial<
  Omit<ReformMetadata, 'id' | 'user_id' | 'country_id' | 'created_at' | 'updated_at'>
>;
