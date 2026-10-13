import { useSyncExternalStore } from 'react';
import {
  FLAGSHIP_REPORTS_KEY,
  provisionsToWire,
  type FlagshipReportRecord,
} from '@/api/flagshipReportStore';
import { materializeReformPolicy } from '@/api/reformStore';
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
 * The import at account creation: when a sign-in creates the PolicyEngine
 * account (`account_created` from `GET /v2/me`), the v3 reforms and
 * reports saved on this browser while signed out (US and UK) are copied
 * into it with `POST /v2/me/imports`. Only v3's own keys are read; the
 * browser copies stay for signed-out use. The server deduplicates by
 * `client_ref` (the browser ID), so running it again is safe.
 */

/** The v3 keys the import reads; v3 never reads the legacy calculator's keys. */
const REFORMS_KEY = 'reforms';

/** Server limits on one import request. */
export const IMPORT_MAX_ITEMS = 500;
/** Kept under the 1 MiB body cap to leave room for the envelope. */
export const IMPORT_MAX_BYTES = 950_000;

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
  | { kind: 'policies'; clientRef: string; body: ImportPolicyItem; reform?: Reform }
  | { kind: 'reports'; clientRef: string; body: ImportReportItem };

/** This browser's v3 reforms and reports, per account country. */
export function planBrowserWorkImport(): Record<AssociationCountryId, PlannedItem[]> {
  const reforms = readArray<Reform>(REFORMS_KEY);
  const records = readArray<FlagshipReportRecord>(FLAGSHIP_REPORTS_KEY);
  const meta = readObject<FlagshipReportMeta>(REPORT_META_KEY);
  const plan: Record<AssociationCountryId, PlannedItem[]> = { us: [], uk: [] };

  for (const reform of reforms) {
    if (!reform.id || !isAssociationCountry(reform.countryId)) {
      continue;
    }
    plan[reform.countryId].push({
      kind: 'policies',
      clientRef: reform.id,
      body: {
        client_ref: reform.id,
        legacy_policy_id: isLegacyId(reform.policyId) ? Number(reform.policyId) : 0,
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
      // Reforms without a v1 policy get one before the import.
      ...(isLegacyId(reform.policyId) ? {} : { reform }),
    });
  }

  for (const record of records) {
    if (!record.id || !isAssociationCountry(record.countryId) || !isLegacyId(record.apiReportId)) {
      continue;
    }
    const runMeta = meta[record.apiReportId];
    const provisions = record.provisions?.length ? record.provisions : runMeta?.provisions;
    const reformImported = plan[record.countryId].some(
      (item) => item.kind === 'policies' && item.clientRef === record.reformId
    );
    plan[record.countryId].push({
      kind: 'reports',
      clientRef: record.id,
      body: {
        client_ref: record.id,
        legacy_report_id: Number(record.apiReportId),
        name: text(record.title) ?? text(runMeta?.title),
        description: null,
        // Linked to its reform by the reform's browser ID (its client_ref).
        user_policy_client_ref: reformImported ? (record.reformId ?? null) : null,
        source_note: text(record.sourceNote) ?? text(runMeta?.sourceNote),
        provisions: provisions?.length ? provisionsToWire(provisions) : null,
        validation: record.validation ? validationToWire(record.validation) : null,
        last_run_at: null,
      },
    });
  }
  return plan;
}

function byteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/** Request bodies of at most `maxItems` items and about `maxBytes`, reforms first. */
export function chunkImportItems(
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

export interface BrowserWorkImportOutcome {
  reformsAdded: number;
  reportsAdded: number;
  /** Items that were not added (the server skipped them, or a reform had no v1 policy). */
  notAdded: number;
}

export interface ImportBrowserWorkOptions {
  client: V2UserClient;
  /** Materializes a reform's parameters as a v1 policy (default: POST /{c}/policy). */
  materialize?: (reform: Reform) => Promise<number>;
}

/**
 * Copies this browser's signed-out v3 work into the account. Rejects when
 * a request fails; nothing is removed from this browser either way.
 */
export async function importBrowserWork({
  client,
  materialize = (reform) =>
    materializeReformPolicy(reform.countryId, reform.label, reform.parameters),
}: ImportBrowserWorkOptions): Promise<BrowserWorkImportOutcome> {
  const outcome: BrowserWorkImportOutcome = { reformsAdded: 0, reportsAdded: 0, notAdded: 0 };
  const plan = planBrowserWorkImport();

  for (const countryId of ASSOCIATION_COUNTRY_IDS) {
    const ready: PlannedItem[] = [];
    const unmaterialized = new Set<string>();
    for (const item of plan[countryId]) {
      if (item.kind === 'policies' && item.reform) {
        try {
          const policyId = await materialize(item.reform);
          ready.push({ ...item, body: { ...item.body, legacy_policy_id: policyId } });
        } catch {
          unmaterialized.add(item.clientRef);
          outcome.notAdded += 1;
        }
        continue;
      }
      ready.push(item);
    }
    // A report keeps its reform link only when the reform is going too.
    const items = ready.map((item) =>
      item.kind === 'reports' &&
      item.body.user_policy_client_ref &&
      unmaterialized.has(item.body.user_policy_client_ref)
        ? { ...item, body: { ...item.body, user_policy_client_ref: null } }
        : item
    );

    for (const body of chunkImportItems(items)) {
      const result = await importToAccount(client, countryId, body);
      const added = (refs: Array<{ client_ref: string }> | undefined) =>
        (refs ?? []).filter((item) => result.id_map[item.client_ref]).length;
      const reformsAdded = added(body.policies);
      const reportsAdded = added(body.reports);
      outcome.reformsAdded += reformsAdded;
      outcome.reportsAdded += reportsAdded;
      outcome.notAdded +=
        (body.policies?.length ?? 0) + (body.reports?.length ?? 0) - reformsAdded - reportsAdded;
    }
  }
  return outcome;
}

/** Whether this browser holds any v3 work the import would copy. */
export function hasBrowserWorkToImport(): boolean {
  const plan = planBrowserWorkImport();
  return ASSOCIATION_COUNTRY_IDS.some((countryId) => plan[countryId].length > 0);
}

/* The notice shown after the import, which outlives the callback page. */

export interface AccountImportNotice {
  kind: 'success' | 'failure';
  message: string;
  /** Runs the import again; present after a failure. */
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

/** "Added N reforms and M reports saved on this browser to your account." */
export function importSuccessMessage(outcome: BrowserWorkImportOutcome): string {
  const added = `Added ${count(outcome.reformsAdded, 'reform')} and ${count(
    outcome.reportsAdded,
    'report'
  )} saved on this browser to your account.`;
  return outcome.notAdded > 0
    ? `${added} ${count(outcome.notAdded, 'item')} could not be added and ${
        outcome.notAdded === 1 ? 'is' : 'are'
      } still on this browser.`
    : added;
}

export const IMPORT_FAILURE_MESSAGE =
  'Your reforms and reports saved on this browser could not be added to your account. They are still on this browser.';

/**
 * Imports this browser's v3 work into a new account and publishes the
 * outcome as a notice. A failure offers "Try again", which runs the whole
 * import again.
 */
export async function runAccountCreationImport(options: ImportBrowserWorkOptions): Promise<void> {
  if (!hasBrowserWorkToImport()) {
    return;
  }
  const retry = () => {
    dismissAccountImportNotice();
    void runAccountCreationImport(options);
  };
  try {
    const outcome = await importBrowserWork(options);
    publishNotice({ kind: 'success', message: importSuccessMessage(outcome), retry: null });
  } catch {
    publishNotice({ kind: 'failure', message: IMPORT_FAILURE_MESSAGE, retry });
  }
}
