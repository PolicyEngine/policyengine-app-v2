import type { CountryId } from "@/libs/countries";
import type { HouseholdV2Response } from "@/api/v2/households";
import { BaseModel } from "./BaseModel";

interface HouseholdData {
  id: string;
  countryId: CountryId;
  label: string | null;
  data: Record<string, unknown>;
}

export class Household extends BaseModel<HouseholdData> {
  readonly id: string;
  readonly countryId: CountryId;

  private _label: string | null;
  private _data: Record<string, unknown>;

  constructor(data: HouseholdData) {
    super();
    this.id = data.id;
    this.countryId = data.countryId;
    this._label = data.label;
    this._data = data.data;
  }

  // --- Getters ---

  get label(): string | null {
    return this._label;
  }
  get data(): Record<string, unknown> {
    return this._data;
  }

  get people(): Record<string, unknown> {
    return (this._data.people as Record<string, unknown>) ?? {};
  }

  get personCount(): number {
    return Object.keys(this.people).length;
  }

  get personNames(): string[] {
    return Object.keys(this.people);
  }

  // --- Setters ---

  set label(value: string | null) {
    this._label = value;
  }

  // --- Factories ---

  static fromV2Response(response: HouseholdV2Response): Household {
    return new Household({
      id: response.id,
      countryId: response.country_id as CountryId,
      label: response.label ?? null,
      data: {
        people: response.people,
        tax_unit: response.tax_unit,
        family: response.family,
        spm_unit: response.spm_unit,
        marital_unit: response.marital_unit,
        household: response.household,
        benunit: response.benunit,
      },
    });
  }

  // --- Serialization ---

  toJSON(): HouseholdData {
    return {
      id: this.id,
      countryId: this.countryId,
      label: this._label,
      data: this._data,
    };
  }

  isEqual(other: Household): boolean {
    return this.id === other.id;
  }
}
