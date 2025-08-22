/**
 * UserSimulation type containing mutable user-specific data
 */
export interface UserSimulation {
  id?: string;
  userId: string;
  simulationId: string;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}
