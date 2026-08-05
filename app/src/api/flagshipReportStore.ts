import { CountryId } from '@/libs/countries';
import { RunReportProvision } from '@/libs/flagship/runReport';

/**
 * Store for flagship report records: a pointer to the computed output
 * on the PolicyEngine API plus the provenance snapshot for the report
 * header. Central Supabase-backed store first, localStorage fallback
 * when it is unconfigured — same resilience pattern as the reform
 * store.
 */
export interface FlagshipReportRecord {
  id: string;
  userId: string;
  countryId: CountryId;
  /** Report id on api.policyengine.org — the pointer to the outputs. */
  apiReportId: string;
  title: string | null;
  sourceNote: string | null;
  provisions: RunReportProvision[];
  year: string;
  createdAt: string;
}

export type NewFlagshipReport = Omit<FlagshipReportRecord, 'id' | 'createdAt'>;

export interface FlagshipReportStore {
  create: (report: NewFlagshipReport) => Promise<FlagshipReportRecord>;
  findByUser: (userId: string, countryId?: string) => Promise<FlagshipReportRecord[]>;
  findById: (id: string) => Promise<FlagshipReportRecord | null>;
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

function fromMetadata(data: any): FlagshipReportRecord {
  return {
    id: data.id,
    userId: data.user_id,
    countryId: data.country_id,
    apiReportId: data.api_report_id,
    title: data.title,
    sourceNote: data.source_note,
    provisions: (data.provisions ?? []).map((p: any) => ({
      path: p.path,
      breadcrumb: p.breadcrumb,
      unit: p.unit ?? null,
      baselineValue: p.baseline_value,
      value: p.value,
    })),
    year: data.year,
    createdAt: data.created_at,
  };
}

export class ApiFlagshipReportStore implements FlagshipReportStore {
  private readonly BASE_URL = '/api/reports';

  async create(report: NewFlagshipReport): Promise<FlagshipReportRecord> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: report.userId,
        country_id: report.countryId,
        api_report_id: report.apiReportId,
        title: report.title,
        source_note: report.sourceNote,
        provisions: report.provisions.map((p) => ({
          path: p.path,
          breadcrumb: p.breadcrumb,
          unit: p.unit,
          baseline_value: p.baselineValue,
          value: p.value,
        })),
        year: report.year,
      }),
    });
    if (!response.ok) {
      throwIfUnavailable(response);
      throw new Error('Failed to save the report record');
    }
    return fromMetadata(await response.json());
  }

  async findByUser(userId: string, countryId?: string): Promise<FlagshipReportRecord[]> {
    const params = new URLSearchParams({ user_id: userId });
    if (countryId) {
      params.set('country_id', countryId);
    }
    const response = await fetch(`${this.BASE_URL}?${params}`);
    if (!response.ok) {
      throwIfUnavailable(response);
      throw new Error('Failed to load reports');
    }
    return ((await response.json()) as any[]).map(fromMetadata);
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
}

const LOCAL_KEY = 'pe-flagship-reports';

export class LocalStorageFlagshipReportStore implements FlagshipReportStore {
  private read(): FlagshipReportRecord[] {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  private write(records: FlagshipReportRecord[]): void {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(records));
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

  async findByUser(userId: string, countryId?: string): Promise<FlagshipReportRecord[]> {
    return this.read().filter(
      (record) => record.userId === userId && (!countryId || record.countryId === countryId)
    );
  }

  async findById(id: string): Promise<FlagshipReportRecord | null> {
    return this.read().find((record) => record.id === id) ?? null;
  }
}

let centralUnavailable = false;

class ResilientFlagshipReportStore implements FlagshipReportStore {
  constructor(
    private readonly api: FlagshipReportStore = new ApiFlagshipReportStore(),
    private readonly local: FlagshipReportStore = new LocalStorageFlagshipReportStore()
  ) {}

  private async withFallback<T>(run: (store: FlagshipReportStore) => Promise<T>): Promise<T> {
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
    return run(this.local);
  }

  create(report: NewFlagshipReport): Promise<FlagshipReportRecord> {
    return this.withFallback((store) => store.create(report));
  }

  findByUser(userId: string, countryId?: string): Promise<FlagshipReportRecord[]> {
    return this.withFallback((store) => store.findByUser(userId, countryId));
  }

  findById(id: string): Promise<FlagshipReportRecord | null> {
    return this.withFallback((store) => store.findById(id));
  }
}

/** Test hook: reset the remembered central-store availability. */
export function resetFlagshipReportStoreAvailability(): void {
  centralUnavailable = false;
}

export function getFlagshipReportStore(): FlagshipReportStore {
  return new ResilientFlagshipReportStore();
}
