/**
 * UserSimulation type containing mutable user-specific data
 */
export interface UserSimulation {
  id?: number;
  userId: number;
  simulationId: number;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}
