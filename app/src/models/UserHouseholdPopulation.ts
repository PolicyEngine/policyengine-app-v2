import { UserAssociation, type UserAssociationFields } from './UserAssociation';

interface UserHouseholdPopulationData extends UserAssociationFields {
  householdId: string;
}

export class UserHouseholdPopulation extends UserAssociation<UserHouseholdPopulationData> {
  constructor(data: UserHouseholdPopulationData) {
    super({ ...data, entityId: data.householdId });
  }

  get householdId(): string {
    return this.entityId;
  }

  toJSON(): UserHouseholdPopulationData {
    return {
      id: this.id,
      userId: this.userId,
      householdId: this.entityId,
      countryId: this.countryId,
      createdAt: this.createdAt,
      label: this.label,
    };
  }
}
