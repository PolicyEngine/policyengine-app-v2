import { UserSimulation } from '@/types/ingredients/UserSimulation';
import { UserSimulationCreationPayload } from '@/types/payloads';

/**
 * Adapter for converting between UserSimulation and API formats
 */
export class UserSimulationAdapter {
  /**
   * Convert UserSimulation to API creation payload
   */
  static toCreationPayload(
    userSimulation: Omit<UserSimulation, 'id' | 'createdAt'>
  ): UserSimulationCreationPayload {
    return {
      userId: userSimulation.userId.toString(),
      simulationId: userSimulation.simulationId.toString(),
      label: userSimulation.label,
      updatedAt: userSimulation.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Convert API response to UserSimulation
   */
  static fromApiResponse(apiData: any): UserSimulation {
    return {
      id: apiData.id,
      userId: apiData.userId,
      simulationId: apiData.simulationId,
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: true,
    };
  }
}
