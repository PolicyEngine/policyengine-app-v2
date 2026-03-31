import type { CountryId } from '@/libs/countries';
import { BaseModel } from './BaseModel';

type SimulationStatus = 'pending' | 'running' | 'complete' | 'error';
type PopulationType = 'household' | 'geography';

interface SimulationData {
  id: string;
  countryId: CountryId;
  policyId: string | null;
  populationId: string | null;
  populationType: PopulationType;
  status: SimulationStatus;
  label: string | null;
  isCreated: boolean;
  output?: unknown;
}

export class Simulation extends BaseModel<SimulationData> {
  readonly id: string;
  readonly countryId: CountryId;
  readonly populationType: PopulationType;
  readonly isCreated: boolean;

  private _policyId: string | null;
  private _populationId: string | null;
  private _status: SimulationStatus;
  private _label: string | null;
  private _output: unknown;

  constructor(data: SimulationData) {
    super();
    if (!data.id) {
      throw new Error('Simulation requires an id');
    }
    this.id = data.id;
    this.countryId = data.countryId;
    this.populationType = data.populationType;
    this.isCreated = data.isCreated;
    this._policyId = data.policyId;
    this._populationId = data.populationId;
    this._status = data.status;
    this._label = data.label;
    this._output = data.output ?? null;
  }

  // --- Getters ---

  get policyId(): string | null {
    return this._policyId;
  }
  get populationId(): string | null {
    return this._populationId;
  }
  get status(): SimulationStatus {
    return this._status;
  }
  get label(): string | null {
    return this._label;
  }
  get output(): unknown {
    return this._output;
  }

  get isBaseline(): boolean {
    return this._policyId === null;
  }
  get isReform(): boolean {
    return this._policyId !== null;
  }
  get isHousehold(): boolean {
    return this.populationType === 'household';
  }
  get isEconomy(): boolean {
    return this.populationType === 'geography';
  }
  get isComplete(): boolean {
    return this._status === 'complete';
  }
  get isPending(): boolean {
    return this._status === 'pending' || this._status === 'running';
  }
  get isError(): boolean {
    return this._status === 'error';
  }

  // --- Setters ---

  set label(value: string | null) {
    this._label = value;
  }

  set status(value: SimulationStatus) {
    const valid: Record<SimulationStatus, SimulationStatus[]> = {
      pending: ['running', 'complete', 'error'],
      running: ['complete', 'error'],
      complete: [],
      error: [],
    };
    if (!valid[this._status].includes(value)) {
      throw new Error(`Invalid status transition: ${this._status} → ${value}`);
    }
    this._status = value;
  }

  // --- Serialization ---

  toJSON(): SimulationData {
    return {
      id: this.id,
      countryId: this.countryId,
      policyId: this._policyId,
      populationId: this._populationId,
      populationType: this.populationType,
      status: this._status,
      label: this._label,
      isCreated: this.isCreated,
      output: this._output,
    };
  }

  isEqual(other: Simulation): boolean {
    return this.id === other.id && this._status === other._status;
  }
}
