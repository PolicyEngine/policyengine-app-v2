import { countryIds } from '@/libs/countries';

/**
 * UserSimulation type containing mutable user-specific data
 */
export interface UserSimulation {
  id?: string;
  userId: string;
  simulationId: string;
  countryId: (typeof countryIds)[number];
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}
