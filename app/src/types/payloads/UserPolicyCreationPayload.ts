import { countryIds } from '@/libs/countries';

/**
 * Payload format for creating a user-policy association via the API
 */
export interface UserPolicyCreationPayload {
  userId: string;
  policyId: string;
  countryId: (typeof countryIds)[number];
  label?: string;
  updatedAt?: string;
}
