import { UserSimulation } from '@/types/ingredients/UserSimulation';

/**
 * Adapter for converting between UserSimulation and API formats
 */
export class UserSimulationAdapter {
  /**
   * Converts API response to UserSimulation type
   * The API typically returns string IDs which we convert to numbers
   */
  static fromApi(apiData: {
    userId: string;
    simulationId: string;
    label?: string;
    createdAt: string;
    updatedAt?: string;
    isCreated?: boolean;
  }): UserSimulation {
    return {
      id: parseInt(apiData.simulationId),
      userId: parseInt(apiData.userId),
      simulationId: parseInt(apiData.simulationId),
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: apiData.isCreated ?? true,
    };
  }
  
  /**
   * Converts UserSimulation to format for API requests
   */
  static toApi(userSimulation: UserSimulation): {
    userId: string;
    simulationId: string;
    label?: string;
    updatedAt?: string;
  } {
    return {
      userId: userSimulation.userId.toString(),
      simulationId: userSimulation.simulationId.toString(),
      label: userSimulation.label,
      updatedAt: userSimulation.updatedAt || new Date().toISOString(),
    };
  }
}