import { UserAssociation, type UserAssociationFields } from './UserAssociation';

interface UserPolicyData extends UserAssociationFields {
  policyId: string;
}

export class UserPolicy extends UserAssociation<UserPolicyData> {
  constructor(data: UserPolicyData) {
    super({ ...data, entityId: data.policyId });
  }

  get policyId(): string {
    return this.entityId;
  }

  toJSON(): UserPolicyData {
    return {
      id: this.id,
      userId: this.userId,
      policyId: this.entityId,
      countryId: this.countryId,
      createdAt: this.createdAt,
      label: this.label,
    };
  }
}
