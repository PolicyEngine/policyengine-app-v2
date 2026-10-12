import { convertDateRangeMapToValueIntervals } from '@/adapters/conversionHelpers';
import { fetchPolicyById } from '@/api/policy';
import {
  accountAssociationId,
  AccountAssociationRoutes,
  isLegacyId,
  type ApiStoreContext,
} from '@/api/v2Associations';
import { V2ApiError } from '@/api/v2UserClient';
import { createReformPolicy } from '@/libs/flagship/runReport';
import { Reform, ReformBaseline, ReformProvenance } from '@/types/ingredients/Reform';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { PolicyMetadataParams } from '@/types/metadata/policyMetadata';
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
 * Signed out (and outside the US and UK) reforms live in localStorage.
 * Signed in, a reform is a row in the account's `/v2/user-policies`: its
 * parameters are materialized as a v1 policy (`POST /{country}/policy`,
 * which dedupes identical ones), and the row carries the policy ID, the
 * name, the baseline, and the provenance.
 */
export interface ReformStore {
  create: (reform: Omit<Reform, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Reform>;
  findByUser: (userId: string, countryId?: string) => Promise<Reform[]>;
  findById: (reformId: string) => Promise<Reform | null>;
  update: (
    reformId: string,
    updates: Partial<Omit<Reform, 'id' | 'userId' | 'countryId' | 'createdAt' | 'updatedAt'>>
  ) => Promise<Reform>;
  delete: (reformId: string) => Promise<void>;
}

export type ReformUpdates = Partial<
  Omit<Reform, 'id' | 'userId' | 'countryId' | 'createdAt' | 'updatedAt'>
>;

export class LocalStorageReformStore implements ReformStore {
  private readonly STORAGE_KEY = 'reforms';

  async create(reform: Omit<Reform, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reform> {
    // Generate a unique ID for local storage
    // Format: "rf-[short-timestamp][random]"
    // Use base36 encoding for compactness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const uniqueId = `rf-${timestamp}${random}`;

    const now = new Date().toISOString();
    const newReform: Reform = {
      ...reform,
      id: uniqueId,
      createdAt: now,
      updatedAt: now,
    };

    this.setStoredReforms([...this.getStoredReforms(), newReform]);
    return newReform;
  }

  async findByUser(userId: string, countryId?: string): Promise<Reform[]> {
    return this.getStoredReforms().filter(
      (r) => r.userId === userId && (!countryId || r.countryId === countryId)
    );
  }

  async findById(reformId: string): Promise<Reform | null> {
    return this.getStoredReforms().find((r) => r.id === reformId) || null;
  }

  async update(reformId: string, updates: ReformUpdates): Promise<Reform> {
    const reforms = this.getStoredReforms();
    const index = reforms.findIndex((r) => r.id === reformId);

    if (index === -1) {
      throw new Error('Failed to update reform');
    }

    const updated: Reform = {
      ...reforms[index],
      ...updates,
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

export interface ApiReformStoreOptions {
  /** Current parameter metadata, for coercing values read back from v1 policies. */
  getParameterMetadata?: () => ParameterMetadataCollection | null | undefined;
  /** Materializes parameters as a v1 policy; returns its ID. */
  materializePolicy?: (
    countryId: string,
    label: string | null | undefined,
    parameters: Parameter[]
  ) => Promise<number>;
  /** Reads a v1 policy's parameter map. */
  fetchPolicyJson?: (countryId: string, policyId: string) => Promise<PolicyMetadataParams>;
}

/** The v1 policy for a set of parameters, via the run bridge's policy creation. */
export function materializeReformPolicy(
  countryId: string,
  label: string | null | undefined,
  parameters: Parameter[]
): Promise<number> {
  return createReformPolicy(
    countryId as Reform['countryId'],
    label ?? '',
    parameters.map((parameter) => ({
      path: parameter.name,
      value: parameter.values[0]?.value,
      intervals: parameter.values,
    }))
  );
}

async function fetchV1PolicyJson(
  countryId: string,
  policyId: string
): Promise<PolicyMetadataParams> {
  return (await fetchPolicyById(countryId, policyId)).policy_json ?? {};
}

/**
 * Reforms in the account (`/v2/user-policies`). Parameter edits create a
 * new v1 policy and repoint the row (`legacy_policy_id`); a rename only
 * patches the name.
 */
export class ApiReformStore implements ReformStore {
  private readonly routes: AccountAssociationRoutes<UserPolicyItem>;
  private readonly getParameterMetadata: NonNullable<ApiReformStoreOptions['getParameterMetadata']>;
  private readonly materializePolicy: NonNullable<ApiReformStoreOptions['materializePolicy']>;
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

  async create(reform: Omit<Reform, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reform> {
    const legacyPolicyId = isLegacyId(reform.policyId)
      ? Number(reform.policyId)
      : await this.materializePolicy(this.context.countryId, reform.label, reform.parameters);
    const body: UserPolicyCreateBody = {
      country_id: this.context.countryId,
      legacy_policy_id: legacyPolicyId,
      ...(reform.label ? { name: reform.label } : {}),
      baseline: reform.baseline,
      provenance: provenanceToWire(reform.provenance),
    };
    const item = await this.routes.create(body);
    return this.toReform(item, reform.parameters);
  }

  async findByUser(_userId: string, countryId?: string): Promise<Reform[]> {
    if (countryId && countryId !== this.context.countryId) {
      return [];
    }
    const items = (await this.routes.list()).filter((item) => isLegacyId(item.legacy_policy_id));
    return Promise.all(items.map((item) => this.toReform(item)));
  }

  async findById(reformId: string): Promise<Reform | null> {
    const item = await this.routes.get(reformId);
    return item && isLegacyId(item.legacy_policy_id) ? this.toReform(item) : null;
  }

  async update(reformId: string, updates: ReformUpdates): Promise<Reform> {
    if (!accountAssociationId(this.context, reformId)) {
      return this.saveLocalReform(reformId, updates);
    }
    const body: UserPolicyPatchBody = {};
    if (updates.label !== undefined) {
      body.name = updates.label || null;
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
        updates.label,
        updates.parameters
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

  /**
   * A reform that exists only in this browser (a draft begun while signed
   * out, never imported): saving it while signed in adds it to the account.
   */
  private async saveLocalReform(reformId: string, updates: ReformUpdates): Promise<Reform> {
    const local = await new LocalStorageReformStore().findById(reformId);
    if (!local) {
      throw new V2ApiError(404, `Reform with id ${reformId} not found`);
    }
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...fields } = local;
    return this.create({
      ...fields,
      ...updates,
      userId: this.context.userId,
      policyId: updates.parameters ? null : fields.policyId,
    });
  }

  private async toReform(item: UserPolicyItem, knownParameters?: Parameter[]): Promise<Reform> {
    const policyId = String(item.legacy_policy_id);
    const parameters =
      knownParameters ??
      parametersFromPolicyJson(
        await this.fetchPolicyJson(item.country_id, policyId),
        this.getParameterMetadata()
      );
    return {
      id: item.id,
      userId: item.user_id,
      countryId: item.country_id,
      label: item.name ?? undefined,
      policyId,
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
  return account ? new ApiReformStore(account, options) : new LocalStorageReformStore();
}
