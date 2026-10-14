import { CountryId } from '@/libs/countries';
import {
  addOwnedItem,
  editTokenHeaders,
  findOwnedReportByApiReportId,
  isUuid,
  ItemNotOwnedError,
  readOwnedItems,
} from '@/libs/flagship/ownedItems';
import {
  parseReportRecord,
  parseReportRow,
  readableReports,
  stampReportRecord,
  unwrapReport,
} from '@/libs/flagship/reportSchema';
import { ReportValidationSnapshot, validationToWire } from '@/libs/flagship/reportValidation';
import { RunReportProvision } from '@/libs/flagship/runReport';
import { clampStoreText } from '@/libs/flagship/storeText';

/**
 * Store for flagship report records: a pointer to the computed output
 * on the PolicyEngine API plus the provenance snapshot for the report
 * header. Central Supabase-backed store first, localStorage fallback
 * when it is unconfigured — same resilience pattern as the reform
 * store, and the same ownership model: no user identifier on the
 * server, this browser's index of the records it created, and an edit
 * token on every change.
 */
export interface FlagshipReportRecord {
  id: string;
  countryId: CountryId;
  /** Report id on api.policyengine.org — the pointer to the outputs. */
  apiReportId: string;
  title: string | null;
  sourceNote: string | null;
  provisions: RunReportProvision[];
  year: string;
  createdAt: string;
  /** Saved reform this report came from, when known. */
  reformId?: string | null;
  /** What validation matched this report against, pinned at match time. */
  validation?: ReportValidationSnapshot | null;
}

export type NewFlagshipReport = Omit<FlagshipReportRecord, 'id' | 'createdAt' | 'validation'>;

export interface FlagshipReportStore {
  create: (report: NewFlagshipReport) => Promise<FlagshipReportRecord>;
  /** The records this browser saved, newest first. */
  findMine: (countryId?: string) => Promise<FlagshipReportRecord[]>;
  findById: (id: string) => Promise<FlagshipReportRecord | null>;
  /** The record this browser saved for an API report, when it has one. */
  findByApiReportId: (apiReportId: string) => Promise<FlagshipReportRecord | null>;
  /** Pins the validation snapshot to a record. */
  saveValidation: (id: string, snapshot: ReportValidationSnapshot) => Promise<FlagshipReportRecord>;
}

class ReportStoreUnavailableError extends Error {
  constructor() {
    super('Report store unavailable');
    this.name = 'ReportStoreUnavailableError';
  }
}

function throwIfUnavailable(response: Response): void {
  if (response.status === 503 || response.status === 404) {
    throw new ReportStoreUnavailableError();
  }
}

/** The central store took its limit of new records this minute (429). */
class ReportStoreBusyError extends Error {
  constructor() {
    super('Report store is taking no new records this minute');
    this.name = 'ReportStoreBusyError';
  }
}

/** Ids per batch read, so the query string stays well under URL limits. */
const IDS_PER_REQUEST = 50;

function newestFirst(a: FlagshipReportRecord, b: FlagshipReportRecord): number {
  return b.createdAt.localeCompare(a.createdAt);
}

/** A central row as a record (see reportSchema); throws ReportSchemaError when unreadable. */
function fromMetadata(data: unknown): FlagshipReportRecord {
  return unwrapReport(parseReportRow(data));
}

export class ApiFlagshipReportStore implements FlagshipReportStore {
  private readonly BASE_URL = '/api/reports';

  async create(report: NewFlagshipReport): Promise<FlagshipReportRecord> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country_id: report.countryId,
        api_report_id: report.apiReportId,
        // Shortened to the store's text limit, so a long bill title saves.
        title: clampStoreText(report.title),
        source_note: clampStoreText(report.sourceNote),
        provisions: report.provisions.map((p) => ({
          path: p.path,
          breadcrumb: p.breadcrumb,
          unit: p.unit,
          baseline_value: p.baselineValue,
          value: p.value,
        })),
        year: report.year,
        // A reform still in the localStorage fallback has no central row
        // to point at.
        reform_id: report.reformId && isUuid(report.reformId) ? report.reformId : null,
      }),
    });
    if (!response.ok) {
      throwIfUnavailable(response);
      if (response.status === 429) {
        throw new ReportStoreBusyError();
      }
      throw new Error('Failed to save the report record');
    }
    const { edit_token: editToken, ...data } = await response.json();
    const record = fromMetadata(data);
    addOwnedItem('reports', {
      id: record.id,
      countryId: record.countryId,
      apiReportId: record.apiReportId,
      editToken,
    });
    return record;
  }

  async findMine(countryId?: string): Promise<FlagshipReportRecord[]> {
    const ids = readOwnedItems('reports', countryId).map((item) => item.id);
    const records: FlagshipReportRecord[] = [];
    for (let start = 0; start < ids.length; start += IDS_PER_REQUEST) {
      const params = new URLSearchParams({
        ids: ids.slice(start, start + IDS_PER_REQUEST).join(','),
      });
      const response = await fetch(`${this.BASE_URL}?${params}`);
      if (!response.ok) {
        throwIfUnavailable(response);
        throw new Error('Failed to load reports');
      }
      // A row that can't be read is left out of the list, not fatal to it.
      const rows: unknown = await response.json();
      records.push(...readableReports((Array.isArray(rows) ? rows : []).map(parseReportRow)));
    }
    return records.sort(newestFirst);
  }

  async findById(id: string): Promise<FlagshipReportRecord | null> {
    const response = await fetch(`${this.BASE_URL}/${id}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throwIfUnavailable(response);
      throw new Error('Failed to load the report');
    }
    return fromMetadata(await response.json());
  }

  /**
   * Resolved through this browser's index: API report ids are sequential
   * integers, so the server offers no lookup by them.
   */
  async findByApiReportId(apiReportId: string): Promise<FlagshipReportRecord | null> {
    const owned = findOwnedReportByApiReportId(apiReportId);
    return owned ? this.findById(owned.id) : null;
  }

  async saveValidation(
    id: string,
    snapshot: ReportValidationSnapshot
  ): Promise<FlagshipReportRecord> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...editTokenHeaders('reports', id) },
      body: JSON.stringify({ validation: validationToWire(snapshot) }),
    });
    // Item-level 404 means the record is gone, not that the store is.
    if (response.status === 503) {
      throw new ReportStoreUnavailableError();
    }
    if (response.status === 403) {
      throw new ItemNotOwnedError();
    }
    if (!response.ok) {
      throw new Error('Failed to save the validation snapshot');
    }
    return fromMetadata(await response.json());
  }
}

const LOCAL_KEY = 'pe-flagship-reports';

/**
 * The browser-only fallback. Everything in it was saved in this
 * browser, so all of it is "mine" — including records saved before the
 * central store dropped user ids, which still carry a userId field.
 */
export class LocalStorageFlagshipReportStore implements FlagshipReportStore {
  /**
   * The entries as stored, of any schema version. Writes keep the ones
   * this version can't read, so a record a newer version saved survives.
   */
  private readStored(): unknown[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write(entries: unknown[]): void {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
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
    return this.read()
      .filter((record) => !countryId || record.countryId === countryId)
      .sort(newestFirst);
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

let centralUnavailable = false;

class ResilientFlagshipReportStore implements FlagshipReportStore {
  constructor(
    private readonly api: FlagshipReportStore = new ApiFlagshipReportStore(),
    private readonly local: FlagshipReportStore = new LocalStorageFlagshipReportStore()
  ) {}

  private async withFallback<T>(
    run: (store: FlagshipReportStore) => Promise<T>,
    whenUnavailable: (store: FlagshipReportStore) => Promise<T> = run
  ): Promise<T> {
    if (!centralUnavailable) {
      try {
        return await run(this.api);
      } catch (error) {
        if (!(error instanceof ReportStoreUnavailableError)) {
          throw error;
        }
        centralUnavailable = true;
      }
    }
    return whenUnavailable(this.local);
  }

  // A busy central store (429) takes this one record locally and stays
  // in use for the next.
  async create(report: NewFlagshipReport): Promise<FlagshipReportRecord> {
    try {
      return await this.withFallback((store) => store.create(report));
    } catch (error) {
      if (error instanceof ReportStoreBusyError) {
        return this.local.create(report);
      }
      throw error;
    }
  }

  // Records already in the localStorage fallback stay there with their
  // ids: lists show them beside the central ones, and pins stay local.
  async findMine(countryId?: string): Promise<FlagshipReportRecord[]> {
    const local = await this.local.findMine(countryId);
    const central = await this.withFallback(
      (store) => store.findMine(countryId),
      async () => []
    );
    return [...central, ...local].sort(newestFirst);
  }

  async findById(id: string): Promise<FlagshipReportRecord | null> {
    const local = await this.local.findById(id);
    if (local) {
      return local;
    }
    return this.withFallback(
      (store) => store.findById(id),
      async () => null
    );
  }

  async findByApiReportId(apiReportId: string): Promise<FlagshipReportRecord | null> {
    const local = await this.local.findByApiReportId(apiReportId);
    if (local) {
      return local;
    }
    return this.withFallback(
      (store) => store.findByApiReportId(apiReportId),
      async () => null
    );
  }

  async saveValidation(
    id: string,
    snapshot: ReportValidationSnapshot
  ): Promise<FlagshipReportRecord> {
    if (await this.local.findById(id)) {
      return this.local.saveValidation(id, snapshot);
    }
    return this.withFallback((store) => store.saveValidation(id, snapshot));
  }
}

/** Test hook: reset the remembered central-store availability. */
export function resetFlagshipReportStoreAvailability(): void {
  centralUnavailable = false;
}

export function getFlagshipReportStore(): FlagshipReportStore {
  return new ResilientFlagshipReportStore();
}
