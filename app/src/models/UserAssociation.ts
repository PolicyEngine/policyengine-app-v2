import type { CountryId } from '@/libs/countries';
import { BaseModel } from './BaseModel';

/** Common fields shared by every user-association data shape. */
export interface UserAssociationFields {
  id: string;
  userId: string;
  countryId: CountryId;
  createdAt: string;
  label: string | null;
}

export class UserAssociation<
  TData extends UserAssociationFields = UserAssociationFields,
> extends BaseModel<TData> {
  readonly id: string;
  readonly userId: string;
  readonly entityId: string;
  readonly countryId: CountryId;
  readonly createdAt: string;

  private _label: string | null;

  constructor(data: UserAssociationFields & { entityId: string }) {
    super();
    if (!data.id) {
      throw new Error('UserAssociation requires an id');
    }
    this.id = data.id;
    this.userId = data.userId;
    this.entityId = data.entityId;
    this.countryId = data.countryId;
    this.createdAt = data.createdAt;
    this._label = data.label ?? null;
  }

  get label(): string | null {
    return this._label;
  }
  set label(value: string | null) {
    this._label = value;
  }

  toJSON(): TData {
    return {
      id: this.id,
      userId: this.userId,
      entityId: this.entityId,
      countryId: this.countryId,
      createdAt: this.createdAt,
      label: this._label,
    } as unknown as TData;
  }

  isEqual(other: UserAssociation<UserAssociationFields>): boolean {
    return this.id === other.id;
  }
}
