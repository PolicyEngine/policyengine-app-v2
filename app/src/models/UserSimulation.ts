import type { CountryId } from "@/libs/countries";

interface UserSimulationData {
  id: string;
  userId: string;
  simulationId: string;
  countryId: CountryId;
  createdAt: string;
  label: string | null;
}

export class UserSimulation {
  readonly id: string;
  readonly userId: string;
  readonly simulationId: string;
  readonly countryId: CountryId;
  readonly createdAt: string;

  private _label: string | null;

  constructor(data: UserSimulationData) {
    this.id = data.id;
    this.userId = data.userId;
    this.simulationId = data.simulationId;
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

  toJSON(): UserSimulationData {
    return {
      id: this.id,
      userId: this.userId,
      simulationId: this.simulationId,
      countryId: this.countryId,
      createdAt: this.createdAt,
      label: this._label,
    };
  }

  isEqual(other: UserSimulation): boolean {
    return this.id === other.id;
  }
}
