import { UserAssociation, type UserAssociationFields } from './UserAssociation';

interface UserReportData extends UserAssociationFields {
  reportId: string;
}

export class UserReport extends UserAssociation<UserReportData> {
  constructor(data: UserReportData) {
    super({ ...data, entityId: data.reportId });
  }

  get reportId(): string {
    return this.entityId;
  }

  toJSON(): UserReportData {
    return {
      id: this.id,
      userId: this.userId,
      reportId: this.entityId,
      countryId: this.countryId,
      createdAt: this.createdAt,
      label: this.label,
    };
  }
}
