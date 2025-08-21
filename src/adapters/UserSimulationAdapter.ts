import { UserSimulation } from '@/types/ingredients';
import { UserSimulationAssociation } from '@/types/userIngredientAssociations';

/**
 * Adapter for converting between UserSimulation and API formats
 */
export class UserSimulationAdapter {
  /**
   * Converts UserSimulationAssociation from API/storage to UserSimulation type
   */
  static fromAssociation(association: UserSimulationAssociation): UserSimulation {
    return {
      id: parseInt(association.simulationId),
      userId: parseInt(association.userId),
      simulationId: parseInt(association.simulationId),
      label: association.label,
      createdAt: association.createdAt,
      updatedAt: association.updatedAt,
      isCreated: true,
    };
  }
  
  /**
   * Converts UserSimulation to format for creating/updating association
   */
  static toAssociation(userSimulation: UserSimulation): Omit<UserSimulationAssociation, 'createdAt'> {
    return {
      userId: userSimulation.userId.toString(),
      simulationId: userSimulation.simulationId.toString(),
      label: userSimulation.label,
      updatedAt: new Date().toISOString(),
    };
  }
}