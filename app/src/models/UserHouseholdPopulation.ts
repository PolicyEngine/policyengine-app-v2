import type { CountryId } from "@/libs/countries";

interface UserHouseholdPopulationData {
  id: string;
  userId: string;
  householdId: string;
  countryId: CountryId;
  createdAt: string;
  label: string | null;
}

export class UserHouseholdPopulation {
  readonly id: string;
  readonly userId: string;
  readonly householdId: string;
  readonly countryId: CountryId;
  readonly createdAt: string;

  private _label: string | null;

  constructor(data: UserHouseholdPopulationData) {
    this.id = data.id;
    this.userId = data.userId;
    this.householdId = data.householdId;
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

  toJSON(): UserHouseholdPopulationData {
    return {
      id: this.id,
      userId: this.userId,
      householdId: this.householdId,
      countryId: this.countryId,
      createdAt: this.createdAt,
      label: this._label,
    };
  }

  isEqual(other: UserHouseholdPopulation): boolean {
    return this.id === other.id;
  }
}
