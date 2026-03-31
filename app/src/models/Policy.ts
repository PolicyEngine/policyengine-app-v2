import type { CountryId } from "@/libs/countries";
import type { V2PolicyResponse } from "@/api/policy";
import { BaseModel } from "./BaseModel";

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
    this.id = data.id;
    this.countryId = data.countryId;
    this.apiVersion = data.apiVersion;
    this.isCreated = data.isCreated;
    this._label = data.label;
    this._parameters = [...data.parameters];
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

  // --- Factories ---

  /**
   * Create from v2 API response.
   */
  static fromV2Response(response: V2PolicyResponse): Policy {
    const parameters: PolicyParameter[] = (
      response.parameter_values ?? []
    ).map((pv) => ({
      parameterName: pv.parameter_name ?? pv.parameter_id,
      parameterId: pv.parameter_id,
      value: pv.value_json,
      startDate: pv.start_date,
      endDate: pv.end_date,
    }));

    return new Policy({
      id: response.id,
      countryId: response.tax_benefit_model_id as unknown as CountryId,
      label: response.name ?? null,
      apiVersion: "v2",
      isCreated: true,
      parameters,
    });
  }

  // --- Serialization ---

  toJSON(): PolicyData {
    return {
      id: this.id,
      countryId: this.countryId,
      label: this._label,
      apiVersion: this.apiVersion,
      isCreated: this.isCreated,
      parameters: [...this._parameters],
    };
  }

  isEqual(other: Policy): boolean {
    return (
      this.id === other.id &&
      this._label === other._label &&
      this._parameters.length === other._parameters.length
    );
  }
}
