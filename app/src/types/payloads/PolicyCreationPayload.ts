import { PolicyMetadataParams } from '@/types/metadata/policyMetadata';

/**
 * Payload format for creating a policy via the API
 */
export interface PolicyCreationPayload {
  label?: string;
  data: PolicyMetadataParams;
}
