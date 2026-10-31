import { convertDateRangeMapToValueIntervals } from '@/adapters/conversionHelpers';
import { fetchPolicyById } from '@/api/policy';
import {
  createPublicApiClient,
  publicApiCountryId,
  requireResult,
  type PublicApiClient,
} from '@/api/publicApi/client';
import { finiteJsonValueForApi, parameterValueFromApi } from '@/api/publicApi/jsonValues';
import type { components } from '@/api/publicApi/schema';
import {
  AccountAssociationRoutes,
  BrowserOnlyIdError,
  isAccountId,
  isLegacyId,
  type ApiStoreContext,
} from '@/api/v2Associations';
import { FOREVER } from '@/constants';
import { createReformPolicy } from '@/libs/flagship/runReport';
import { clampStoreText } from '@/libs/flagship/storeText';
import { V3_API_ROUTES, type V3ApiRoutes } from '@/libs/flagship/v3ApiRoutes';
import { Reform, ReformBaseline, ReformProvenance } from '@/types/ingredients/Reform';
import type { V2CatalogReference } from '@/types/metadata';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { PolicyMetadataParams } from '@/types/metadata/policyMetadata';
import { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import type { ProvenanceWire, UserPolicyItem } from '@/types/v2User';
import { coercePolicyParameterValue, resolvePolicyParameterValueSpec } from '@/utils/valueCoercion';

/**
 * The `/v2/user-policies` bodies, as the Public API's OpenAPI document gives
 * them. The API refuses a row that names neither `policy_id` nor
 * `legacy_policy_id`.
 */
type UserPolicyCreateRequest = components['schemas']['UserPolicyCreateRequest'];
type UserPolicyPatchRequest = components['schemas']['UserPolicyPatchRequest'];

/**
 * Store for the flagship app's reform objects.
 *
 * Saving a reform first makes its parameters a policy, and a save that
 * cannot create the policy fails. Where saved work is in the browser
 * (sign-in not configured, or outside the US and UK) the reform, with the
 * ID of its v1 policy (`POST /{country}/policy`), lives in localStorage.
 * Where it is in the account, signed in or signed out, the reform is a row
 * in `/v2/user-policies` carrying the name, the baseline, the provenance
 * and the policy: a v1 policy (`legacy_policy_id`, ApiReformStore) before
 * the switch, and a `/v2/policies` policy (`policy_id`, ApiV2ReformStore)
 * after it. V3_API_ROUTES picks the account store. Both APIs deduplicate
 * identical policies.
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

/** Reforms saved in this browser, each with the ID of its v1 policy. */
export class LocalStorageReformStore implements ReformStore {
  private readonly STORAGE_KEY = 'reforms';
  private readonly materializePolicy: MaterializeReformPolicy;
  private readonly getParameterMetadata: NonNullable<ApiReformStoreOptions['getParameterMetadata']>;

  constructor(
    options: Pick<ApiReformStoreOptions, 'materializePolicy' | 'getParameterMetadata'> = {}
  ) {
    this.materializePolicy = options.materializePolicy ?? materializeReformPolicy;
    this.getParameterMetadata = options.getParameterMetadata ?? (() => null);
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
    return byRecentUpdate(
      this.getStoredReforms().filter((reform) => !countryId || reform.countryId === countryId)
    );
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
  /** Reads a v1 policy's parameter map. */
  fetchPolicyJson?: (countryId: string, policyId: string) => Promise<PolicyMetadataParams>;
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

/** A v1 policy's parameter map. v1 policies never change once created. */
export async function fetchV1PolicyJson(
  countryId: string,
  policyId: string
): Promise<PolicyMetadataParams> {
  return (await fetchPolicyById(countryId, policyId)).policy_json ?? {};
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
  private readonly fetchPolicyJson: NonNullable<ApiReformStoreOptions['fetchPolicyJson']>;

  constructor(
    private readonly context: ApiStoreContext,
    options: ApiReformStoreOptions = {}
  ) {
    this.routes = new AccountAssociationRoutes(context, 'user-policies', 'Reform');
    this.getParameterMetadata = options.getParameterMetadata ?? (() => null);
    this.materializePolicy = options.materializePolicy ?? materializeReformPolicy;
    this.fetchPolicyJson = options.fetchPolicyJson ?? fetchV1PolicyJson;
  }

  /** The row for a reform; its parameters become a v1 policy first when they are not one yet. */
  private async creationBody(reform: NewReform): Promise<UserPolicyCreateRequest> {
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
    const body: UserPolicyPatchRequest = {};
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
    const parameters =
      knownParameters ??
      parametersFromPolicyJson(
        await this.fetchPolicyJson(item.country_id, String(item.legacy_policy_id)),
        this.getParameterMetadata()
      );
    return this.reformFromItem(item, parameters);
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

/* Saved reforms on the v2 routes (V3_API_ROUTES 'v2'). */

type V2PolicyItem = components['schemas']['PolicyItem'];
type V2PolicyCreateBody = components['schemas']['PolicyCreateRequest'];

/** A v2 policy's JSON value: infinities as the API spells them (JSON has none). */
function v2PolicyValue(value: unknown): unknown {
  if (value === Infinity) {
    return 'Infinity';
  }
  if (value === -Infinity) {
    return '-Infinity';
  }
  return value;
}

/** A date as the UTC midnight the v2 API stores (v1 periods are whole days). */
function utcMidnight(date: string): string {
  return `${date}T00:00:00Z`;
}

/**
 * The `POST /v2/policies` body for a reform's parameters: each dated value
 * names its parameter's catalog UUID (`parameterIds`, from the parameters
 * loaded on demand), and is typed as a v1 run types it when the
 * parameter's metadata is loaded. Dates keep v1's whole-day periods
 * (including its 2100-12-31 "forever"), as the dual-write copies of v1
 * policies do, so identical changes deduplicate to one v2 policy.
 */
export function v2ReformPolicyBody(
  countryId: string,
  parameters: Parameter[],
  catalog: V2CatalogReference,
  parameterIds: Record<string, string>,
  metadata?: ParameterMetadataCollection
): V2PolicyCreateBody {
  return {
    country_id: publicApiCountryId(countryId),
    tax_benefit_model_id: catalog.taxBenefitModelId,
    parameter_values: parameters.flatMap((parameter) => {
      const parameterId = parameterIds[parameter.name];
      if (!parameterId) {
        throw new Error(
          `${parameter.name} is not a parameter of the PolicyEngine model ${catalog.policyengineVersion}`
        );
      }
      const valueSpec =
        metadata?.[parameter.name]?.type === 'parameter'
          ? resolvePolicyParameterValueSpec(parameter.name, metadata)
          : null;
      return parameter.values.map((interval) => ({
        parameter_id: parameterId,
        value: finiteJsonValueForApi(
          v2PolicyValue(
            valueSpec
              ? coercePolicyParameterValue(interval.value, valueSpec, parameter.name)
              : interval.value
          ),
          parameter.name
        ),
        start_date: utcMidnight(interval.startDate),
        end_date: utcMidnight(interval.endDate),
      }));
    }),
  };
}

/** Creates (or, as the API deduplicates, finds) a reform's v2 policy; returns its ID. */
export type CreateV2ReformPolicy = (
  countryId: string,
  parameters: Parameter[],
  catalog: V2CatalogReference,
  parameterIds: Record<string, string>,
  metadata?: ParameterMetadataCollection
) => Promise<string>;

export async function createV2ReformPolicy(
  countryId: string,
  parameters: Parameter[],
  catalog: V2CatalogReference,
  parameterIds: Record<string, string>,
  metadata?: ParameterMetadataCollection,
  client: PublicApiClient = createPublicApiClient()
): Promise<string> {
  const body = v2ReformPolicyBody(countryId, parameters, catalog, parameterIds, metadata);
  const result = await requireResult(
    client.POST('/v2/policies', {
      params: {
        query: {
          country_id: body.country_id,
          policyengine_version: catalog.policyengineVersion,
        },
      },
      body,
    })
  );
  return result.item.id;
}

/** A v2 policy. Policies never change, so callers may cache them. */
export async function fetchV2PolicyItem(
  countryId: string,
  policyId: string,
  client: PublicApiClient = createPublicApiClient()
): Promise<V2PolicyItem> {
  const result = await requireResult(
    client.GET('/v2/policies/{policy_id}', {
      params: {
        path: { policy_id: policyId },
        query: { country_id: publicApiCountryId(countryId) },
      },
    })
  );
  return result.item;
}

/** A v2 policy's values as reform parameters, each oldest first; an open end is v1's forever. */
export function parametersFromV2Policy(
  policy: Pick<V2PolicyItem, 'parameter_values'>
): Parameter[] {
  const byName = new Map<string, ValueInterval[]>();
  for (const parameterValue of policy.parameter_values) {
    const intervals = byName.get(parameterValue.parameter_name) ?? [];
    intervals.push({
      startDate: parameterValue.start_date.slice(0, 10),
      endDate: parameterValue.end_date ? parameterValue.end_date.slice(0, 10) : FOREVER,
      value: parameterValueFromApi(parameterValue.value, parameterValue.parameter_name),
    });
    byName.set(parameterValue.parameter_name, intervals);
  }
  return [...byName].map(([name, values]) => ({
    name,
    values: values.sort((first, second) => first.startDate.localeCompare(second.startDate)),
  }));
}

export interface ApiV2ReformStoreOptions extends ApiReformStoreOptions {
  /** The loaded v2 catalog version: its PolicyEngine.py version and model ID. */
  getV2Catalog?: () => V2CatalogReference | null | undefined;
  /**
   * The catalog IDs of the named parameters, loading any not loaded yet
   * (they come with each parameter loaded on demand); names the catalog
   * version does not have are left out.
   */
  resolveParameterIds?: (
    countryId: string,
    names: readonly string[]
  ) => Promise<Record<string, string>>;
  createV2Policy?: CreateV2ReformPolicy;
  /** Reads a v2 policy. */
  fetchV2Policy?: (countryId: string, policyId: string) => Promise<V2PolicyItem>;
}

/** The model catalog must be loaded from the v2 routes before a v2 policy can be made. */
export class V2CatalogUnavailableError extends Error {
  constructor() {
    super('The PolicyEngine model has not loaded yet, so this reform cannot be saved.');
    this.name = 'V2CatalogUnavailableError';
  }
}

/** Whether an account row is a v3 reform: reforms always carry provenance. */
function isV3Reform(item: UserPolicyItem): boolean {
  return item.provenance !== null && (item.policy_id !== null || isLegacyId(item.legacy_policy_id));
}

/**
 * Reforms in the account (`/v2/user-policies`) on v2 policies. A save makes
 * the parameters a `/v2/policies` policy and the row points at it with
 * `policy_id`; parameter edits make a new policy and repoint the row (the
 * API then clears any `legacy_policy_id`); a rename only patches the name.
 * Rows saved before the switch that hold only a v1 policy
 * (`legacy_policy_id`) still open: their parameters are read from
 * `GET /{country}/policy/{id}` until the one-time migration links them to
 * v2 policies.
 */
export class ApiV2ReformStore implements ReformStore {
  private readonly routes: AccountAssociationRoutes<UserPolicyItem>;
  private readonly getParameterMetadata: NonNullable<ApiReformStoreOptions['getParameterMetadata']>;
  private readonly getV2Catalog: NonNullable<ApiV2ReformStoreOptions['getV2Catalog']>;
  private readonly resolveParameterIds: NonNullable<ApiV2ReformStoreOptions['resolveParameterIds']>;
  private readonly createV2Policy: CreateV2ReformPolicy;
  private readonly fetchV2Policy: NonNullable<ApiV2ReformStoreOptions['fetchV2Policy']>;
  private readonly fetchPolicyJson: NonNullable<ApiReformStoreOptions['fetchPolicyJson']>;

  constructor(
    private readonly context: ApiStoreContext,
    options: ApiV2ReformStoreOptions = {}
  ) {
    this.routes = new AccountAssociationRoutes(context, 'user-policies', 'Reform');
    this.getParameterMetadata = options.getParameterMetadata ?? (() => null);
    this.getV2Catalog = options.getV2Catalog ?? (() => null);
    this.resolveParameterIds = options.resolveParameterIds ?? (async () => ({}));
    this.createV2Policy = options.createV2Policy ?? createV2ReformPolicy;
    this.fetchV2Policy = options.fetchV2Policy ?? fetchV2PolicyItem;
    this.fetchPolicyJson = options.fetchPolicyJson ?? fetchV1PolicyJson;
  }

  /** The v2 policy for a set of parameters, created for the loaded catalog version. */
  private async materialize(countryId: string, parameters: Parameter[]): Promise<string> {
    const catalog = this.getV2Catalog();
    if (!catalog) {
      throw new V2CatalogUnavailableError();
    }
    const parameterIds = await this.resolveParameterIds(
      countryId,
      parameters.map((parameter) => parameter.name)
    );
    return this.createV2Policy(
      countryId,
      parameters,
      catalog,
      parameterIds,
      this.getParameterMetadata() ?? undefined
    );
  }

  async create(reform: NewReform): Promise<Reform> {
    const countryId = this.routes.writeCountry(reform.countryId);
    const policyId = isAccountId(reform.v2PolicyId)
      ? reform.v2PolicyId
      : await this.materialize(countryId, reform.parameters);
    const item = await this.routes.create<UserPolicyCreateRequest>({
      country_id: countryId,
      policy_id: policyId,
      ...(reform.label ? { name: clampStoreText(reform.label) } : {}),
      baseline: reform.baseline,
      provenance: provenanceToWire(reform.provenance),
    });
    return this.reformFromItem(item, reform.parameters);
  }

  async findMine(countryId?: string): Promise<Reform[]> {
    if (countryId && countryId !== this.context.countryId) {
      return [];
    }
    const items = (await this.routes.list()).filter(isV3Reform);
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
    return item && isV3Reform(item) ? this.toReform(item) : null;
  }

  async update(reformId: string, updates: ReformUpdates): Promise<Reform> {
    // Refuse a browser ID before creating a policy for it.
    if (!isAccountId(reformId)) {
      throw new BrowserOnlyIdError();
    }
    const body: UserPolicyPatchRequest = {};
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
      body.policy_id = await this.materialize(this.context.countryId, updates.parameters);
    } else if (isAccountId(updates.v2PolicyId)) {
      body.policy_id = updates.v2PolicyId;
    }
    const item = await this.routes.patch(reformId, body);
    return updates.parameters !== undefined
      ? this.reformFromItem(item, updates.parameters)
      : this.toReform(item);
  }

  delete(reformId: string): Promise<void> {
    return this.routes.delete(reformId);
  }

  private async toReform(item: UserPolicyItem): Promise<Reform> {
    const parameters = item.policy_id
      ? parametersFromV2Policy(await this.fetchV2Policy(item.country_id, item.policy_id))
      : parametersFromPolicyJson(
          await this.fetchPolicyJson(item.country_id, String(item.legacy_policy_id)),
          this.getParameterMetadata()
        );
    return this.reformFromItem(item, parameters);
  }

  private reformFromItem(item: UserPolicyItem, parameters: Parameter[]): Reform {
    return {
      id: item.id,
      countryId: item.country_id,
      label: item.name ?? undefined,
      policyId: isLegacyId(item.legacy_policy_id) ? String(item.legacy_policy_id) : null,
      v2PolicyId: item.policy_id,
      parameters,
      baseline: (item.baseline ?? 'current-law') as ReformBaseline,
      provenance: provenanceFromWire(item.provenance),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }
}

/**
 * The reform store for a session: the account's when given one, else
 * localStorage. With an account, `routes` (V3_API_ROUTES unless a caller
 * says otherwise) picks v1 or v2 policies; reforms kept in this browser
 * make v1 policies either way.
 */
export function getReformStore(
  account?: ApiStoreContext | null,
  options?: ApiV2ReformStoreOptions,
  routes: V3ApiRoutes = V3_API_ROUTES
): ReformStore {
  if (!account) {
    return new LocalStorageReformStore(options);
  }
  return routes === 'v2'
    ? new ApiV2ReformStore(account, options)
    : new ApiReformStore(account, options);
}
