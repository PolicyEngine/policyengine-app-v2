import { CountryId } from '../common';

/**
 * Payload format for creating a user-policy association via the API
 */
export interface UserPolicyCreationPayload {
  userId: string;
  policyId: string;
  countryId: CountryId;
  label?: string;
  updatedAt?: string;
}
