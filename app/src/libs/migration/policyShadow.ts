import { createPolicyV2, type PolicyV2CreateRequest, type PolicyV2Response } from '@/api/v2';
import { fetchParametersByName, type V2ParameterData } from '@/api/v2/parameterTree';
import { fetchModelByCountry } from '@/api/v2/taxBenefitModels';
import {
  createUserPolicyAssociationV2,
  updateUserPolicyAssociationV2,
} from '@/api/v2/userPolicyAssociations';
import { FOREVER } from '@/constants';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { PolicyCreationPayload } from '@/types/payloads';
import { logMigrationComparison } from './comparisonLogger';
import { getMappedV2UserId, getOrCreateV2UserId, getV2Id, setV2Id } from './idMapping';
import { logMigrationConsole } from './migrationLogRuntime';
import { sendMigrationLog } from './migrationLogTransport';

type ComparableParameterValue = {
  parameterName: string;
  parameterId: string;
  value: unknown;
  startDate: string;
  endDate: string | null;
};

type ComparablePolicy = {
  id: string;
  countryId: string;
  label: string | null;
  parameters: ComparableParameterValue[];
};

type PolicyBuildResult = {
  payload: PolicyV2CreateRequest;
  comparablePolicy: ComparablePolicy;
};

interface ShadowUpdateUserPolicyAssociationOptions {
  countryId?: string;
  v1PolicyPayload?: PolicyCreationPayload;
}

function dateOnly(date: string): string {
  return date.split('T')[0];
}

function toApiDate(date: string): string {
  return date.includes('T') ? date : `${date}T00:00:00Z`;
}

function toComparableEndDate(date: string | null | undefined): string | null {
  if (!date || dateOnly(date) === FOREVER) {
    return null;
  }
  return dateOnly(date);
}

function toApiEndDate(date: string): string | null {
  return date === FOREVER ? null : toApiDate(date);
}

function parseDateRange(dateRange: string): { startDate: string; endDate: string } {
  const [startDate, endDate] = dateRange.split('.');
  if (!startDate || !endDate) {
    throw new Error(`Invalid policy date range "${dateRange}". Expected "YYYY-MM-DD.YYYY-MM-DD".`);
  }
  return { startDate, endDate };
}

function sortParameters(values: ComparableParameterValue[]): ComparableParameterValue[] {
  return [...values].sort((a, b) => {
    const nameOrder = a.parameterName.localeCompare(b.parameterName);
    if (nameOrder !== 0) {
      return nameOrder;
    }
    return a.startDate.localeCompare(b.startDate);
  });
}

function mapParametersByName(parameters: V2ParameterData[]): Map<string, V2ParameterData> {
  return new Map(parameters.map((parameter) => [parameter.name, parameter]));
}

function buildComparableV2Policy(v2Policy: PolicyV2Response, countryId: string): ComparablePolicy {
  return {
    id: v2Policy.id,
    countryId,
    label: v2Policy.name ?? null,
    parameters: sortParameters(
      v2Policy.parameter_values.map((value) => ({
        parameterName: value.parameter_name,
        parameterId: value.parameter_id,
        value: value.value_json,
        startDate: dateOnly(value.start_date),
        endDate: toComparableEndDate(value.end_date),
      }))
    ),
  };
}

function buildComparableUserPolicyAssociation(
  v1Association: UserPolicy,
  v2UserId: string,
  v2PolicyId: string
): UserPolicy {
  return {
    ...v1Association,
    userId: v2UserId,
    policyId: v2PolicyId,
  };
}

export async function buildV2PolicyCreateRequest(
  v1PolicyId: string,
  countryId: string,
  v1Payload: PolicyCreationPayload,
  label?: string | null
): Promise<PolicyBuildResult> {
  const modelInfo = await fetchModelByCountry(countryId);
  const parameterNames = Object.keys(v1Payload.data);
  const parameters = await fetchParametersByName(
    parameterNames,
    countryId,
    modelInfo.latest_version.id
  );
  const parameterByName = mapParametersByName(parameters);
  const missingParameters = parameterNames.filter((name) => !parameterByName.has(name));

  if (missingParameters.length > 0) {
    throw new Error(`Missing v2 parameter IDs for: ${missingParameters.join(', ')}`);
  }

  const parameterValues = Object.entries(v1Payload.data).flatMap(([parameterName, values]) =>
    Object.entries(values).map(([dateRange, value]) => {
      const parameter = parameterByName.get(parameterName);
      if (!parameter) {
        throw new Error(`Missing v2 parameter ID for: ${parameterName}`);
      }

      const { startDate, endDate } = parseDateRange(dateRange);
      return {
        parameter_id: parameter.id,
        value_json: value,
        start_date: toApiDate(startDate),
        end_date: toApiEndDate(endDate),
      };
    })
  );

  const comparableParameters = Object.entries(v1Payload.data).flatMap(([parameterName, values]) =>
    Object.entries(values).map(([dateRange, value]) => {
      const parameter = parameterByName.get(parameterName);
      if (!parameter) {
        throw new Error(`Missing v2 parameter ID for: ${parameterName}`);
      }

      const { startDate, endDate } = parseDateRange(dateRange);
      return {
        parameterName,
        parameterId: parameter.id,
        value,
        startDate,
        endDate: toComparableEndDate(endDate),
      };
    })
  );

  const policyName = label ?? v1Payload.label ?? 'Policy reform';

  return {
    payload: {
      name: policyName,
      description: null,
      tax_benefit_model_id: modelInfo.model.id,
      parameter_values: parameterValues,
    },
    comparablePolicy: {
      id: v1PolicyId,
      countryId,
      label: policyName,
      parameters: sortParameters(comparableParameters),
    },
  };
}

export async function shadowCreateUserPolicyAssociation(
  v1Association: UserPolicy,
  v2PolicyId = getV2Id('Policy', v1Association.policyId)
): Promise<void> {
  if (!v2PolicyId) {
    return;
  }

  try {
    const v2UserId = getOrCreateV2UserId(v1Association.userId);
    const v2Result = await createUserPolicyAssociationV2({
      userId: v2UserId,
      policyId: v2PolicyId,
      countryId: v1Association.countryId,
      label: v1Association.label,
    });

    if (v1Association.id && v2Result.id) {
      setV2Id('UserPolicy', v1Association.id, v2Result.id);
    }

    logMigrationComparison(
      'UserPolicyMigration',
      'CREATE',
      buildComparableUserPolicyAssociation(
        v1Association,
        v2UserId,
        v2PolicyId
      ) as unknown as Record<string, unknown>,
      v2Result as unknown as Record<string, unknown>,
      { skipFields: ['id', 'createdAt', 'updatedAt', 'isCreated'] }
    );
  } catch (error) {
    logMigrationConsole('[UserPolicyMigration] Shadow v2 create failed (non-blocking):', error);
    sendMigrationLog({
      kind: 'event',
      prefix: 'UserPolicyMigration',
      operation: 'CREATE',
      status: 'FAILED',
      message: 'Shadow v2 create failed (non-blocking)',
      metadata: {
        policyId: v1Association.policyId,
        userId: v1Association.userId,
        error: error instanceof Error ? error.message : String(error),
      },
      ts: new Date().toISOString(),
    });
  }
}

async function createAndMapV2Policy(args: {
  countryId: string;
  label?: string | null;
  v1PolicyId: string;
  v1PolicyPayload: PolicyCreationPayload;
}): Promise<PolicyV2Response> {
  const { payload, comparablePolicy } = await buildV2PolicyCreateRequest(
    args.v1PolicyId,
    args.countryId,
    args.v1PolicyPayload,
    args.label
  );
  const v2Policy = await createPolicyV2(payload);

  setV2Id('Policy', args.v1PolicyId, v2Policy.id);
  logMigrationComparison(
    'PolicyMigration',
    'CREATE',
    comparablePolicy as unknown as Record<string, unknown>,
    buildComparableV2Policy(v2Policy, args.countryId) as unknown as Record<string, unknown>,
    { skipFields: ['id'] }
  );

  return v2Policy;
}

async function resolveUpdatedV2PolicyId(
  v1Association: UserPolicy,
  options?: ShadowUpdateUserPolicyAssociationOptions
): Promise<string | undefined> {
  if (!options?.v1PolicyPayload) {
    return undefined;
  }

  const mappedPolicyId = getV2Id('Policy', v1Association.policyId);
  if (mappedPolicyId) {
    return mappedPolicyId;
  }

  if (!options.countryId) {
    return undefined;
  }

  const v2Policy = await createAndMapV2Policy({
    countryId: options.countryId,
    label: v1Association.label,
    v1PolicyId: v1Association.policyId,
    v1PolicyPayload: options.v1PolicyPayload,
  });

  return v2Policy.id;
}

export async function shadowUpdateUserPolicyAssociation(
  v1Association: UserPolicy,
  options?: ShadowUpdateUserPolicyAssociationOptions
): Promise<void> {
  if (!v1Association.id) {
    return;
  }

  const v2UserPolicyId = getV2Id('UserPolicy', v1Association.id);
  const v2UserId = getMappedV2UserId(v1Association.userId);

  if (!v2UserPolicyId || !v2UserId) {
    return;
  }

  try {
    const v2PolicyId = await resolveUpdatedV2PolicyId(v1Association, options);
    const v2Result = await updateUserPolicyAssociationV2(v2UserPolicyId, v2UserId, {
      ...(v2PolicyId ? { policy_id: v2PolicyId } : {}),
      label: v1Association.label ?? null,
    });

    logMigrationComparison(
      'UserPolicyMigration',
      'UPDATE',
      buildComparableUserPolicyAssociation(
        v1Association,
        v2UserId,
        v2PolicyId ?? v2Result.policyId
      ) as unknown as Record<string, unknown>,
      v2Result as unknown as Record<string, unknown>,
      { skipFields: ['id', 'createdAt', 'updatedAt', 'isCreated'] }
    );
  } catch (error) {
    logMigrationConsole('[UserPolicyMigration] Shadow v2 update failed (non-blocking):', error);
    sendMigrationLog({
      kind: 'event',
      prefix: 'UserPolicyMigration',
      operation: 'UPDATE',
      status: 'FAILED',
      message: 'Shadow v2 update failed (non-blocking)',
      metadata: {
        policyId: v1Association.policyId,
        userId: v1Association.userId,
        associationId: v1Association.id,
        error: error instanceof Error ? error.message : String(error),
      },
      ts: new Date().toISOString(),
    });
  }
}

export async function shadowCreatePolicyAndAssociation({
  countryId,
  label,
  v1PolicyId,
  v1PolicyPayload,
  v1Association,
}: {
  countryId: string;
  label?: string | null;
  v1PolicyId: string;
  v1PolicyPayload: PolicyCreationPayload;
  v1Association?: UserPolicy;
}): Promise<void> {
  try {
    const v2Policy = await createAndMapV2Policy({
      countryId,
      label,
      v1PolicyId,
      v1PolicyPayload,
    });

    if (v1Association) {
      await shadowCreateUserPolicyAssociation(v1Association, v2Policy.id);
    }
  } catch (error) {
    logMigrationConsole('[PolicyMigration] Shadow v2 policy create failed (non-blocking):', error);
    sendMigrationLog({
      kind: 'event',
      prefix: 'PolicyMigration',
      operation: 'CREATE',
      status: 'FAILED',
      message: 'Shadow v2 policy create failed (non-blocking)',
      metadata: {
        policyId: v1PolicyId,
        countryId,
        error: error instanceof Error ? error.message : String(error),
      },
      ts: new Date().toISOString(),
    });
  }
}
