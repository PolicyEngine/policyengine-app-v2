import type { CountryId } from '@/libs/countries';
import { BaseModel } from './BaseModel';

interface PolicyParameter {
  parameterName: string;
  parameterId?: string;
  value: number | string | boolean | Record<string, unknown>;
  startDate: string;
  endDate: string | null;
}

interface PolicyData {
  id: string;
  countryId: CountryId;
  label: string | null;
  apiVersion: string;
  isCreated: boolean;
  parameters: PolicyParameter[];
}

export class Policy extends BaseModel<PolicyData> {
  readonly id: string;
  readonly countryId: CountryId;
  readonly apiVersion: string;
  readonly isCreated: boolean;

  private _label: string | null;
  private _parameters: PolicyParameter[];

  constructor(data: PolicyData) {
    super();
    if (!data.id) {
      throw new Error('Policy requires an id');
    }
    this.id = data.id;
    this.countryId = data.countryId;
    this.apiVersion = data.apiVersion;
    this.isCreated = data.isCreated;
    this._label = data.label;
    this._parameters = data.parameters.map((p) => ({ ...p }));
  }

  // --- Getters ---

  get label(): string | null {
    return this._label;
  }
  get parameters(): readonly PolicyParameter[] {
    return this._parameters;
  }
  get parameterCount(): number {
    return this._parameters.length;
  }
  get isCurrentLaw(): boolean {
    return this._parameters.length === 0;
  }
  get isReform(): boolean {
    return this._parameters.length > 0;
  }

  /** Unique parameter names in this policy */
  get parameterNames(): string[] {
    return [...new Set(this._parameters.map((p) => p.parameterName))];
  }

  // --- Setters ---

  set label(value: string | null) {
    this._label = value;
  }

  // --- Serialization ---

  toJSON(): PolicyData {
    return {
      id: this.id,
      countryId: this.countryId,
      label: this._label,
      apiVersion: this.apiVersion,
      isCreated: this.isCreated,
      parameters: this._parameters.map((p) => ({ ...p })),
    };
  }

  isEqual(other: Policy): boolean {
    return (
      this.id === other.id &&
      this._label === other._label &&
      JSON.stringify(this._parameters) === JSON.stringify(other._parameters)
    );
  }
}
