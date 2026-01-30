import { countryIds } from '@/libs/countries';

/**
 * API response format for user policy associations
 * Uses snake_case to match API conventions
 * Matches backend UserPolicyRead schema
 */
export interface UserPolicyMetadata {
  id: string;
  user_id: string;
  policy_id: string;
  country_id: (typeof countryIds)[number];
  label: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * API creation payload format for user policy associations
 * Uses snake_case to match API conventions
 * Matches backend UserPolicyCreate schema
 */
export interface UserPolicyCreationMetadata {
  user_id: string;
  policy_id: string;
  country_id: (typeof countryIds)[number];
  label?: string | null;
}

/**
 * API update payload format for user policy associations
 * Uses snake_case to match API conventions
 * Matches backend UserPolicyUpdate schema
 */
export interface UserPolicyUpdateMetadata {
  label?: string | null;
}
