import {
  fetchVariables,
  fetchDatasets,
  fetchParameters,
  fetchModelVersion,
  fetchModelVersionId,
} from "@/api/v2";
import {
  getCacheMetadata,
  setCacheMetadata,
  clearAndLoadVariables,
  clearAndLoadDatasets,
  clearAndLoadParameters,
  getAllVariables,
  getAllDatasets,
  getAllParameters,
  type CacheMetadata,
  type Variable,
  type Dataset,
  type Parameter,
} from "@/storage";

export interface Metadata {
  variables: Variable[];
  datasets: Dataset[];
  parameters: Parameter[];
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
  const [variables, datasets, parameters] = await Promise.all([
    getAllVariables(),
    getAllDatasets(),
    getAllParameters(),
  ]);

  return {
    variables,
    datasets,
    parameters,
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
}> {
  const [variables, datasets, parameters] = await Promise.all([
    fetchVariables(countryId),
    fetchDatasets(countryId),
    fetchParameters(countryId),
  ]);

  return { variables, datasets, parameters };
}

/**
 * Store metadata in IndexedDB
 */
async function storeInCache(
  countryId: string,
  variables: Variable[],
  datasets: Dataset[],
  parameters: Parameter[],
  versionInfo: VersionInfo,
): Promise<void> {
  await Promise.all([
    clearAndLoadVariables(variables),
    clearAndLoadDatasets(datasets),
    clearAndLoadParameters(parameters),
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
 * Load all metadata (variables, datasets, parameters) for a country.
 * Uses IndexedDB cache with version-based invalidation.
 */
export async function loadMetadata(
  countryId: string,
): Promise<MetadataLoadResult> {
  const cached = await getCacheMetadata(countryId);
  const versionInfo = await fetchVersionInfo(countryId);

  if (isCacheValid(cached, versionInfo)) {
    const data = await loadFromCache(cached!);
    return { data, fromCache: true };
  }

  const { variables, datasets, parameters } =
    await fetchFreshMetadata(countryId);
  await storeInCache(
    countryId,
    variables,
    datasets,
    parameters,
    versionInfo,
  );

  return {
    data: { variables, datasets, parameters, ...versionInfo },
    fromCache: false,
  };
}

/**
 * Check if metadata is cached and valid for a country
 */
export async function isMetadataCached(
  countryId: string,
): Promise<boolean> {
  const cached = await getCacheMetadata(countryId);
  if (!cached?.loaded) return false;

  const versionInfo = await fetchVersionInfo(countryId);
  return isCacheValid(cached, versionInfo);
}
