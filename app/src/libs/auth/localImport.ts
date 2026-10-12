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
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import type { UserReport } from '@/types/ingredients/UserReport';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';
import {
  isAssociationCountry,
  type AssociationCountryId,
  type ImportHouseholdItem,
  type ImportPolicyItem,
  type ImportReportItem,
  type ImportRequestBody,
  type ImportSimulationItem,
  type ImportSkippedItem,
} from '@/types/v2User';
import {
  IMPORT_SKIPPED_KEY,
  IMPORTED_ID_MAP_KEY,
  readImportedIdMap,
  readImportSkipped,
  recordImportedIds,
  recordImportSkipped,
} from './importedIds';

/**
 * First-sign-in import: offers this browser's saved work (localStorage)
 * to the signed-in account via `POST /v2/me/imports`.
 *
 * - Only US and UK items can be saved to an account; others are reported
 *   and stay on this device.
 * - Reforms are materialized as v1 policies first (`POST /{c}/policy`).
 * - A flagship run left two local records for one v1 report (the `sur-`
 *   association and the `lfr-` record, plus its provenance stash); they
 *   import as one account row, and both local IDs map to it.
 * - Requests are per country and at most 500 items (and ~1 MB) each;
 *   policies go first so reports can reference reforms by `client_ref`.
 * - The returned id_map is kept per user, so old local links resolve;
 *   imported and skipped items are not offered again. Local data is
 *   never deleted.
 */

export const LOCAL_STORAGE_KEYS = {
  policies: 'user-policy-associations',
  households: 'user-population-households',
  simulations: 'user-simulation-associations',
  reports: 'user-report-associations',
  reforms: 'reforms',
  flagshipReports: FLAGSHIP_REPORTS_KEY,
  reportMeta: REPORT_META_KEY,
} as const;

export const IMPORT_DECLINED_KEY = 'pe-import-declined';

/** Server limits on one import request. */
export const IMPORT_MAX_ITEMS = 500;
/** Kept under the 1 MiB body cap to leave room for the envelope. */
export const IMPORT_MAX_BYTES = 950_000;

export type ImportKind = 'policies' | 'households' | 'simulations' | 'reports';

type ImportBody = ImportPolicyItem | ImportHouseholdItem | ImportSimulationItem | ImportReportItem;

export interface PlannedImportItem {
  kind: ImportKind;
  countryId: AssociationCountryId;
  clientRef: string;
  /** Other local IDs that become the same account row. */
  aliases: string[];
  body: ImportBody;
  /** Set for reforms that still need a v1 policy. */
  reform?: Reform;
}

export interface LocalItemNote {
  kind: ImportKind;
  clientRef: string;
  countryId: string;
  reason: string;
}

export interface LocalImportPlan {
  items: PlannedImportItem[];
  /** Countries without account storage (Canada, Nigeria, Israel). */
  unsupported: LocalItemNote[];
  /** Records that cannot be saved (no PolicyEngine API ID). */
  invalid: LocalItemNote[];
}

export interface LocalImportSummary {
  imported: number;
  skipped: ImportSkippedItem[];
  unsupported: LocalItemNote[];
  invalid: LocalItemNote[];
  failed: LocalItemNote[];
}

export interface LocalSnapshot {
  policies: UserPolicy[];
  households: UserHouseholdPopulation[];
  simulations: UserSimulation[];
  reports: UserReport[];
  reforms: Reform[];
  flagshipReports: FlagshipReportRecord[];
  reportMeta: Record<string, FlagshipReportMeta>;
}

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

export function readLocalSnapshot(): LocalSnapshot {
  return {
    policies: readArray(LOCAL_STORAGE_KEYS.policies),
    households: readArray(LOCAL_STORAGE_KEYS.households),
    simulations: readArray(LOCAL_STORAGE_KEYS.simulations),
    reports: readArray(LOCAL_STORAGE_KEYS.reports),
    reforms: readArray(LOCAL_STORAGE_KEYS.reforms),
    flagshipReports: readArray(LOCAL_STORAGE_KEYS.flagshipReports),
    reportMeta: readObject(LOCAL_STORAGE_KEYS.reportMeta),
  };
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

/** Builds the import plan for this browser's records, minus what was already handled. */
export function planLocalImport(
  userId: string,
  snapshot: LocalSnapshot = readLocalSnapshot()
): LocalImportPlan {
  const handled = new Set([
    ...Object.keys(readImportedIdMap(userId)),
    ...Object.keys(readImportSkipped(userId)),
  ]);
  const items: PlannedImportItem[] = [];
  const unsupported: LocalItemNote[] = [];
  const invalid: LocalItemNote[] = [];

  const consider = (
    kind: ImportKind,
    clientRef: unknown,
    countryId: unknown,
    legacyId: unknown,
    build: (country: AssociationCountryId, legacyId: number) => Omit<PlannedImportItem, 'kind'>,
    options: { needsLegacyId?: boolean } = {}
  ) => {
    if (typeof clientRef !== 'string' || !clientRef || handled.has(clientRef)) {
      return;
    }
    handled.add(clientRef);
    if (!isAssociationCountry(countryId)) {
      unsupported.push({
        kind,
        clientRef,
        countryId: String(countryId ?? ''),
        reason: 'country_not_supported',
      });
      return;
    }
    if ((options.needsLegacyId ?? true) && !isLegacyId(legacyId)) {
      invalid.push({ kind, clientRef, countryId, reason: 'no_api_id' });
      return;
    }
    items.push({ kind, ...build(countryId, Number(legacyId)) });
  };

  for (const policy of snapshot.policies) {
    consider('policies', policy.id, policy.countryId, policy.policyId, (countryId, id) => ({
      countryId,
      clientRef: policy.id!,
      aliases: [],
      body: {
        client_ref: policy.id!,
        legacy_policy_id: id,
        name: text(policy.label),
        description: null,
        baseline: null,
        provenance: null,
      },
    }));
  }

  for (const reform of snapshot.reforms) {
    consider(
      'policies',
      reform.id,
      reform.countryId,
      reform.policyId,
      (countryId) => ({
        countryId,
        clientRef: reform.id!,
        aliases: [],
        body: {
          client_ref: reform.id!,
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
        ...(isLegacyId(reform.policyId) ? {} : { reform }),
      }),
      { needsLegacyId: false }
    );
  }

  for (const household of snapshot.households) {
    consider(
      'households',
      household.id,
      household.countryId,
      household.householdId,
      (countryId, id) => ({
        countryId,
        clientRef: household.id!,
        aliases: [],
        body: {
          client_ref: household.id!,
          legacy_household_id: id,
          name: text(household.label),
          description: null,
        },
      })
    );
  }

  for (const simulation of snapshot.simulations) {
    consider(
      'simulations',
      simulation.id,
      simulation.countryId,
      simulation.simulationId,
      (countryId, id) => ({
        countryId,
        clientRef: simulation.id!,
        aliases: [],
        body: {
          client_ref: simulation.id!,
          legacy_simulation_id: id,
          name: text(simulation.label),
          description: null,
        },
      })
    );
  }

  const importedRefs = new Set(Object.keys(readImportedIdMap(userId)));
  const plannedPolicyRefs = new Set(
    items.filter((item) => item.kind === 'policies').map((item) => item.clientRef)
  );
  const reformRef = (reformId: unknown): string | null =>
    typeof reformId === 'string' && (plannedPolicyRefs.has(reformId) || importedRefs.has(reformId))
      ? reformId
      : null;

  // Flagship records by (country, v1 report), to fold into the run's association.
  const recordsByReport = new Map<string, FlagshipReportRecord[]>();
  for (const record of snapshot.flagshipReports) {
    const key = `${record.countryId}:${record.apiReportId}`;
    recordsByReport.set(key, [...(recordsByReport.get(key) ?? []), record]);
  }

  const reportBody = (
    clientRef: string,
    legacyId: number,
    label: string | null,
    meta: FlagshipReportMeta | undefined,
    record: FlagshipReportRecord | undefined
  ): ImportReportItem => {
    const provisions = record?.provisions?.length ? record.provisions : meta?.provisions;
    return {
      client_ref: clientRef,
      legacy_report_id: legacyId,
      name: text(record?.title) ?? text(meta?.title) ?? label,
      description: null,
      user_policy_client_ref: reformRef(record?.reformId),
      source_note: text(record?.sourceNote) ?? text(meta?.sourceNote),
      provisions: provisions?.length ? provisionsToWire(provisions) : null,
      validation: record?.validation ? validationToWire(record.validation) : null,
      last_run_at: null,
    };
  };

  for (const report of snapshot.reports) {
    const key = `${report.countryId}:${report.reportId}`;
    const record = recordsByReport.get(key)?.shift();
    consider('reports', report.id, report.countryId, report.reportId, (countryId, id) => {
      const aliases = record && !handled.has(record.id) ? [record.id] : [];
      aliases.forEach((alias) => handled.add(alias));
      return {
        countryId,
        clientRef: report.id,
        aliases,
        body: reportBody(
          report.id,
          id,
          text(report.label),
          snapshot.reportMeta[report.reportId],
          record
        ),
      };
    });
  }

  // Records with no local association of their own.
  for (const records of recordsByReport.values()) {
    for (const record of records) {
      consider('reports', record.id, record.countryId, record.apiReportId, (countryId, id) => ({
        countryId,
        clientRef: record.id,
        aliases: [],
        body: reportBody(record.id, id, null, snapshot.reportMeta[record.apiReportId], record),
      }));
    }
  }

  return { items, unsupported, invalid };
}

function byteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/**
 * Splits items into request bodies of at most `maxItems` items and about
 * `maxBytes`, keeping their order (policies before the reports that
 * reference them).
 */
export function chunkImportItems(
  items: PlannedImportItem[],
  { maxItems = IMPORT_MAX_ITEMS, maxBytes = IMPORT_MAX_BYTES } = {}
): PlannedImportItem[][] {
  const chunks: PlannedImportItem[][] = [];
  let current: PlannedImportItem[] = [];
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
  return chunks;
}

export function toImportRequestBody(items: PlannedImportItem[]): ImportRequestBody {
  const body: ImportRequestBody = {};
  for (const item of items) {
    const list = (body[item.kind] ??= []) as ImportBody[];
    list.push(item.body);
  }
  return body;
}

/** How many items this browser could still save to the account (US and UK). */
export function countImportableItems(userId: string): number {
  return planLocalImport(userId).items.length;
}

export function isImportDeclined(userId: string): boolean {
  try {
    const declined = JSON.parse(localStorage.getItem(IMPORT_DECLINED_KEY) ?? '{}');
    return Boolean(declined?.[userId]);
  } catch {
    return false;
  }
}

export function declineImport(userId: string): void {
  try {
    const declined = JSON.parse(localStorage.getItem(IMPORT_DECLINED_KEY) ?? '{}');
    localStorage.setItem(
      IMPORT_DECLINED_KEY,
      JSON.stringify({ ...declined, [userId]: new Date().toISOString() })
    );
  } catch {
    // Without storage the prompt simply returns next visit.
  }
}

export interface RunLocalImportOptions {
  client: V2UserClient;
  userId: string;
  /** Materializes a reform's parameters as a v1 policy (default: POST /{c}/policy). */
  materialize?: (reform: Reform) => Promise<number>;
  snapshot?: LocalSnapshot;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'request_failed';
}

export async function runLocalImport({
  client,
  userId,
  materialize = (reform) =>
    materializeReformPolicy(reform.countryId, reform.label, reform.parameters),
  snapshot,
}: RunLocalImportOptions): Promise<LocalImportSummary> {
  const plan = planLocalImport(userId, snapshot);
  const failed: LocalItemNote[] = [];
  const skipped: ImportSkippedItem[] = [];
  let imported = 0;

  // Reforms first need a v1 policy to point at.
  const failedRefs = new Set<string>();
  const ready: PlannedImportItem[] = [];
  for (const item of plan.items) {
    if (!item.reform) {
      ready.push(item);
      continue;
    }
    try {
      const policyId = await materialize(item.reform);
      ready.push({
        ...item,
        body: { ...(item.body as ImportPolicyItem), legacy_policy_id: policyId },
      });
    } catch (error) {
      failedRefs.add(item.clientRef);
      failed.push({
        kind: item.kind,
        clientRef: item.clientRef,
        countryId: item.countryId,
        reason: errorMessage(error),
      });
    }
  }
  // Reports keep their reform link only when the reform is going too.
  const items = ready.map((item) => {
    const body = item.body as ImportReportItem;
    return item.kind === 'reports' &&
      body.user_policy_client_ref &&
      failedRefs.has(body.user_policy_client_ref)
      ? { ...item, body: { ...body, user_policy_client_ref: null } }
      : item;
  });

  for (const countryId of ['us', 'uk'] as const) {
    const countryItems = items.filter((item) => item.countryId === countryId);
    const chunks = chunkImportItems(countryItems);
    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      try {
        const result = await importToAccount(client, countryId, toImportRequestBody(chunk));
        const idMap: Record<string, string> = { ...result.id_map };
        for (const item of chunk) {
          const uuid = idMap[item.clientRef];
          if (uuid) {
            item.aliases.forEach((alias) => {
              idMap[alias] = uuid;
            });
          }
        }
        recordImportedIds(userId, idMap);
        imported += chunk.filter((item) => result.id_map[item.clientRef]).length;

        const skippedMap: Record<string, string> = {};
        for (const entry of result.skipped ?? []) {
          // Items the server could not parse may come back without a client_ref.
          if (entry.client_ref === null) {
            continue;
          }
          skippedMap[entry.client_ref] = entry.reason;
          const item = chunk.find((candidate) => candidate.clientRef === entry.client_ref);
          item?.aliases.forEach((alias) => {
            skippedMap[alias] = entry.reason;
          });
        }
        recordImportSkipped(userId, skippedMap);
        skipped.push(...(result.skipped ?? []));
      } catch (error) {
        // Later chunks may reference this one; leave the rest for a retry
        // (imports are idempotent per client_ref).
        for (const item of chunks.slice(index).flat()) {
          failed.push({
            kind: item.kind,
            clientRef: item.clientRef,
            countryId: item.countryId,
            reason: errorMessage(error),
          });
        }
        break;
      }
    }
  }

  return {
    imported,
    skipped,
    unsupported: plan.unsupported,
    invalid: plan.invalid,
    failed,
  };
}

/** Forgets this browser's import bookkeeping for a user (after account deletion). */
export function forgetImportState(userId: string): void {
  for (const key of [IMPORTED_ID_MAP_KEY, IMPORT_SKIPPED_KEY, IMPORT_DECLINED_KEY]) {
    try {
      const all = JSON.parse(localStorage.getItem(key) ?? '{}');
      if (all && typeof all === 'object' && userId in all) {
        delete all[userId];
        localStorage.setItem(key, JSON.stringify(all));
      }
    } catch {
      // Nothing to forget.
    }
  }
}
