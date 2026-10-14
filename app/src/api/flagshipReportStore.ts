import {
  AccountAssociationRoutes,
  isAccountId,
  isLegacyId,
  type ApiStoreContext,
} from '@/api/v2Associations';
import { CountryId } from '@/libs/countries';
import {
  ReportValidationSnapshot,
  validationFromWire,
  validationToWire,
} from '@/libs/flagship/reportValidation';
import type { RunReportProvision } from '@/libs/flagship/runReport';
import { clampStoreText, MAX_STORE_NOTE_LENGTH } from '@/libs/flagship/storeText';
import type { ReportProvisionWire, UserReportCreateBody, UserReportItem } from '@/types/v2User';

/**
 * Store for flagship report records: a pointer to the computed output on
 * the PolicyEngine API plus the provenance snapshot for the report
 * header. Signed out (and outside the US and UK) records live in
 * localStorage; signed in, a record is the account's `/v2/user-reports`
 * row for the report, carrying the v3 fields.
 */
export interface FlagshipReportRecord {
  id: string;
  countryId: CountryId;
  /** Report id on api.policyengine.org — the pointer to the outputs. */
  apiReportId: string;
  title: string | null;
  sourceNote: string | null;
  provisions: RunReportProvision[];
  /** The simulated year; localStorage records only (the report itself carries it). */
  year?: string;
  createdAt: string;
  /** Saved reform this report came from, when known. */
  reformId?: string | null;
  /** What validation matched this report against, pinned at match time. */
  validation?: ReportValidationSnapshot | null;
}

export type NewFlagshipReport = Omit<FlagshipReportRecord, 'id' | 'createdAt' | 'validation'>;

/** Newest first. */
function newestFirst(records: FlagshipReportRecord[]): FlagshipReportRecord[] {
  return [...records].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

export interface FlagshipReportStore {
  create: (report: NewFlagshipReport) => Promise<FlagshipReportRecord>;
  /** This session's records, newest first. */
  findMine: (countryId?: string) => Promise<FlagshipReportRecord[]>;
  findById: (id: string) => Promise<FlagshipReportRecord | null>;
  /** The record pointing at an API report, when this session has one. */
  findByApiReportId: (apiReportId: string) => Promise<FlagshipReportRecord | null>;
  /** Pins the validation snapshot to a record. */
  saveValidation: (id: string, snapshot: ReportValidationSnapshot) => Promise<FlagshipReportRecord>;
}

/** Provisions on the wire: snake_case, dated changes as start_date/end_date. */
export function provisionsToWire(provisions: RunReportProvision[]): ReportProvisionWire[] {
  return provisions.map((provision) => ({
    path: provision.path,
    breadcrumb: provision.breadcrumb,
    unit: provision.unit ?? null,
    baseline_value: provision.baselineValue ?? null,
    value: provision.value ?? null,
    intervals:
      provision.intervals && provision.intervals.length > 0
        ? provision.intervals.map((interval) => ({
            start_date: interval.startDate,
            end_date: interval.endDate,
            value: interval.value ?? null,
          }))
        : null,
  }));
}

export function provisionsFromWire(
  wire: ReportProvisionWire[] | null | undefined
): RunReportProvision[] {
  return (wire ?? []).map((provision) => ({
    path: provision.path,
    breadcrumb: provision.breadcrumb,
    unit: provision.unit ?? null,
    baselineValue: provision.baseline_value,
    value: provision.value,
    ...(provision.intervals && provision.intervals.length > 0
      ? {
          intervals: provision.intervals.map((interval) => ({
            startDate: interval.start_date,
            endDate: interval.end_date,
            value: interval.value as any,
          })),
        }
      : {}),
  }));
}

export function recordFromItem(item: UserReportItem): FlagshipReportRecord {
  return {
    id: item.id,
    countryId: item.country_id,
    apiReportId: String(item.legacy_report_id),
    title: item.name,
    sourceNote: item.source_note,
    provisions: provisionsFromWire(item.provisions),
    createdAt: item.created_at,
    reformId: item.user_policy_id,
    validation: validationFromWire(item.validation),
  };
}

/**
 * Flagship report records as the account's `/v2/user-reports` rows. Only
 * account IDs open: a record saved in this browser while signed out
 * (`lfr-…`) answers BrowserOnlyIdError.
 */
export class ApiFlagshipReportStore implements FlagshipReportStore {
  private readonly routes: AccountAssociationRoutes<UserReportItem>;

  constructor(private readonly context: ApiStoreContext) {
    this.routes = new AccountAssociationRoutes(context, 'user-reports', 'Report');
  }

  private creationBody(report: NewFlagshipReport): UserReportCreateBody {
    // The reform link must be one of this account's rows; a reform saved
    // in this browser while signed out is not linked.
    const userPolicyId = isAccountId(report.reformId) ? report.reformId : null;
    return {
      country_id: this.routes.writeCountry(report.countryId),
      legacy_report_id: Number(report.apiReportId),
      name: clampStoreText(report.title) || null,
      source_note: clampStoreText(report.sourceNote, MAX_STORE_NOTE_LENGTH) || null,
      provisions: provisionsToWire(report.provisions),
      ...(userPolicyId ? { user_policy_id: userPolicyId } : {}),
      last_run_at: new Date().toISOString(),
    };
  }

  async create(report: NewFlagshipReport): Promise<FlagshipReportRecord> {
    return recordFromItem(await this.routes.create(this.creationBody(report)));
  }

  async findMine(countryId?: string): Promise<FlagshipReportRecord[]> {
    if (countryId && countryId !== this.context.countryId) {
      return [];
    }
    const items = await this.routes.list();
    return newestFirst(
      items.filter((item) => isLegacyId(item.legacy_report_id)).map(recordFromItem)
    );
  }

  async findById(id: string): Promise<FlagshipReportRecord | null> {
    const item = await this.routes.get(id);
    return item && isLegacyId(item.legacy_report_id) ? recordFromItem(item) : null;
  }

  async findByApiReportId(apiReportId: string): Promise<FlagshipReportRecord | null> {
    if (!isLegacyId(apiReportId)) {
      return null;
    }
    const item = await this.routes.findFirst({ legacy_report_id: apiReportId });
    return item ? recordFromItem(item) : null;
  }

  async saveValidation(
    id: string,
    snapshot: ReportValidationSnapshot
  ): Promise<FlagshipReportRecord> {
    return recordFromItem(await this.routes.patch(id, { validation: validationToWire(snapshot) }));
  }
}

export const FLAGSHIP_REPORTS_KEY = 'pe-flagship-reports';

export class LocalStorageFlagshipReportStore implements FlagshipReportStore {
  private read(): FlagshipReportRecord[] {
    try {
      return JSON.parse(localStorage.getItem(FLAGSHIP_REPORTS_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  private write(records: FlagshipReportRecord[]): void {
    try {
      localStorage.setItem(FLAGSHIP_REPORTS_KEY, JSON.stringify(records));
    } catch {
      // Reports simply won't persist locally.
    }
  }

  async create(report: NewFlagshipReport): Promise<FlagshipReportRecord> {
    const record: FlagshipReportRecord = {
      ...report,
      id: `lfr-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    this.write([record, ...this.read()]);
    return record;
  }

  async findMine(countryId?: string): Promise<FlagshipReportRecord[]> {
    return newestFirst(
      this.read().filter((record) => !countryId || record.countryId === countryId)
    );
  }

  async findById(id: string): Promise<FlagshipReportRecord | null> {
    return this.read().find((record) => record.id === id) ?? null;
  }

  async findByApiReportId(apiReportId: string): Promise<FlagshipReportRecord | null> {
    return this.read().find((record) => record.apiReportId === apiReportId) ?? null;
  }

  async saveValidation(
    id: string,
    snapshot: ReportValidationSnapshot
  ): Promise<FlagshipReportRecord> {
    const records = this.read();
    const index = records.findIndex((record) => record.id === id);
    if (index === -1) {
      throw new Error('Report not found');
    }
    const updated = { ...records[index], validation: snapshot };
    records[index] = updated;
    this.write(records);
    return updated;
  }
}

/** The report store for a session: the account's when given one, else localStorage. */
export function getFlagshipReportStore(account?: ApiStoreContext | null): FlagshipReportStore {
  return account ? new ApiFlagshipReportStore(account) : new LocalStorageFlagshipReportStore();
}
