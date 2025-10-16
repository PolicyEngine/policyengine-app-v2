import { countryIds } from '@/libs/countries';

/**
 * Payload format for creating a user-simulation association via the API
 */
export interface UserSimulationCreationPayload {
  userId: string;
  simulationId: string;
  countryId: (typeof countryIds)[number];
  label?: string;
  updatedAt?: string;
}
