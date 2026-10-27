import {
  createPublicApiClient,
  publicApiCountryId,
  requireResult,
  type PublicApiClient,
} from '@/api/publicApi/client';
import { v1DatedValues } from '@/api/publicApi/datedValues';
import type { components } from '@/api/publicApi/schema';
import { v1FallbackLabel } from '@/libs/flagship/v2ParameterSearch';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

/**
 * Parameters fetched by name from the Public API's
 * `GET /v2/model-catalog/parameters`, with their current-law values and the
 * labels of every node above them (for breadcrumbs), in the shape v1's
 * metadata gave each parameter, so code that reads the metadata store
 * reads them unchanged.
 */

type Schemas = components['schemas'];

/** How many names one request takes (the route's own bound). */
export const CATALOG_PARAMETER_BATCH = 100;

export interface LoadedCatalogParameters {
  /** The parameters found, and every node above them. */
  parameters: ParameterMetadataCollection;
  /** Each found parameter's catalog ID, which `/v2/policies` takes. */
  parameterIds: Record<string, string>;
  /** Names the catalog version does not have. */
  missingNames: string[];
}

function addResult(
  loaded: LoadedCatalogParameters,
  result: Schemas['MetadataCatalogParametersResult']
): void {
  for (const [path, label] of Object.entries(result.node_labels)) {
    loaded.parameters[path] = {
      type: 'parameterNode',
      parameter: path,
      label: label ?? v1FallbackLabel(path),
    };
  }
  for (const parameter of result.parameters) {
    loaded.parameters[parameter.name] = {
      type: 'parameter',
      parameter: parameter.name,
      label: parameter.label ?? v1FallbackLabel(parameter.name),
      description: parameter.description,
      unit: parameter.unit,
      values: v1DatedValues(parameter.name, parameter.values),
      economy: parameter.economy ?? true,
      household: parameter.household ?? true,
    };
    loaded.parameterIds[parameter.name] = parameter.id;
  }
  loaded.missingNames.push(...result.missing_names);
}

/** The named parameters of a catalog version, in batches the route takes. */
export async function fetchCatalogParameters(
  countryId: string,
  policyengineVersion: string,
  names: readonly string[],
  client: PublicApiClient = createPublicApiClient()
): Promise<LoadedCatalogParameters> {
  const unique = [...new Set(names)].sort();
  const batches: string[][] = [];
  for (let start = 0; start < unique.length; start += CATALOG_PARAMETER_BATCH) {
    batches.push(unique.slice(start, start + CATALOG_PARAMETER_BATCH));
  }
  const results = await Promise.all(
    batches.map((batch) =>
      requireResult(
        client.GET('/v2/model-catalog/parameters', {
          params: {
            query: {
              country_id: publicApiCountryId(countryId),
              policyengine_version: policyengineVersion,
              name: batch,
            },
          },
        })
      )
    )
  );
  const loaded: LoadedCatalogParameters = { parameters: {}, parameterIds: {}, missingNames: [] };
  for (const result of results) {
    addResult(loaded, result);
  }
  return loaded;
}
