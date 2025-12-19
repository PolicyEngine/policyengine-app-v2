import {
  fetchParameters,
  fetchParameterValues,
  fetchModelVersion,
} from "@/api/v2";
import {
  getCacheMetadata,
  setCacheMetadata,
  clearAndLoadParameters,
  clearAndLoadParameterValues,
  getAllParameters,
  getAllParameterValues,
  type Parameter,
  type ParameterValue,
} from "@/storage";

export interface ParametersData {
  parameters: Parameter[];
  parameterValues: ParameterValue[];
}

export interface ParametersLoadResult {
  data: ParametersData;
  fromCache: boolean;
}

/**
 * Load parameters and parameter values for a country.
 * Uses IndexedDB cache with version-based invalidation.
 *
 * This is Tier 2 loading - only called when needed for policy editing.
 *
 * @param countryId - Country ID (e.g., 'us', 'uk')
 * @returns Parameters data and whether it came from cache
 */
export async function loadParameters(
  countryId: string,
): Promise<ParametersLoadResult> {
  // Check cached metadata
  const cached = await getCacheMetadata(countryId);

  // Fetch current version from API
  const remoteVersion = await fetchModelVersion(countryId);

  // Cache hit: version matches and parameters are loaded
  if (cached?.version === remoteVersion && cached.parametersLoaded) {
    const [parameters, parameterValues] = await Promise.all([
      getAllParameters(),
      getAllParameterValues(),
    ]);

    return {
      data: { parameters, parameterValues },
      fromCache: true,
    };
  }

  // Cache miss: fetch fresh data (parallel fetch)
  const [parameters, parameterValues] = await Promise.all([
    fetchParameters(countryId),
    fetchParameterValues(countryId),
  ]);

  // Store in IndexedDB (parallel writes)
  await Promise.all([
    clearAndLoadParameters(parameters),
    clearAndLoadParameterValues(parameterValues),
  ]);

  // Update cache metadata
  if (cached) {
    await setCacheMetadata({
      ...cached,
      parametersLoaded: true,
      timestamp: Date.now(),
    });
  } else {
    // Edge case: parameters loaded before core (shouldn't happen normally)
    await setCacheMetadata({
      countryId,
      version: remoteVersion,
      versionId: "",
      coreLoaded: false,
      parametersLoaded: true,
      timestamp: Date.now(),
    });
  }

  return {
    data: { parameters, parameterValues },
    fromCache: false,
  };
}

/**
 * Check if parameters are cached for a country
 */
export async function isParametersCached(countryId: string): Promise<boolean> {
  const cached = await getCacheMetadata(countryId);
  if (!cached?.parametersLoaded) return false;

  // Verify version is still current
  const remoteVersion = await fetchModelVersion(countryId);
  return cached.version === remoteVersion;
}
