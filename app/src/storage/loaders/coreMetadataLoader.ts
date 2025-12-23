import {
  fetchVariables,
  fetchDatasets,
  fetchParameters,
  fetchParameterValues,
  fetchModelVersion,
  fetchModelVersionId,
} from "@/api/v2";
import {
  getCacheMetadata,
  setCacheMetadata,
  clearAndLoadVariables,
  clearAndLoadDatasets,
  clearAndLoadParameters,
  clearAndLoadParameterValues,
  getAllVariables,
  getAllDatasets,
  getAllParameters,
  getAllParameterValues,
  type CacheMetadata,
  type Variable,
  type Dataset,
  type Parameter,
  type ParameterValue,
} from "@/storage";

export interface Metadata {
  variables: Variable[];
  datasets: Dataset[];
  parameters: Parameter[];
  parameterValues: ParameterValue[];
  version: string;
  versionId: string;
}

export interface MetadataLoadResult {
  data: Metadata;
  fromCache: boolean;
}


interface VersionInfo {
  version: string;
  versionId: string;
}

/**
 * Fetch version info from the API
 */
async function fetchVersionInfo(countryId: string): Promise<VersionInfo> {
  const [version, versionId] = await Promise.all([
    fetchModelVersion(countryId),
    fetchModelVersionId(countryId),
  ]);
  return { version, versionId };
}

/**
 * Check if cached metadata is still valid
 */
function isCacheValid(
  cached: CacheMetadata | undefined,
  remote: VersionInfo,
): boolean {
  return (
    cached !== undefined &&
    cached.loaded &&
    cached.version === remote.version &&
    cached.versionId === remote.versionId
  );
}

/**
 * Load metadata from IndexedDB cache
 */
async function loadFromCache(cached: CacheMetadata): Promise<Metadata> {
  const [variables, datasets, parameters, parameterValues] = await Promise.all([
    getAllVariables(),
    getAllDatasets(),
    getAllParameters(),
    getAllParameterValues(),
  ]);

  return {
    variables,
    datasets,
    parameters,
    parameterValues,
    version: cached.version,
    versionId: cached.versionId,
  };
}

/**
 * Fetch fresh metadata from the API
 */
async function fetchFreshMetadata(countryId: string): Promise<{
  variables: Variable[];
  datasets: Dataset[];
  parameters: Parameter[];
  parameterValues: ParameterValue[];
}> {
  const [variables, datasets, parameters, parameterValues] = await Promise.all([
    fetchVariables(countryId),
    fetchDatasets(countryId),
    fetchParameters(countryId),
    fetchParameterValues(countryId),
  ]);
  return { variables, datasets, parameters, parameterValues };
}

/**
 * Store metadata in IndexedDB
 */
async function storeInCache(
  countryId: string,
  variables: Variable[],
  datasets: Dataset[],
  parameters: Parameter[],
  parameterValues: ParameterValue[],
  versionInfo: VersionInfo,
): Promise<void> {
  await Promise.all([
    clearAndLoadVariables(variables),
    clearAndLoadDatasets(datasets),
    clearAndLoadParameters(parameters),
    clearAndLoadParameterValues(parameterValues),
  ]);

  await setCacheMetadata({
    countryId,
    version: versionInfo.version,
    versionId: versionInfo.versionId,
    loaded: true,
    timestamp: Date.now(),
  });
}

/**
 * Load all metadata (variables, datasets, parameters, parameterValues) for a country.
 * Uses IndexedDB cache with version-based invalidation.
 */
export async function loadCoreMetadata(
  countryId: string,
): Promise<MetadataLoadResult> {
  const cached = await getCacheMetadata(countryId);
  const versionInfo = await fetchVersionInfo(countryId);

  if (isCacheValid(cached, versionInfo)) {
    const data = await loadFromCache(cached!);
    return { data, fromCache: true };
  }

  const { variables, datasets, parameters, parameterValues } =
    await fetchFreshMetadata(countryId);
  await storeInCache(
    countryId,
    variables,
    datasets,
    parameters,
    parameterValues,
    versionInfo,
  );

  return {
    data: { variables, datasets, parameters, parameterValues, ...versionInfo },
    fromCache: false,
  };
}

/**
 * Check if metadata is cached and valid for a country
 */
export async function isCoreMetadataCached(
  countryId: string,
): Promise<boolean> {
  const cached = await getCacheMetadata(countryId);
  if (!cached?.loaded) return false;

  const versionInfo = await fetchVersionInfo(countryId);
  return isCacheValid(cached, versionInfo);
}
