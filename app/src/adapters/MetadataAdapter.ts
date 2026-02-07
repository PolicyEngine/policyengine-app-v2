import {
  ParameterMetadata,
  V2DatasetMetadata,
  V2ParameterMetadata,
  V2ParameterValueMetadata,
  V2VariableMetadata,
  VariableMetadata,
} from '@/types/metadata';
import { ValuesList } from '@/types/subIngredients/valueInterval';

/**
 * Dataset type used in the frontend (simplified from V2DatasetMetadata)
 */
export interface DatasetEntry {
  name: string;
  label: string;
  title: string;
  default: boolean;
}

/**
 * Adapter for converting between V2 API metadata and internal formats
 */
export class MetadataAdapter {
  /**
   * Convert a single V2 variable to frontend VariableMetadata
   */
  static variableFromV2(v2: V2VariableMetadata): VariableMetadata {
    return {
      id: v2.id,
      name: v2.name,
      entity: v2.entity,
      description: v2.description,
      data_type: v2.data_type,
      possible_values: v2.possible_values,
      default_value: v2.default_value,
      tax_benefit_model_version_id: v2.tax_benefit_model_version_id,
      created_at: v2.created_at,
      // Auto-generate label from name (sentence case)
      // TODO: V2 API should provide labels like V1 API did
      label: v2.name.replace(/_/g, ' ').replace(/^./, (c: string) => c.toUpperCase()),
    };
  }

  /**
   * Convert V2 variables array to a keyed record
   */
  static variablesFromV2(variables: V2VariableMetadata[]): Record<string, VariableMetadata> {
    const record: Record<string, VariableMetadata> = {};
    for (const v of variables) {
      record[v.name] = MetadataAdapter.variableFromV2(v);
    }
    return record;
  }

  /**
   * Convert a single V2 parameter to frontend ParameterMetadata
   */
  static parameterFromV2(p: V2ParameterMetadata): ParameterMetadata {
    return {
      id: p.id,
      name: p.name,
      label: p.label,
      description: p.description,
      unit: p.unit,
      data_type: p.data_type,
      tax_benefit_model_version_id: p.tax_benefit_model_version_id,
      created_at: p.created_at,
      parameter: p.name, // Use name as parameter path
      type: 'parameter',
      values: {}, // Parameter values are fetched on-demand
    };
  }

  /**
   * Convert V2 parameters array to a keyed record
   */
  static parametersFromV2(parameters: V2ParameterMetadata[]): Record<string, ParameterMetadata> {
    const record: Record<string, ParameterMetadata> = {};
    for (const p of parameters) {
      record[p.name] = MetadataAdapter.parameterFromV2(p);
    }
    return record;
  }

  /**
   * Convert a single V2 dataset to frontend DatasetEntry
   * @param d V2 dataset
   * @param isDefault Whether this is the default dataset
   */
  static datasetFromV2(d: V2DatasetMetadata, isDefault: boolean): DatasetEntry {
    return {
      name: d.name,
      label: d.name,
      title: d.description || d.name,
      default: isDefault,
    };
  }

  /**
   * Convert V2 datasets array to frontend format
   * First dataset is marked as default
   */
  static datasetsFromV2(datasets: V2DatasetMetadata[]): DatasetEntry[] {
    return datasets.map((d, i) => MetadataAdapter.datasetFromV2(d, i === 0));
  }

  /**
   * Convert V2 parameter values array to ValuesList format
   * ValuesList is a Record<startDate, value> used by the frontend
   * @param values Array of V2 parameter value records
   * @returns ValuesList format (e.g., { "2023-01-01": 100, "2024-01-01": 150 })
   */
  static parameterValuesFromV2(values: V2ParameterValueMetadata[]): ValuesList {
    const valuesList: ValuesList = {};
    for (const v of values) {
      // Convert ISO timestamp (e.g., "2025-01-01T00:00:00") to date string (e.g., "2025-01-01")
      const dateKey = v.start_date.split('T')[0];
      valuesList[dateKey] = v.value_json;
    }
    return valuesList;
  }
}
