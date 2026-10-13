import { countryIds } from '@/libs/countries';

/**
 * Payload format for creating a user-policy association via the API
 * Note: This endpoint doesn't exist yet. Currently uses the same format as UserPolicyMetadata.
 * In the future, we may create a separate type if the creation payload differs from the response format.
 */
export interface UserPolicyCreationPayload {
  user_id: string;
  policy_id: string;
  country_id: (typeof countryIds)[number];
  label?: string | null;
  created_at?: string;
  updated_at?: string;
}
