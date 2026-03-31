import type { HouseholdV2Response } from '@/api/v2/households';
import type { CountryId } from '@/libs/countries';
import { BaseModel } from './BaseModel';

interface HouseholdData {
  id: string;
  countryId: CountryId;
  label: string | null;
  year: number | null;
  data: Record<string, unknown>;
}

export class Household extends BaseModel<HouseholdData> {
  readonly id: string;
  readonly countryId: CountryId;
  readonly year: number | null;

  private _label: string | null;
  private _data: Record<string, unknown>;

  constructor(data: HouseholdData) {
    super();
    if (!data.id) {
      throw new Error('Household requires an id');
    }
    this.id = data.id;
    this.countryId = data.countryId;
    this.year = data.year;
    this._label = data.label;
    this._data = data.data;
  }

  // --- Getters ---

  get label(): string | null {
    return this._label;
  }
  get data(): Record<string, unknown> {
    return { ...this._data };
  }

  get people(): Record<string, unknown> {
    return (this._data.people as Record<string, unknown>) ?? {};
  }

  get personCount(): number {
    const p = this._data.people;
    if (Array.isArray(p)) {
      return p.length;
    }
    if (p && typeof p === 'object') {
      return Object.keys(p).length;
    }
    return 0;
  }

  get personNames(): string[] {
    const p = this._data.people;
    if (Array.isArray(p)) {
      return p.map((_, i) => String(i));
    }
    if (p && typeof p === 'object') {
      return Object.keys(p as Record<string, unknown>);
    }
    return [];
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
      year: response.year ?? null,
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
      year: this.year,
      data: { ...this._data },
    };
  }

  isEqual(other: Household): boolean {
    return (
      this.id === other.id &&
      this._label === other._label &&
      JSON.stringify(this._data) === JSON.stringify(other._data)
    );
  }
}
