import {
  db,
  Variable,
  Parameter,
  ParameterValue,
  MetadataDescription,
} from "./metadataDb";

/**
 * Bulk load variables, replacing any existing records
 */
export async function bulkLoadVariables(records: Variable[]): Promise<number> {
  if (records.length === 0) return 0;
  await db.variables.bulkPut(records);
  return records.length;
}

/**
 * Bulk load parameters, replacing any existing records
 */
export async function bulkLoadParameters(records: Parameter[]): Promise<number> {
  if (records.length === 0) return 0;
  await db.parameters.bulkPut(records);
  return records.length;
}

/**
 * Bulk load parameter values, replacing any existing records
 */
export async function bulkLoadParameterValues(
  records: ParameterValue[],
): Promise<number> {
  if (records.length === 0) return 0;
  await db.parameterValues.bulkPut(records);
  return records.length;
}

/**
 * Clear variables and load new records atomically
 */
export async function clearAndLoadVariables(
  records: Variable[],
): Promise<number> {
  await db.transaction("rw", db.variables, async () => {
    await db.variables.clear();
    await db.variables.bulkPut(records);
  });
  return records.length;
}

/**
 * Clear parameters and load new records atomically
 */
export async function clearAndLoadParameters(
  records: Parameter[],
): Promise<number> {
  await db.transaction("rw", db.parameters, async () => {
    await db.parameters.clear();
    await db.parameters.bulkPut(records);
  });
  return records.length;
}

/**
 * Clear parameter values and load new records atomically
 */
export async function clearAndLoadParameterValues(
  records: ParameterValue[],
): Promise<number> {
  await db.transaction("rw", db.parameterValues, async () => {
    await db.parameterValues.clear();
    await db.parameterValues.bulkPut(records);
  });
  return records.length;
}

/**
 * Get all variables for a specific version
 */
export async function getVariablesByVersion(
  versionId: string,
): Promise<Variable[]> {
  return db.variables.where("tax_benefit_model_version_id").equals(versionId).toArray();
}

/**
 * Get all parameters for a specific version
 */
export async function getParametersByVersion(
  versionId: string,
): Promise<Parameter[]> {
  return db.parameters.where("tax_benefit_model_version_id").equals(versionId).toArray();
}

/**
 * Get all parameter values for a specific parameter
 */
export async function getParameterValues(
  parameterId: string,
): Promise<ParameterValue[]> {
  return db.parameterValues.where("parameter_id").equals(parameterId).toArray();
}

/**
 * Get all variables
 */
export async function getAllVariables(): Promise<Variable[]> {
  return db.variables.toArray();
}

/**
 * Get all parameters
 */
export async function getAllParameters(): Promise<Parameter[]> {
  return db.parameters.toArray();
}

/**
 * Get all parameter values
 */
export async function getAllParameterValues(): Promise<ParameterValue[]> {
  return db.parameterValues.toArray();
}

/**
 * Get a single variable by name
 */
export async function getVariableByName(
  name: string,
): Promise<Variable | undefined> {
  return db.variables.where("name").equals(name).first();
}

/**
 * Get a single parameter by name
 */
export async function getParameterByName(
  name: string,
): Promise<Parameter | undefined> {
  return db.parameters.where("name").equals(name).first();
}

/**
 * Get metadata description for a country
 */
export async function getMetadataDescription(
  countryId: string,
): Promise<MetadataDescription | undefined> {
  return db.metadataDescriptions.get(countryId);
}

/**
 * Update metadata description for a country
 */
export async function setMetadataDescription(
  metadata: MetadataDescription,
): Promise<void> {
  await db.metadataDescriptions.put(metadata);
}

/**
 * Clear all data for a specific version
 */
export async function clearVersionData(versionId: string): Promise<void> {
  await db.transaction("rw", [db.variables, db.parameters], async () => {
    await db.variables.where("tax_benefit_model_version_id").equals(versionId).delete();
    await db.parameters.where("tax_benefit_model_version_id").equals(versionId).delete();
  });
}

/**
 * Clear all stores
 */
export async function clearAllStores(): Promise<void> {
  await db.transaction(
    "rw",
    [db.variables, db.parameters, db.parameterValues, db.metadataDescriptions],
    async () => {
      await db.variables.clear();
      await db.parameters.clear();
      await db.parameterValues.clear();
      await db.metadataDescriptions.clear();
    },
  );
}

/**
 * Get record counts for all stores
 */
export async function getStoreCounts(): Promise<{
  variables: number;
  parameters: number;
  parameterValues: number;
}> {
  const [variables, parameters, parameterValues] = await Promise.all([
    db.variables.count(),
    db.parameters.count(),
    db.parameterValues.count(),
  ]);
  return { variables, parameters, parameterValues };
}
