import {
  byRecentUpdate,
  materializeReformPolicy,
  newLocalReformId,
  type ApiReformStoreOptions,
  type MaterializeReformPolicy,
  type NewReform,
  type ReformStore,
  type ReformUpdates,
} from '@/api/reformStore';
import { isLegacyId } from '@/api/v2Associations';
import { isV2ApiError } from '@/api/v2UserClient';
import { sameReformParameters } from '@/libs/flagship/reformMatch';
import type { Reform } from '@/types/ingredients/Reform';

/**
 * A signed-in session's reform store that keeps saving while the account
 * is unavailable (policyengine-api#3977: `/v2/user-policies` answering 503).
 *
 * Every call goes to the account first. When the account is unavailable —
 * a 502, 503 or 504, or no answer at all — a save is kept on this device
 * instead, in a queue of the account's own (keyed by its ID, never an
 * email), and comes back marked `pendingSync`. Its parameters are still a
 * v1 policy (`POST /{country}/policy` does not depend on the account), so
 * a run works with it. Any other refusal (4xx: invalid, signed out,
 * forbidden) stays an error.
 *
 * Once the account answers again, the queue is added to it with the normal
 * create (or update) call: a reform the account already holds with the
 * same name and values is linked rather than created again, so a push that
 * is repeated, or a save whose answer was lost, never makes a copy. The
 * device ID then names the account's reform.
 */

/** HTTP statuses (0: no answer) that mean the account is unavailable, not that it refused. */
const UNAVAILABLE_STATUSES = new Set([0, 502, 503, 504]);

export function isAccountUnavailableError(error: unknown): boolean {
  return isV2ApiError(error) && UNAVAILABLE_STATUSES.has(error.status);
}

/** How often a pending queue is retried in the background. */
export const SYNC_INTERVAL_MS = 60 * 1000;

/** A reform kept on this device until it is added to the account. */
interface PendingReform extends Reform {
  id: string;
  pendingSync: true;
  /** 'create': a new reform under a device ID; 'update': changes to the account reform `id`. */
  syncAs: 'create' | 'update';
  /** For an update: the changed fields, sent as they were saved. */
  changes?: ReformUpdates;
  /** The account refused it (not unavailability): it stays here and is not retried. */
  syncRefused?: boolean;
}

interface QueueState {
  pending: PendingReform[];
  /** Device ID → the account reform it became, for links still holding the device ID. */
  synced: Record<string, string>;
}

/** A device ID that now names an account reform (the same for an update). */
export interface SyncedReform {
  deviceId: string;
  accountId: string;
}

export interface ResilientReformStoreOptions extends Pick<
  ApiReformStoreOptions,
  'materializePolicy' | 'getParameterMetadata'
> {
  /** Whose queue this is: the account's ID, never an email. */
  accountKey: string;
  /** The country the account store is called with; the queue syncs only its reforms. */
  countryId: Reform['countryId'];
  /** After a sync added reforms to the account. */
  onSynced?: (synced: SyncedReform[]) => void;
  now?: () => number;
}

// Shared by every store instance for an account, since each component
// builds its own: one sync runs at a time, and what the last call found.
const unavailableAccounts = new Set<string>();
const syncsInFlight = new Map<string, Promise<number>>();
const lastSyncAttempt = new Map<string, number>();
const knownReforms = new Map<string, Map<string, Reform>>();

/** Forgets the shared state (tests). */
export function resetReformSyncState(): void {
  unavailableAccounts.clear();
  syncsInFlight.clear();
  lastSyncAttempt.clear();
  knownReforms.clear();
}

const sameLabel = (a: string | null | undefined, b: string | null | undefined) =>
  (a ?? '').trim() === (b ?? '').trim();

/** The reform as the app reads it: without the queue's own fields. */
function toReform({
  syncAs: _as,
  changes: _changes,
  syncRefused: _refused,
  ...reform
}: PendingReform): Reform {
  return reform;
}

export class ResilientReformStore implements ReformStore {
  private readonly storageKey: string;
  private readonly accountKey: string;
  private readonly countryId: Reform['countryId'];
  private readonly materializePolicy: MaterializeReformPolicy;
  private readonly getParameterMetadata: NonNullable<ApiReformStoreOptions['getParameterMetadata']>;
  private readonly onSynced?: (synced: SyncedReform[]) => void;
  private readonly now: () => number;

  constructor(
    private readonly account: ReformStore,
    options: ResilientReformStoreOptions
  ) {
    this.accountKey = options.accountKey;
    this.storageKey = `reforms-pending-sync:${options.accountKey}`;
    this.countryId = options.countryId;
    this.materializePolicy = options.materializePolicy ?? materializeReformPolicy;
    this.getParameterMetadata = options.getParameterMetadata ?? (() => null);
    this.onSynced = options.onSynced;
    this.now = options.now ?? Date.now;
  }

  async create(reform: NewReform): Promise<Reform> {
    let created: Reform;
    try {
      created = await this.account.create(reform);
    } catch (error) {
      if (!isAccountUnavailableError(error)) {
        throw error;
      }
      this.markUnavailable();
      return this.keepNew(reform);
    }
    this.markAvailable([created]);
    void this.sync();
    return created;
  }

  async findMine(countryId?: string): Promise<Reform[]> {
    let reforms: Reform[];
    try {
      reforms = await this.account.findMine(countryId);
    } catch (error) {
      if (!isAccountUnavailableError(error)) {
        throw error;
      }
      this.markUnavailable();
      return byRecentUpdate(this.pendingIn(countryId).map(toReform));
    }
    this.markAvailable(reforms);
    void this.sync(reforms);
    return this.withPending(reforms, countryId);
  }

  async findById(reformId: string): Promise<Reform | null> {
    const id = this.resolve(reformId);
    const pending = this.pendingById(id);
    if (pending?.syncAs === 'create') {
      return toReform(pending);
    }
    let found: Reform | null;
    try {
      found = await this.account.findById(id);
    } catch (error) {
      if (pending && isAccountUnavailableError(error)) {
        this.markUnavailable();
        return toReform(pending);
      }
      throw error;
    }
    this.markAvailable(found ? [found] : []);
    void this.sync();
    return found && pending ? this.overlay(found, pending) : found;
  }

  async update(reformId: string, updates: ReformUpdates): Promise<Reform> {
    const id = this.resolve(reformId);
    const pending = this.pendingById(id);
    if (pending?.syncAs === 'create') {
      return this.keepChanges(pending, updates);
    }
    // Changes still waiting for this reform go with the new ones.
    const changes = { ...pending?.changes, ...updates };
    let updated: Reform;
    try {
      updated = await this.account.update(id, changes);
    } catch (error) {
      if (!isAccountUnavailableError(error)) {
        throw error;
      }
      this.markUnavailable();
      return this.keepUpdate(id, pending, updates);
    }
    if (pending) {
      this.settle(pending.id, id);
    }
    this.markAvailable([updated]);
    void this.sync();
    return updated;
  }

  async delete(reformId: string): Promise<void> {
    const id = this.resolve(reformId);
    const pending = this.pendingById(id);
    if (pending?.syncAs === 'create') {
      this.writeState({
        ...this.readState(),
        pending: this.readState().pending.filter((entry) => entry.id !== id),
      });
      return;
    }
    await this.account.delete(id);
    if (pending) {
      this.settle(pending.id, id);
    }
  }

  isAccountUnavailable(): boolean {
    return unavailableAccounts.has(this.accountKey);
  }

  /** Whether reforms wait on this device for the account (refused ones aside). */
  hasPendingSync(): boolean {
    return this.syncable().length > 0;
  }

  /**
   * Retries the queue when one is waiting and the last attempt was at
   * least `minGapMs` ago: the background's way in (focus, online, timer).
   */
  syncIfDue(minGapMs = SYNC_INTERVAL_MS): Promise<number> {
    if (!this.hasPendingSync()) {
      return Promise.resolve(0);
    }
    const last = lastSyncAttempt.get(this.accountKey);
    if (last !== undefined && this.now() - last < minGapMs) {
      return Promise.resolve(0);
    }
    return this.sync();
  }

  /**
   * Adds the queue to the account; answers how many reforms it added.
   * One push runs at a time per account. `accountReforms` is the
   * account's list when the caller has just read it.
   */
  sync(accountReforms?: Reform[]): Promise<number> {
    const running = syncsInFlight.get(this.accountKey);
    if (running) {
      return running;
    }
    if (!this.hasPendingSync()) {
      return Promise.resolve(0);
    }
    const push = this.push(accountReforms).finally(() => syncsInFlight.delete(this.accountKey));
    syncsInFlight.set(this.accountKey, push);
    return push;
  }

  private async push(accountReforms?: Reform[]): Promise<number> {
    lastSyncAttempt.set(this.accountKey, this.now());
    let known = accountReforms ? [...accountReforms] : null;
    const synced: SyncedReform[] = [];
    for (const entry of this.syncable()) {
      // Read again: a save on this device meanwhile may have changed the entry.
      const current = this.pendingById(entry.id);
      if (!current) {
        continue;
      }
      try {
        let accountId: string;
        if (current.syncAs === 'create') {
          known ??= await this.account.findMine(this.countryId);
          const match = known.find(
            (reform) =>
              !reform.parametersUnavailable &&
              sameLabel(reform.label, current.label) &&
              sameReformParameters(reform.parameters, current.parameters)
          );
          if (match?.id) {
            accountId = match.id;
          } else {
            const created = await this.account.create({
              countryId: current.countryId,
              label: current.label,
              policyId: current.policyId,
              parameters: current.parameters,
              baseline: current.baseline,
              provenance: current.provenance,
            });
            accountId = created.id!;
            known.push(created);
          }
        } else {
          await this.account.update(current.id, current.changes ?? {});
          accountId = current.id;
        }
        this.settle(current.id, accountId);
        synced.push({ deviceId: current.id, accountId });
      } catch (error) {
        if (isAccountUnavailableError(error)) {
          this.markUnavailable();
          break;
        }
        // Refused, not unavailable: kept here, and not sent again.
        this.writeState({
          ...this.readState(),
          pending: this.readState().pending.map((pending) =>
            pending.id === current.id ? { ...pending, syncRefused: true } : pending
          ),
        });
      }
    }
    if (synced.length > 0) {
      unavailableAccounts.delete(this.accountKey);
      this.onSynced?.(synced);
    }
    return synced.length;
  }

  /** A new reform kept on this device, its parameters still a v1 policy. */
  private async keepNew(reform: NewReform): Promise<Reform> {
    const policyId = isLegacyId(reform.policyId)
      ? String(reform.policyId)
      : String(await this.materialize(reform.countryId, reform.parameters));
    const now = new Date(this.now()).toISOString();
    const entry: PendingReform = {
      ...reform,
      policyId,
      id: newLocalReformId(),
      createdAt: now,
      updatedAt: now,
      pendingSync: true,
      syncAs: 'create',
    };
    this.put(entry);
    return toReform(entry);
  }

  /** Changes to a reform that is itself still on this device. */
  private async keepChanges(entry: PendingReform, updates: ReformUpdates): Promise<Reform> {
    const policyId =
      updates.parameters !== undefined
        ? String(await this.materialize(entry.countryId, updates.parameters))
        : (updates.policyId ?? entry.policyId);
    const next: PendingReform = {
      ...entry,
      ...updates,
      policyId,
      updatedAt: new Date(this.now()).toISOString(),
      pendingSync: true,
      // Changed now, so worth sending again.
      syncRefused: undefined,
    };
    this.put(next);
    return toReform(next);
  }

  /** Changes to an account reform, kept until the account takes them. */
  private async keepUpdate(
    id: string,
    pending: PendingReform | undefined,
    updates: ReformUpdates
  ): Promise<Reform> {
    const base = pending ?? knownReforms.get(this.accountKey)?.get(id);
    const countryId = base?.countryId ?? this.countryId;
    const policyId =
      updates.parameters !== undefined
        ? String(await this.materialize(countryId, updates.parameters))
        : (updates.policyId ?? base?.policyId ?? null);
    const parameters = updates.parameters ?? base?.parameters;
    const entry: PendingReform = {
      ...base,
      ...updates,
      id,
      countryId,
      policyId,
      parameters: parameters ?? [],
      ...(parameters === undefined ? { parametersUnavailable: true } : {}),
      baseline: updates.baseline ?? base?.baseline ?? 'current-law',
      provenance: updates.provenance ?? base?.provenance ?? { source: 'manual' },
      updatedAt: new Date(this.now()).toISOString(),
      pendingSync: true,
      syncAs: 'update',
      changes: { ...pending?.changes, ...updates },
    };
    this.put(entry);
    return toReform(entry);
  }

  /** The account's list with this device's reforms: changes laid over, new ones added. */
  private withPending(reforms: Reform[], countryId?: string): Reform[] {
    const pending = this.pendingIn(countryId);
    const updates = new Map(
      pending.filter((entry) => entry.syncAs === 'update').map((entry) => [entry.id, entry])
    );
    const merged = reforms.map((reform) => {
      const entry = reform.id ? updates.get(reform.id) : undefined;
      return entry ? this.overlay(reform, entry) : reform;
    });
    // One the account already holds (a save whose answer was lost) is listed once.
    const added = pending
      .filter((entry) => entry.syncAs === 'create')
      .filter(
        (entry) =>
          !reforms.some(
            (reform) =>
              sameLabel(reform.label, entry.label) &&
              sameReformParameters(reform.parameters, entry.parameters)
          )
      )
      .map(toReform);
    return byRecentUpdate([...merged, ...added]);
  }

  private overlay(reform: Reform, entry: PendingReform): Reform {
    const changes = entry.changes ?? {};
    return {
      ...reform,
      ...changes,
      policyId: changes.parameters !== undefined ? entry.policyId : reform.policyId,
      parametersUnavailable:
        changes.parameters !== undefined ? undefined : reform.parametersUnavailable,
      updatedAt: entry.updatedAt,
      pendingSync: true,
    };
  }

  private materialize(countryId: string, parameters: Reform['parameters']): Promise<number> {
    return this.materializePolicy(countryId, parameters, this.getParameterMetadata() ?? undefined);
  }

  private markUnavailable(): void {
    unavailableAccounts.add(this.accountKey);
  }

  private markAvailable(reforms: Reform[]): void {
    unavailableAccounts.delete(this.accountKey);
    const known = knownReforms.get(this.accountKey) ?? new Map<string, Reform>();
    reforms.forEach((reform) => reform.id && known.set(reform.id, reform));
    knownReforms.set(this.accountKey, known);
  }

  /** The ID a reform goes by now: a synced device ID names its account reform. */
  private resolve(reformId: string): string {
    return this.readState().synced[reformId] ?? reformId;
  }

  private pendingById(id: string): PendingReform | undefined {
    return this.readState().pending.find((entry) => entry.id === id);
  }

  private pendingIn(countryId?: string): PendingReform[] {
    return this.readState().pending.filter((entry) => !countryId || entry.countryId === countryId);
  }

  /** What the next push sends: this country's entries the account has not refused. */
  private syncable(): PendingReform[] {
    return this.pendingIn(this.countryId).filter((entry) => !entry.syncRefused);
  }

  private put(entry: PendingReform): void {
    const state = this.readState();
    this.writeState({
      ...state,
      pending: [...state.pending.filter((pending) => pending.id !== entry.id), entry],
    });
  }

  /** The entry is in the account now: out of the queue, its device ID kept as a link. */
  private settle(deviceId: string, accountId: string): void {
    const state = this.readState();
    this.writeState({
      pending: state.pending.filter((entry) => entry.id !== deviceId),
      synced: deviceId === accountId ? state.synced : { ...state.synced, [deviceId]: accountId },
    });
  }

  private readState(): QueueState {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.storageKey) ?? 'null');
      return {
        pending: Array.isArray(parsed?.pending) ? parsed.pending : [],
        synced:
          parsed?.synced && typeof parsed.synced === 'object' && !Array.isArray(parsed.synced)
            ? parsed.synced
            : {},
      };
    } catch {
      return { pending: [], synced: {} };
    }
  }

  private writeState(state: QueueState): void {
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }
}
