import {
  fetchVariables,
  fetchDatasets,
  fetchModelVersion,
  fetchModelVersionId,
} from "@/api/v2";
import {
  getMetadataDescription,
  setMetadataDescription,
  clearAndLoadVariables,
  clearAndLoadDatasets,
  getAllVariables,
  getAllDatasets,
  type MetadataDescription,
  type Variable,
  type Dataset,
} from "@/storage";

export interface CoreMetadata {
  variables: Variable[];
  datasets: Dataset[];
  version: string;
  versionId: string;
}

export interface CoreMetadataLoadResult {
  data: CoreMetadata;
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
  cached: MetadataDescription | undefined,
  remote: VersionInfo,
): boolean {
  return (
    cached !== undefined &&
    cached.coreLoaded &&
    cached.version === remote.version &&
    cached.versionId === remote.versionId
  );
}

/**
 * Load core metadata from IndexedDB cache
 */
async function loadFromCache(
  cached: MetadataDescription,
): Promise<CoreMetadata> {
  const [variables, datasets] = await Promise.all([
    getAllVariables(),
    getAllDatasets(),
  ]);

  return {
    variables,
    datasets,
    version: cached.version,
    versionId: cached.versionId,
  };
}

/**
 * Fetch fresh core metadata from the API
 */
async function fetchFreshMetadata(
  countryId: string,
): Promise<{ variables: Variable[]; datasets: Dataset[] }> {
  const [variables, datasets] = await Promise.all([
    fetchVariables(countryId),
    fetchDatasets(countryId),
  ]);
  return { variables, datasets };
}

/**
 * Store core metadata in IndexedDB
 */
async function storeInCache(
  countryId: string,
  variables: Variable[],
  datasets: Dataset[],
  versionInfo: VersionInfo,
  previousCache: MetadataDescription | undefined,
): Promise<void> {
  await Promise.all([
    clearAndLoadVariables(variables),
    clearAndLoadDatasets(datasets),
  ]);

  await setMetadataDescription({
    countryId,
    version: versionInfo.version,
    versionId: versionInfo.versionId,
    coreLoaded: true,
    parametersLoaded: previousCache?.parametersLoaded ?? false,
    timestamp: Date.now(),
  });
}

/**
 * Load core metadata (variables + datasets) for a country.
 * Uses IndexedDB cache with version-based invalidation.
 */
export async function loadCoreMetadata(
  countryId: string,
): Promise<CoreMetadataLoadResult> {
  const cached = await getMetadataDescription(countryId);
  const versionInfo = await fetchVersionInfo(countryId);

  if (isCacheValid(cached, versionInfo)) {
    const data = await loadFromCache(cached!);
    return { data, fromCache: true };
  }

  const { variables, datasets } = await fetchFreshMetadata(countryId);
  await storeInCache(countryId, variables, datasets, versionInfo, cached);

  return {
    data: { variables, datasets, ...versionInfo },
    fromCache: false,
  };
}

/**
 * Check if core metadata is cached and valid for a country
 */
export async function isCoreMetadataCached(
  countryId: string,
): Promise<boolean> {
  const cached = await getMetadataDescription(countryId);
  if (!cached?.coreLoaded) return false;

  const versionInfo = await fetchVersionInfo(countryId);
  return isCacheValid(cached, versionInfo);
}
