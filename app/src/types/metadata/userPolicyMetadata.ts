import { countryIds } from '@/libs/countries';

/**
 * API response format for user policy associations
 * Uses snake_case to match API conventions
 */
export interface UserPolicyMetadata {
  user_id: string;
  policy_id: string;
  country_id: (typeof countryIds)[number];
  label?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * API creation payload format for user policy associations
 * Uses snake_case to match API conventions
 */
export interface UserPolicyCreationMetadata {
  user_id: string;
  policy_id: string;
  country_id: (typeof countryIds)[number];
  label?: string | null;
  created_at?: string;
  updated_at?: string;
}
