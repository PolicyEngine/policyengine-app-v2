import {
  AccountAssociationRoutes,
  isAccountId,
  isLegacyId,
  type ApiStoreContext,
} from '@/api/v2Associations';
import { CountryId } from '@/libs/countries';
import {
  parseReportRecord,
  readableReports,
  stampReportRecord,
  unwrapReport,
  type ReportParseResult,
} from '@/libs/flagship/reportSchema';
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
  /** Years in the budget window run with the report, from its year; none for one year. */
  budgetWindowYears?: number | null;
  /**
   * The saved reform the report was compared with, when not current law.
   * Its name is the baseline's label, so no label is stored here.
   */
  baselineReformId?: string | null;
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

/** A provision's growth settings on the wire, each only when set. */
function growthToWire(provision: RunReportProvision): Partial<ReportProvisionWire> {
  return {
    ...(provision.growth ? { growth: provision.growth } : {}),
    ...(provision.growthStart !== undefined ? { growth_start: provision.growthStart } : {}),
    ...(provision.growthBase !== undefined ? { growth_base: provision.growthBase } : {}),
    ...(provision.growthRoundTo !== undefined ? { growth_round_to: provision.growthRoundTo } : {}),
    ...(provision.growthRound ? { growth_round: provision.growthRound } : {}),
  };
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
    ...growthToWire(provision),
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
    ...(provision.growth ? { growth: provision.growth } : {}),
    ...(provision.growth_start != null ? { growthStart: provision.growth_start } : {}),
    ...(provision.growth_base != null ? { growthBase: provision.growth_base } : {}),
    ...(provision.growth_round_to != null ? { growthRoundTo: provision.growth_round_to } : {}),
    ...(provision.growth_round ? { growthRound: provision.growth_round } : {}),
  }));
}

/**
 * An account row as a record, read through the report schema (see
 * reportSchema) like a browser record, so a damaged field is a typed
 * error instead of a crash in the UI.
 */
export function parseReportItem(item: UserReportItem): ReportParseResult<FlagshipReportRecord> {
  return parseReportRecord(
    stampReportRecord({
      id: item.id,
      countryId: item.country_id,
      apiReportId: String(item.legacy_report_id),
      title: item.name,
      sourceNote: item.source_note,
      provisions: provisionsFromWire(item.provisions),
      createdAt: item.created_at,
      reformId: item.user_policy_id,
      validation: validationFromWire(item.validation),
      budgetWindowYears: item.budget_window_years ?? null,
      baselineReformId: item.baseline_user_policy_id ?? null,
    })
  );
}

/** An account row as a record; throws ReportSchemaError when unreadable. */
export function recordFromItem(item: UserReportItem): FlagshipReportRecord {
  return unwrapReport(parseReportItem(item));
}

/** A link to a saved reform, when it is one of the account's rows. */
const accountLink = (reformId: string | null | undefined) =>
  isAccountId(reformId) ? reformId : null;

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
    // Links must be the account's own rows; a reform saved in this
    // browser while signed out is not linked.
    const userPolicyId = accountLink(report.reformId);
    const baselineUserPolicyId = accountLink(report.baselineReformId);
    return {
      country_id: this.routes.writeCountry(report.countryId),
      legacy_report_id: Number(report.apiReportId),
      name: clampStoreText(report.title) || null,
      source_note: clampStoreText(report.sourceNote, MAX_STORE_NOTE_LENGTH) || null,
      provisions: provisionsToWire(report.provisions),
      ...(userPolicyId ? { user_policy_id: userPolicyId } : {}),
      ...(baselineUserPolicyId ? { baseline_user_policy_id: baselineUserPolicyId } : {}),
      ...(report.budgetWindowYears && report.budgetWindowYears > 1
        ? { budget_window_years: report.budgetWindowYears }
        : {}),
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
    // A row that can't be read is left out of the list, not fatal to it.
    return newestFirst(
      readableReports(
        items.filter((item) => isLegacyId(item.legacy_report_id)).map(parseReportItem)
      )
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

/** Records saved in this browser (accounts off, or outside the US and UK). */
export class LocalStorageFlagshipReportStore implements FlagshipReportStore {
  /**
   * The entries as stored, of any schema version. Writes keep the ones
   * this version can't read, so a record a newer version saved survives.
   */
  private readStored(): unknown[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(FLAGSHIP_REPORTS_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write(entries: unknown[]): void {
    try {
      localStorage.setItem(FLAGSHIP_REPORTS_KEY, JSON.stringify(entries));
    } catch {
      // Reports simply won't persist locally.
    }
  }

  /** The readable records, in the current shape; an unreadable entry is left out. */
  private read(): FlagshipReportRecord[] {
    return readableReports(this.readStored().map(parseReportRecord));
  }

  /** The first entry with this field value, parsed; throws ReportSchemaError when unreadable. */
  private findStored(
    field: 'id' | 'apiReportId',
    value: string
  ): { entries: unknown[]; index: number; record: FlagshipReportRecord } | null {
    const entries = this.readStored();
    const index = entries.findIndex(
      (entry) => !!entry && typeof entry === 'object' && (entry as any)[field] === value
    );
    if (index === -1) {
      return null;
    }
    return { entries, index, record: unwrapReport(parseReportRecord(entries[index])) };
  }

  async create(report: NewFlagshipReport): Promise<FlagshipReportRecord> {
    const record = unwrapReport(
      parseReportRecord({
        ...report,
        id: `lfr-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      })
    );
    this.write([stampReportRecord(record), ...this.readStored()]);
    return record;
  }

  async findMine(countryId?: string): Promise<FlagshipReportRecord[]> {
    return newestFirst(
      this.read().filter((record) => !countryId || record.countryId === countryId)
    );
  }

  async findById(id: string): Promise<FlagshipReportRecord | null> {
    return this.findStored('id', id)?.record ?? null;
  }

  async findByApiReportId(apiReportId: string): Promise<FlagshipReportRecord | null> {
    return this.findStored('apiReportId', apiReportId)?.record ?? null;
  }

  async saveValidation(
    id: string,
    snapshot: ReportValidationSnapshot
  ): Promise<FlagshipReportRecord> {
    const found = this.findStored('id', id);
    if (!found) {
      throw new Error('Report not found');
    }
    const updated = { ...found.record, validation: snapshot };
    found.entries[found.index] = stampReportRecord(updated);
    this.write(found.entries);
    return updated;
  }
}

/** The report store for a session: the account's when given one, else localStorage. */
export function getFlagshipReportStore(account?: ApiStoreContext | null): FlagshipReportStore {
  return account ? new ApiFlagshipReportStore(account) : new LocalStorageFlagshipReportStore();
}
