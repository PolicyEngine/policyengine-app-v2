import { Reform } from '@/types/ingredients/Reform';
import {
  ReformCreationMetadata,
  ReformMetadata,
  ReformParameterMetadata,
  ReformUpdateMetadata,
} from '@/types/metadata/reformMetadata';
import { Parameter } from '@/types/subIngredients/parameter';

/**
 * Adapter for converting between Reform and API formats
 */
export class ReformAdapter {
  private static parameterToMetadata(parameter: Parameter): ReformParameterMetadata {
    return {
      name: parameter.name,
      values: parameter.values.map((interval) => ({
        start_date: interval.startDate,
        end_date: interval.endDate,
        value: interval.value,
      })),
    };
  }

  private static parameterFromMetadata(metadata: ReformParameterMetadata): Parameter {
    return {
      name: metadata.name,
      values: metadata.values.map((interval) => ({
        startDate: interval.start_date,
        endDate: interval.end_date,
        value: interval.value,
      })),
    };
  }

  /**
   * Convert Reform to API creation payload
   * Handles camelCase to snake_case conversion
   */
  static toCreationPayload(
    reform: Omit<Reform, 'id' | 'createdAt' | 'updatedAt'>
  ): ReformCreationMetadata {
    return {
      user_id: String(reform.userId),
      country_id: reform.countryId,
      label: reform.label ?? null,
      policy_id: reform.policyId ?? null,
      parameters: reform.parameters.map(ReformAdapter.parameterToMetadata),
      baseline: reform.baseline,
      provenance: {
        source: reform.provenance.source,
        ref: reform.provenance.ref ?? null,
        confidence: reform.provenance.confidence ?? null,
      },
    };
  }

  /**
   * Convert partial Reform updates to API update payload
   */
  static toUpdatePayload(
    updates: Partial<Omit<Reform, 'id' | 'userId' | 'countryId' | 'createdAt' | 'updatedAt'>>
  ): ReformUpdateMetadata {
    const payload: ReformUpdateMetadata = {};
    if (updates.label !== undefined) {
      payload.label = updates.label;
    }
    if (updates.policyId !== undefined) {
      payload.policy_id = updates.policyId;
    }
    if (updates.parameters !== undefined) {
      payload.parameters = updates.parameters.map(ReformAdapter.parameterToMetadata);
    }
    if (updates.baseline !== undefined) {
      payload.baseline = updates.baseline;
    }
    if (updates.provenance !== undefined) {
      payload.provenance = {
        source: updates.provenance.source,
        ref: updates.provenance.ref ?? null,
        confidence: updates.provenance.confidence ?? null,
      };
    }
    return payload;
  }

  /**
   * Convert API response to Reform
   * Handles snake_case to camelCase conversion
   * Explicitly coerces IDs to strings to handle JSON.parse type mismatches
   */
  static fromApiResponse(apiData: ReformMetadata): Reform {
    return {
      id: String(apiData.id),
      userId: String(apiData.user_id),
      countryId: apiData.country_id,
      label: apiData.label ?? undefined,
      policyId: apiData.policy_id != null ? String(apiData.policy_id) : undefined,
      parameters: apiData.parameters.map(ReformAdapter.parameterFromMetadata),
      baseline: apiData.baseline,
      provenance: {
        source: apiData.provenance.source,
        ref: apiData.provenance.ref ?? undefined,
        confidence: apiData.provenance.confidence ?? undefined,
      },
      createdAt: apiData.created_at,
      updatedAt: apiData.updated_at,
    };
  }
}
