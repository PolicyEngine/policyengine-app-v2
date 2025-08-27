/**
 * Payload format for creating a user-policy association via the API
 */
export interface UserPolicyCreationPayload {
  userId: string;
  policyId: string;
  label?: string;
  updatedAt?: string;
}