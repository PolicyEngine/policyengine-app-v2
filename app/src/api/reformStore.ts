import { convertDateRangeMapToValueIntervals } from '@/adapters/conversionHelpers';
import { fetchPolicyById } from '@/api/policy';
import {
  AccountAssociationRoutes,
  BrowserOnlyIdError,
  isAccountId,
  isLegacyId,
  type ApiStoreContext,
} from '@/api/v2Associations';
import { policyMissingParameters } from '@/libs/flagship/missingParameters';
import { createReformPolicy } from '@/libs/flagship/runReport';
import { clampStoreText } from '@/libs/flagship/storeText';
import { Reform, ReformBaseline, ReformProvenance } from '@/types/ingredients/Reform';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { PolicyMetadataParams, V1PolicyContent } from '@/types/metadata/policyMetadata';
import { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import type {
  ProvenanceWire,
  UserPolicyCreateBody,
  UserPolicyItem,
  UserPolicyPatchBody,
} from '@/types/v2User';

/**
 * Store for the flagship app's reform objects.
 *
 * Either way, saving a reform materializes its parameters as a v1 policy
 * (`POST /{country}/policy`, which dedupes identical ones), and a save
 * that cannot create the policy fails. Signed out (and outside the US and
 * UK) the reform, with its policy ID, lives in localStorage. Signed in, it
 * is a row in the account's `/v2/user-policies` carrying the policy ID,
 * the name, the baseline, and the provenance.
 */
export type NewReform = Omit<Reform, 'id' | 'createdAt' | 'updatedAt'>;
export type ReformUpdates = Partial<Omit<Reform, 'id' | 'countryId' | 'createdAt' | 'updatedAt'>>;

export interface ReformStore {
  create: (reform: NewReform) => Promise<Reform>;
  /** This session's reforms, most recently updated first. */
  findMine: (countryId?: string) => Promise<Reform[]>;
  findById: (reformId: string) => Promise<Reform | null>;
  update: (reformId: string, updates: ReformUpdates) => Promise<Reform>;
  delete: (reformId: string) => Promise<void>;
}

/** Most recently updated first. */
function byRecentUpdate(reforms: Reform[]): Reform[] {
  return [...reforms].sort((first, second) =>
    (second.updatedAt ?? second.createdAt ?? '').localeCompare(
      first.updatedAt ?? first.createdAt ?? ''
    )
  );
}

/** The reform is not in this store: deleted, or saved in the other sign-in state. */
export class ReformNotFoundError extends Error {
  constructor() {
    super('Failed to update reform');
    this.name = 'ReformNotFoundError';
  }
}

/** The reform with the parameters its v1 policy sets that the model no longer has, if any. */
function withMissingParameters(reform: Reform, policy: V1PolicyContent): Reform {
  const missingParameters = policyMissingParameters(policy);
  return missingParameters.length > 0 ? { ...reform, missingParameters } : reform;
}

/**
 * Reforms saved in this browser, each with the ID of its v1 policy. Given
 * `fetchPolicy`, listing them also reads each v1 policy, for the parameters
 * the model no longer has; a policy that cannot be read lists as saved.
 */
export class LocalStorageReformStore implements ReformStore {
  private readonly STORAGE_KEY = 'reforms';
  private readonly materializePolicy: MaterializeReformPolicy;
  private readonly getParameterMetadata: NonNullable<ApiReformStoreOptions['getParameterMetadata']>;
  private readonly fetchPolicy: ApiReformStoreOptions['fetchPolicy'];

  constructor(
    options: Pick<
      ApiReformStoreOptions,
      'materializePolicy' | 'getParameterMetadata' | 'fetchPolicy'
    > = {}
  ) {
    this.materializePolicy = options.materializePolicy ?? materializeReformPolicy;
    this.getParameterMetadata = options.getParameterMetadata ?? (() => null);
    this.fetchPolicy = options.fetchPolicy;
  }

  async create(reform: NewReform): Promise<Reform> {
    const policyId = isLegacyId(reform.policyId)
      ? String(reform.policyId)
      : String(
          await this.materializePolicy(
            reform.countryId,
            reform.parameters,
            this.getParameterMetadata() ?? undefined
          )
        );

    // Generate a unique ID for local storage
    // Format: "rf-[short-timestamp][random]"
    // Use base36 encoding for compactness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const uniqueId = `rf-${timestamp}${random}`;

    const now = new Date().toISOString();
    const newReform: Reform = {
      ...reform,
      policyId,
      id: uniqueId,
      createdAt: now,
      updatedAt: now,
    };

    this.setStoredReforms([...this.getStoredReforms(), newReform]);
    return newReform;
  }

  async findMine(countryId?: string): Promise<Reform[]> {
    const reforms = this.getStoredReforms().filter(
      (reform) => !countryId || reform.countryId === countryId
    );
    return byRecentUpdate(await Promise.all(reforms.map((reform) => this.checked(reform))));
  }

  /** The reform as its v1 policy stands now: unchanged when that cannot be read. */
  private async checked(reform: Reform): Promise<Reform> {
    if (!this.fetchPolicy || !isLegacyId(reform.policyId)) {
      return reform;
    }
    try {
      return withMissingParameters(
        reform,
        await this.fetchPolicy(reform.countryId, String(reform.policyId))
      );
    } catch {
      return reform;
    }
  }

  async findById(reformId: string): Promise<Reform | null> {
    return this.getStoredReforms().find((r) => r.id === reformId) || null;
  }

  async update(reformId: string, updates: ReformUpdates): Promise<Reform> {
    const existing = await this.findById(reformId);
    if (!existing) {
      throw new ReformNotFoundError();
    }
    // Changed parameters are a new v1 policy; a rename keeps the policy.
    const policyId =
      updates.parameters !== undefined
        ? String(
            await this.materializePolicy(
              existing.countryId,
              updates.parameters,
              this.getParameterMetadata() ?? undefined
            )
          )
        : (updates.policyId ?? existing.policyId);

    // Read again after the request, so a change made meanwhile is kept.
    const reforms = this.getStoredReforms();
    const index = reforms.findIndex((r) => r.id === reformId);
    if (index === -1) {
      throw new ReformNotFoundError();
    }

    const updated: Reform = {
      ...reforms[index],
      ...updates,
      policyId,
      updatedAt: new Date().toISOString(),
    };
    reforms[index] = updated;
    this.setStoredReforms(reforms);
    return updated;
  }

  async delete(reformId: string): Promise<void> {
    this.setStoredReforms(this.getStoredReforms().filter((r) => r.id !== reformId));
  }

  private getStoredReforms(): Reform[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private setStoredReforms(reforms: Reform[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reforms));
  }
}

/** A v1 policy's date-range map back to dated values, without metadata coercion. */
function rawIntervals(dateValueMap: Record<string, unknown>): ValueInterval[] {
  return Object.entries(dateValueMap).map(([dateRange, value]) => {
    const [startDate, endDate] = dateRange.split('.');
    return { startDate, endDate, value: value as ValueInterval['value'] };
  });
}

/**
 * A v1 policy's `policy_json` as reform parameters. Uses the app's
 * policy → parameter conversion (with value coercion) when the parameter's
 * metadata is loaded, and the stored values as-is otherwise.
 */
export function parametersFromPolicyJson(
  policyJson: PolicyMetadataParams,
  parameterMetadata?: ParameterMetadataCollection | null
): Parameter[] {
  return Object.entries(policyJson ?? {}).map(([name, dateValueMap]) => {
    let values: ValueInterval[];
    try {
      values = parameterMetadata?.[name]
        ? convertDateRangeMapToValueIntervals(name, dateValueMap, parameterMetadata)
        : rawIntervals(dateValueMap);
    } catch {
      values = rawIntervals(dateValueMap);
    }
    return { name, values };
  });
}

function provenanceToWire(provenance: ReformProvenance): ProvenanceWire {
  return {
    source: provenance.source,
    ref: provenance.ref ?? null,
    confidence: provenance.confidence ?? null,
  };
}

/**
 * Whether an account policy row is a v3 reform. Reforms always carry
 * provenance; policies saved from the legacy builder never do.
 */
function isAccountReform(item: UserPolicyItem): boolean {
  return isLegacyId(item.legacy_policy_id) && item.provenance !== null;
}

function provenanceFromWire(wire: ProvenanceWire | null): ReformProvenance {
  if (!wire) {
    return { source: 'manual' };
  }
  return {
    source: wire.source,
    ...(wire.ref ? { ref: wire.ref } : {}),
    ...(wire.confidence ? { confidence: wire.confidence } : {}),
  };
}

/** Materializes parameters as an unlabelled v1 policy; returns its ID. */
export type MaterializeReformPolicy = (
  countryId: string,
  parameters: Parameter[],
  /** The model's parameters, to type each value as a run types it. */
  metadata?: ParameterMetadataCollection
) => Promise<number>;

export interface ApiReformStoreOptions {
  /**
   * Current parameter metadata: it types the values a saved policy sends,
   * as a run sends them, and coerces values read back from v1 policies.
   */
  getParameterMetadata?: () => ParameterMetadataCollection | null | undefined;
  materializePolicy?: MaterializeReformPolicy;
  /** Reads a v1 policy's parameter map and the parameters the model no longer has. */
  fetchPolicy?: (countryId: string, policyId: string) => Promise<V1PolicyContent>;
}

/**
 * The v1 policy for a set of parameters, via the run bridge's policy
 * creation. The reform's name stays on its user record, never the policy.
 * With the metadata, each value is typed as a run types it ("15000" →
 * 15000, Infinity as the API spells it), so the saved policy and the
 * run's are the same one.
 */
export function materializeReformPolicy(
  countryId: string,
  parameters: Parameter[],
  metadata?: ParameterMetadataCollection
): Promise<number> {
  return createReformPolicy(
    countryId as Reform['countryId'],
    parameters.map((parameter) => ({
      path: parameter.name,
      value: parameter.values[0]?.value,
      intervals: parameter.values,
    })),
    metadata
  );
}

/**
 * A v1 policy's parameter map, and the parameters it sets that the current
 * model no longer has. v1 policies never change once created; the second
 * part changes only when the API's model does.
 */
export async function fetchV1PolicyContent(
  countryId: string,
  policyId: string
): Promise<V1PolicyContent> {
  const policy = await fetchPolicyById(countryId, policyId);
  return {
    policy_json: policy.policy_json ?? {},
    missing_parameters: policy.missing_parameters,
  };
}

/**
 * Reforms in the account (`/v2/user-policies`). Parameter edits create a
 * new v1 policy and repoint the row (`legacy_policy_id`); a rename only
 * patches the name. Only account IDs open: a reform saved in this browser
 * while signed out (`rf-…`) answers BrowserOnlyIdError.
 */
export class ApiReformStore implements ReformStore {
  private readonly routes: AccountAssociationRoutes<UserPolicyItem>;
  private readonly getParameterMetadata: NonNullable<ApiReformStoreOptions['getParameterMetadata']>;
  private readonly materializePolicy: MaterializeReformPolicy;
  private readonly fetchPolicy: NonNullable<ApiReformStoreOptions['fetchPolicy']>;

  constructor(
    private readonly context: ApiStoreContext,
    options: ApiReformStoreOptions = {}
  ) {
    this.routes = new AccountAssociationRoutes(context, 'user-policies', 'Reform');
    this.getParameterMetadata = options.getParameterMetadata ?? (() => null);
    this.materializePolicy = options.materializePolicy ?? materializeReformPolicy;
    this.fetchPolicy = options.fetchPolicy ?? fetchV1PolicyContent;
  }

  /** The row for a reform; its parameters become a v1 policy first when they are not one yet. */
  private async creationBody(reform: NewReform): Promise<UserPolicyCreateBody> {
    const countryId = this.routes.writeCountry(reform.countryId);
    const legacyPolicyId = isLegacyId(reform.policyId)
      ? Number(reform.policyId)
      : await this.materializePolicy(
          countryId,
          reform.parameters,
          this.getParameterMetadata() ?? undefined
        );
    return {
      country_id: countryId,
      legacy_policy_id: legacyPolicyId,
      ...(reform.label ? { name: clampStoreText(reform.label) } : {}),
      baseline: reform.baseline,
      provenance: provenanceToWire(reform.provenance),
    };
  }

  async create(reform: NewReform): Promise<Reform> {
    const item = await this.routes.create(await this.creationBody(reform));
    return this.toReform(item, reform.parameters);
  }

  async findMine(countryId?: string): Promise<Reform[]> {
    if (countryId && countryId !== this.context.countryId) {
      return [];
    }
    const items = (await this.routes.list()).filter(isAccountReform);
    // Each reform's changes come from its own v1 policy. One that fails to
    // load is listed without them (flagged), rather than failing the list.
    const loaded = await Promise.allSettled(items.map((item) => this.toReform(item)));
    return byRecentUpdate(
      loaded.map((outcome, index) =>
        outcome.status === 'fulfilled'
          ? outcome.value
          : { ...this.reformFromItem(items[index], []), parametersUnavailable: true }
      )
    );
  }

  async findById(reformId: string): Promise<Reform | null> {
    const item = await this.routes.get(reformId);
    return item && isAccountReform(item) ? this.toReform(item) : null;
  }

  async update(reformId: string, updates: ReformUpdates): Promise<Reform> {
    // Refuse a browser ID before creating a v1 policy for it.
    if (!isAccountId(reformId)) {
      throw new BrowserOnlyIdError();
    }
    const body: UserPolicyPatchBody = {};
    if (updates.label !== undefined) {
      body.name = clampStoreText(updates.label) || null;
    }
    if (updates.baseline !== undefined) {
      body.baseline = updates.baseline;
    }
    if (updates.provenance !== undefined) {
      body.provenance = provenanceToWire(updates.provenance);
    }
    if (updates.parameters !== undefined) {
      body.legacy_policy_id = await this.materializePolicy(
        this.context.countryId,
        updates.parameters,
        this.getParameterMetadata() ?? undefined
      );
    } else if (updates.policyId !== undefined && isLegacyId(updates.policyId)) {
      body.legacy_policy_id = Number(updates.policyId);
    }
    const item = await this.routes.patch(reformId, body);
    return this.toReform(item, updates.parameters);
  }

  delete(reformId: string): Promise<void> {
    return this.routes.delete(reformId);
  }

  private async toReform(item: UserPolicyItem, knownParameters?: Parameter[]): Promise<Reform> {
    if (knownParameters) {
      return this.reformFromItem(item, knownParameters);
    }
    const policy = await this.fetchPolicy(item.country_id, String(item.legacy_policy_id));
    return withMissingParameters(
      this.reformFromItem(
        item,
        parametersFromPolicyJson(policy.policy_json, this.getParameterMetadata())
      ),
      policy
    );
  }

  private reformFromItem(item: UserPolicyItem, parameters: Parameter[]): Reform {
    return {
      id: item.id,
      countryId: item.country_id,
      label: item.name ?? undefined,
      policyId: String(item.legacy_policy_id),
      parameters,
      baseline: (item.baseline ?? 'current-law') as ReformBaseline,
      provenance: provenanceFromWire(item.provenance),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }
}

/** The reform store for a session: the account's when given one, else localStorage. */
export function getReformStore(
  account?: ApiStoreContext | null,
  options?: ApiReformStoreOptions
): ReformStore {
  return account ? new ApiReformStore(account, options) : new LocalStorageReformStore(options);
}
