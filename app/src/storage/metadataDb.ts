import Dexie, { type EntityTable } from "dexie";

/**
 * Variable record from V2 API
 */
export interface Variable {
  id: string;
  name: string;
  entity: string;
  description: string;
  data_type: string;
  possible_values: string[] | null;
  tax_benefit_model_version_id: string;
  created_at: string;
}

/**
 * Parameter record from V2 API
 */
export interface Parameter {
  id: string;
  name: string;
  label: string;
  description: string;
  data_type: string;
  unit: string | null;
  tax_benefit_model_version_id: string;
  created_at: string;
}

/**
 * Parameter value record from V2 API
 */
export interface ParameterValue {
  id: string;
  parameter_id: string;
  value_json: unknown;
  start_date: string;
  end_date: string;
  policy_id: string | null;
  dynamic_id: string | null;
  created_at: string;
}

/**
 * Dataset record from V2 API
 */
export interface Dataset {
  id: string;
  name: string;
  description: string;
  filepath: string;
  year: number;
  is_output_dataset: boolean;
  tax_benefit_model_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Metadata description for tracking loaded state per country
 */
export interface MetadataDescription {
  countryId: string;
  version: string;
  versionId: string;
  coreLoaded: boolean;
  parametersLoaded: boolean;
  timestamp: number;
}

/**
 * PolicyEngine metadata database using Dexie
 */
class PolicyEngineDatabase extends Dexie {
  variables!: EntityTable<Variable, "id">;
  parameters!: EntityTable<Parameter, "id">;
  parameterValues!: EntityTable<ParameterValue, "id">;
  datasets!: EntityTable<Dataset, "id">;
  metadataDescriptions!: EntityTable<MetadataDescription, "countryId">;

  constructor() {
    super("policyengine");

    this.version(1).stores({
      variables: "id, name, tax_benefit_model_version_id",
      parameters: "id, name, tax_benefit_model_version_id",
      parameterValues: "id, parameter_id",
      metadataDescriptions: "countryId",
    });

    this.version(2).stores({
      variables: "id, name, tax_benefit_model_version_id",
      parameters: "id, name, tax_benefit_model_version_id",
      parameterValues: "id, parameter_id",
      datasets: "id, name, tax_benefit_model_id",
      metadataDescriptions: "countryId",
    });
  }
}

const db = new PolicyEngineDatabase();

export { db };

/**
 * Close the database connection (internal use only)
 */
export async function _closeDb(): Promise<void> {
  db.close();
}

/**
 * Delete the entire database (internal use only)
 */
export async function _deleteDb(): Promise<void> {
  await db.delete();
}
