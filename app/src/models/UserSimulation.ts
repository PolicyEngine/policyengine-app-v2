import { UserAssociation, type UserAssociationFields } from './UserAssociation';

interface UserSimulationData extends UserAssociationFields {
  simulationId: string;
}

export class UserSimulation extends UserAssociation<UserSimulationData> {
  constructor(data: UserSimulationData) {
    super({ ...data, entityId: data.simulationId });
  }

  get simulationId(): string {
    return this.entityId;
  }

  toJSON(): UserSimulationData {
    return {
      id: this.id,
      userId: this.userId,
      simulationId: this.entityId,
      countryId: this.countryId,
      createdAt: this.createdAt,
      label: this.label,
    };
  }
}
