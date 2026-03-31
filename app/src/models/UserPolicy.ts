import type { CountryId } from '@/libs/countries';

interface UserPolicyData {
  id: string;
  userId: string;
  policyId: string;
  countryId: CountryId;
  createdAt: string;
  label: string | null;
}

export class UserPolicy {
  readonly id: string;
  readonly userId: string;
  readonly policyId: string;
  readonly countryId: CountryId;
  readonly createdAt: string;

  private _label: string | null;

  constructor(data: UserPolicyData) {
    this.id = data.id;
    this.userId = data.userId;
    this.policyId = data.policyId;
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

  toJSON(): UserPolicyData {
    return {
      id: this.id,
      userId: this.userId,
      policyId: this.policyId,
      countryId: this.countryId,
      createdAt: this.createdAt,
      label: this._label,
    };
  }

  isEqual(other: UserPolicy): boolean {
    return this.id === other.id;
  }
}
