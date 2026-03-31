import type { CountryId } from '@/libs/countries';
import { BaseModel } from './BaseModel';

type ReportStatus = 'pending' | 'running' | 'complete' | 'error';
type ReportOutputType = 'household' | 'economy';

interface ReportData {
  id: string;
  countryId: CountryId;
  year: string;
  simulationIds: string[];
  status: ReportStatus;
  outputType: ReportOutputType;
  label?: string | null;
  output?: unknown | null;
}

export class Report extends BaseModel<ReportData> {
  readonly id: string;
  readonly countryId: CountryId;
  readonly year: string;
  readonly outputType: ReportOutputType;

  private _simulationIds: string[];
  private _status: ReportStatus;
  private _label: string | null;
  private _output: unknown | null;

  constructor(data: ReportData) {
    super();
    if (!data.id) {
      throw new Error('Report requires an id');
    }
    if (!data.simulationIds?.length) {
      throw new Error('Report requires at least one simulationId');
    }

    this.id = data.id;
    this.countryId = data.countryId;
    this.year = data.year;
    this.outputType = data.outputType;
    this._simulationIds = [...data.simulationIds];
    this._status = data.status;
    this._label = data.label ?? null;
    this._output = data.output ?? null;
  }

  // --- Getters ---

  get simulationIds(): readonly string[] {
    return this._simulationIds;
  }
  get status(): ReportStatus {
    return this._status;
  }
  get label(): string | null {
    return this._label;
  }
  get output(): unknown | null {
    return this._output;
  }

  get isHouseholdReport(): boolean {
    return this.outputType === 'household';
  }
  get isEconomyReport(): boolean {
    return this.outputType === 'economy';
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
  get baselineSimulationId(): string {
    return this._simulationIds[0];
  }
  get reformSimulationId(): string | null {
    return this._simulationIds[1] ?? null;
  }
  get hasReform(): boolean {
    return this._simulationIds.length > 1;
  }

  // --- Setters ---

  set label(value: string | null) {
    this._label = value;
  }

  // --- Serialization ---

  toJSON(): ReportData {
    return {
      id: this.id,
      countryId: this.countryId,
      year: this.year,
      simulationIds: [...this._simulationIds],
      status: this._status,
      outputType: this.outputType,
      label: this._label,
      output: this._output,
    };
  }

  isEqual(other: Report): boolean {
    return this.id === other.id && this._status === other._status;
  }
}
