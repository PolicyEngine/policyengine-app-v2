import { useSyncExternalStore } from 'react';
import {
  FLAGSHIP_REPORTS_KEY,
  provisionsToWire,
  type FlagshipReportRecord,
} from '@/api/flagshipReportStore';
import { isLegacyId } from '@/api/v2Associations';
import { importToAccount } from '@/api/v2Me';
import type { V2UserClient } from '@/api/v2UserClient';
import { validationToWire } from '@/libs/flagship/reportValidation';
import { REPORT_META_KEY, type FlagshipReportMeta } from '@/libs/flagship/runReport';
import type { Reform } from '@/types/ingredients/Reform';
import {
  ASSOCIATION_COUNTRY_IDS,
  isAssociationCountry,
  type AssociationCountryId,
  type ImportPolicyItem,
  type ImportReportItem,
  type ImportRequestBody,
} from '@/types/v2User';

/**
 * The import at sign-in: every sign-in moves the v3 reforms and reports
 * saved on this browser while signed out (US and UK) into the account with
 * `POST /v2/me/imports`. Each item the account confirms (its `client_ref`
 * comes back in `id_map`) is removed from this browser; everything else
 * stays here and is sent again at the next sign-in. Only v3's own keys are
 * read. The server deduplicates by `client_ref` (the browser ID), so an
 * item sent again returns its existing ID.
 *
 * Browser reforms already carry their v1 policy (saving one creates it),
 * so the import creates nothing in v1. A reform saved by an earlier build
 * without a policy is not sent; it stays here until it is saved again.
 */

/** The v3 keys the import reads; v3 never reads the legacy calculator's keys. */
const REFORMS_KEY = 'reforms';

/** Server limits on one import request. */
const IMPORT_MAX_ITEMS = 500;
/** Kept under the 1 MiB body cap to leave room for the envelope. */
const IMPORT_MAX_BYTES = 950_000;

function readArray<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readObject<T>(key: string): Record<string, T> {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

type PlannedItem =
  | { kind: 'policies'; clientRef: string; body: ImportPolicyItem }
  | { kind: 'reports'; clientRef: string; body: ImportReportItem };

/** This browser's v3 reforms and reports, per account country. */
function planBrowserWorkImport(): Record<AssociationCountryId, PlannedItem[]> {
  const reforms = readArray<Reform>(REFORMS_KEY);
  const records = readArray<FlagshipReportRecord>(FLAGSHIP_REPORTS_KEY);
  const meta = readObject<FlagshipReportMeta>(REPORT_META_KEY);
  const plan: Record<AssociationCountryId, PlannedItem[]> = { us: [], uk: [] };

  for (const reform of reforms) {
    if (!reform.id || !isAssociationCountry(reform.countryId) || !isLegacyId(reform.policyId)) {
      continue;
    }
    plan[reform.countryId].push({
      kind: 'policies',
      clientRef: reform.id,
      body: {
        client_ref: reform.id,
        legacy_policy_id: Number(reform.policyId),
        name: text(reform.label),
        description: null,
        baseline: reform.baseline ?? null,
        provenance: reform.provenance
          ? {
              source: reform.provenance.source,
              ref: reform.provenance.ref ?? null,
              confidence: reform.provenance.confidence ?? null,
            }
          : null,
      },
    });
  }

  for (const record of records) {
    if (!record.id || !isAssociationCountry(record.countryId) || !isLegacyId(record.apiReportId)) {
      continue;
    }
    const runMeta = meta[record.apiReportId];
    const provisions = record.provisions?.length ? record.provisions : runMeta?.provisions;
    plan[record.countryId].push({
      kind: 'reports',
      clientRef: record.id,
      body: {
        client_ref: record.id,
        legacy_report_id: Number(record.apiReportId),
        name: text(record.title) ?? text(runMeta?.title),
        description: null,
        // Linked to its reform by the reform's browser ID (its client_ref).
        // The account resolves it against reforms in the same request or
        // moved at an earlier sign-in, and leaves the report unlinked
        // when there is none.
        user_policy_client_ref: text(record.reformId),
        source_note: text(record.sourceNote) ?? text(runMeta?.sourceNote),
        provisions: provisions?.length ? provisionsToWire(provisions) : null,
        validation: record.validation ? validationToWire(record.validation) : null,
        last_run_at: null,
      },
    });
  }
  return plan;
}

/**
 * Removes the items the account confirmed from this browser: the reforms
 * and report records with those IDs, and the run details of reports no
 * remaining record points at. An item left behind by a failed write is
 * sent again next time and answers its existing ID.
 */
function removeMovedItems(movedClientRefs: ReadonlySet<string>): void {
  try {
    const reforms = readArray<Reform>(REFORMS_KEY);
    const keptReforms = reforms.filter((reform) => !(reform.id && movedClientRefs.has(reform.id)));
    if (keptReforms.length !== reforms.length) {
      localStorage.setItem(REFORMS_KEY, JSON.stringify(keptReforms));
    }

    const records = readArray<FlagshipReportRecord>(FLAGSHIP_REPORTS_KEY);
    const keptRecords = records.filter((record) => !movedClientRefs.has(record.id));
    if (keptRecords.length === records.length) {
      return;
    }
    localStorage.setItem(FLAGSHIP_REPORTS_KEY, JSON.stringify(keptRecords));

    const stillReferenced = new Set(keptRecords.map((record) => record.apiReportId));
    const movedReportIds = records
      .filter((record) => movedClientRefs.has(record.id))
      .map((record) => record.apiReportId)
      .filter((apiReportId) => !stillReferenced.has(apiReportId));
    const meta = readObject<FlagshipReportMeta>(REPORT_META_KEY);
    if (movedReportIds.some((apiReportId) => apiReportId in meta)) {
      movedReportIds.forEach((apiReportId) => delete meta[apiReportId]);
      localStorage.setItem(REPORT_META_KEY, JSON.stringify(meta));
    }
  } catch {
    // Storage unavailable: the items stay and are sent again next time.
  }
}

function byteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/** Request bodies of at most `maxItems` items and about `maxBytes`, reforms first. */
function chunkImportItems(
  items: PlannedItem[],
  { maxItems = IMPORT_MAX_ITEMS, maxBytes = IMPORT_MAX_BYTES } = {}
): ImportRequestBody[] {
  const chunks: PlannedItem[][] = [];
  let current: PlannedItem[] = [];
  let currentBytes = 0;
  for (const item of items) {
    const size = byteLength(item.body) + 1;
    if (current.length > 0 && (current.length >= maxItems || currentBytes + size > maxBytes)) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(item);
    currentBytes += size;
  }
  if (current.length > 0) {
    chunks.push(current);
  }
  return chunks.map((chunk) => ({
    policies: chunk.flatMap((item) => (item.kind === 'policies' ? [item.body] : [])),
    reports: chunk.flatMap((item) => (item.kind === 'reports' ? [item.body] : [])),
  }));
}

/** The account countries, `firstCountryId` first. */
function countryOrder(firstCountryId?: string): AssociationCountryId[] {
  return isAssociationCountry(firstCountryId)
    ? [firstCountryId, ...ASSOCIATION_COUNTRY_IDS.filter((id) => id !== firstCountryId)]
    : [...ASSOCIATION_COUNTRY_IDS];
}

export interface BrowserWorkImportOutcome {
  reformsMoved: number;
  reportsMoved: number;
  /** Items still on this browser: skipped by the account, or not sent. */
  leftOnBrowser: number;
  /** True when an import request failed, which stops the run. */
  requestFailed: boolean;
}

export interface ImportBrowserWorkOptions {
  client: V2UserClient;
  /**
   * The country signed in from. Its items go first, so the request that
   * creates the account on a first sign-in records it as the account's
   * country.
   */
  firstCountryId?: string;
}

/**
 * Moves this browser's signed-out v3 work into the account, removing each
 * item the account confirms. A failed request stops the run; everything
 * not yet moved stays.
 */
export async function importBrowserWork({
  client,
  firstCountryId,
}: ImportBrowserWorkOptions): Promise<BrowserWorkImportOutcome> {
  const plan = planBrowserWorkImport();
  const planned = ASSOCIATION_COUNTRY_IDS.reduce(
    (total, countryId) => total + plan[countryId].length,
    0
  );
  const outcome: BrowserWorkImportOutcome = {
    reformsMoved: 0,
    reportsMoved: 0,
    leftOnBrowser: planned,
    requestFailed: false,
  };

  for (const countryId of countryOrder(firstCountryId)) {
    for (const body of chunkImportItems(plan[countryId])) {
      const result = await importToAccount(client, countryId, body).catch((error: unknown) => {
        console.error('[accountImport] Import request failed:', error);
        return null;
      });
      if (!result) {
        outcome.requestFailed = true;
        return outcome;
      }
      const moved = new Set(
        [...(body.policies ?? []), ...(body.reports ?? [])]
          .map((item) => item.client_ref)
          .filter((clientRef) => result.id_map[clientRef])
      );
      removeMovedItems(moved);
      const countMoved = (refs: Array<{ client_ref: string }> | undefined) =>
        (refs ?? []).filter((item) => moved.has(item.client_ref)).length;
      outcome.reformsMoved += countMoved(body.policies);
      outcome.reportsMoved += countMoved(body.reports);
      outcome.leftOnBrowser -= moved.size;
    }
  }
  return outcome;
}

/** Whether this browser holds any v3 work the import would move. */
export function hasBrowserWorkToImport(): boolean {
  const plan = planBrowserWorkImport();
  return ASSOCIATION_COUNTRY_IDS.some((countryId) => plan[countryId].length > 0);
}

/* The notice shown after the import, which outlives the callback page. */

export interface AccountImportNotice {
  kind: 'success' | 'warning' | 'failure';
  message: string;
  /** Runs the import again; present after a failed request. */
  retry: (() => void) | null;
}

let currentNotice: AccountImportNotice | null = null;
const listeners = new Set<() => void>();

function publishNotice(notice: AccountImportNotice | null): void {
  currentNotice = notice;
  listeners.forEach((listener) => listener());
}

export function dismissAccountImportNotice(): void {
  publishNotice(null);
}

export function useAccountImportNotice(): AccountImportNotice | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => currentNotice,
    () => null
  );
}

function count(amount: number, noun: string): string {
  return `${amount} ${noun}${amount === 1 ? '' : 's'}`;
}

const TRIED_AGAIN = 'will be tried again the next time you sign in';

/**
 * "Moved N reforms and M reports from this browser to your account.",
 * plus how many items stay on this browser for the next sign-in.
 */
export function importOutcomeMessage(outcome: BrowserWorkImportOutcome): string {
  const movedAny = outcome.reformsMoved + outcome.reportsMoved > 0;
  const moved = `Moved ${count(outcome.reformsMoved, 'reform')} and ${count(
    outcome.reportsMoved,
    'report'
  )} from this browser to your account.`;
  if (outcome.leftOnBrowser === 0) {
    return moved;
  }
  if (!movedAny) {
    return outcome.requestFailed
      ? `Your reforms and reports saved on this browser could not be moved to your account. They are still on this browser and ${TRIED_AGAIN}.`
      : `${count(outcome.leftOnBrowser, 'item')} saved on this browser could not be moved to your account. ${
          outcome.leftOnBrowser === 1 ? 'It is' : 'They are'
        } still on this browser and ${TRIED_AGAIN}.`;
  }
  return `${moved} ${count(outcome.leftOnBrowser, 'item')} ${
    outcome.leftOnBrowser === 1 ? 'is' : 'are'
  } still on this browser and ${TRIED_AGAIN}.`;
}

/**
 * Moves this browser's v3 work into the account at sign-in and publishes
 * the outcome as a notice. A failed request offers "Try again", which runs
 * the import again for whatever is still on this browser.
 */
export async function runSignInImport(options: ImportBrowserWorkOptions): Promise<void> {
  if (!hasBrowserWorkToImport()) {
    return;
  }
  const outcome = await importBrowserWork(options);
  const retry = () => {
    dismissAccountImportNotice();
    void runSignInImport(options);
  };
  publishNotice({
    kind: outcome.leftOnBrowser === 0 ? 'success' : outcome.requestFailed ? 'failure' : 'warning',
    message: importOutcomeMessage(outcome),
    retry: outcome.requestFailed ? retry : null,
  });
}
