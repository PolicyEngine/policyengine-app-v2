import type { CountryId } from "@/libs/countries";

interface UserReportData {
  id: string;
  userId: string;
  reportId: string;
  countryId: CountryId;
  createdAt: string;
  label: string | null;
}

export class UserReport {
  readonly id: string;
  readonly userId: string;
  readonly reportId: string;
  readonly countryId: CountryId;
  readonly createdAt: string;

  private _label: string | null;

  constructor(data: UserReportData) {
    this.id = data.id;
    this.userId = data.userId;
    this.reportId = data.reportId;
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

  toJSON(): UserReportData {
    return {
      id: this.id,
      userId: this.userId,
      reportId: this.reportId,
      countryId: this.countryId,
      createdAt: this.createdAt,
      label: this._label,
    };
  }

  isEqual(other: UserReport): boolean {
    return this.id === other.id;
  }
}
