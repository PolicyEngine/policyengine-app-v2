import {
  createPublicApiClient,
  publicApiCountryId,
  requireResult,
  type PublicApiClient,
} from '@/api/publicApi/client';
import type { components } from '@/api/publicApi/schema';
import type { MetadataApiPayload, MetadataRegionEntry } from '@/types/metadata';

/**
 * The v3 workspace's model metadata at start, from the Public API's
 * `GET /v2/model-catalog`: only the small parts of the current catalog
 * version (its PolicyEngine.py version, entities, basic inputs, regions,
 * years and datasets), in the shape `GET /{country}/metadata` returns, so
 * everything that reads the metadata store keeps working.
 *
 * Parameters and variables are not part of it. v3 loads them on demand
 * (the parameters of what is open, the parameter tree one level at a time,
 * and a search file in the background), so they start empty here. v1's
 * variable modules, modelled policies and SPM settings are not published
 * by v2 and stay empty too.
 */

type Schemas = components['schemas'];

type RegionOption = Schemas['MetadataRegionOption'];
type V1RegionType = MetadataRegionEntry['type'];

/** Region types v1 listed per country; v2 also lists places, which v3 never offered. */
const V1_REGION_TYPES: Record<string, readonly V1RegionType[]> = {
  us: ['national', 'state', 'congressional_district'],
  uk: ['national', 'country', 'constituency', 'local_authority'],
};

/** Whether v1 listed a region of this option's type, for a country offering `offered`. */
function offeredByV1(offered: readonly V1RegionType[]) {
  return (option: RegionOption): option is RegionOption & { type: V1RegionType } =>
    offered.some((type) => type === option.type);
}

function regionEntries(
  countryId: string,
  catalog: Schemas['MetadataModelCatalogResult']
): MetadataRegionEntry[] {
  const offered = V1_REGION_TYPES[countryId] ?? ['national'];
  const regionsByCode = new Map(catalog.regions.map((region) => [region.code, region]));
  return catalog.economy_options.region
    .filter(offeredByV1(offered))
    .map((option): MetadataRegionEntry => {
      const region = regionsByCode.get(option.name);
      return {
        name: option.name,
        label: option.label,
        type: option.type,
        // v1 gave the state only for congressional districts.
        ...(option.type === 'congressional_district' && region?.state_code
          ? { state_abbreviation: region.state_code, state_name: region.state_name ?? '' }
          : {}),
      };
    });
}

function entityCollection(
  entities: Schemas['MetadataEntity'][]
): Record<string, Schemas['MetadataEntity']> {
  return Object.fromEntries(
    entities.map((entity) => [
      entity.key,
      { key: entity.key, plural: entity.plural, is_person: entity.is_person },
    ])
  );
}

/** A country's model metadata at start, from the v2 routes, as a v1 metadata envelope. */
export async function fetchV2ModelCatalogMetadata(
  countryId: string,
  client: PublicApiClient = createPublicApiClient()
): Promise<MetadataApiPayload> {
  const catalog = await requireResult(
    client.GET('/v2/model-catalog', {
      params: { query: { country_id: publicApiCountryId(countryId) } },
    })
  );

  return {
    status: 'ok',
    message: null,
    result: {
      variables: {},
      parameters: {},
      entities: entityCollection(catalog.entities),
      variableModules: {},
      economy_options: {
        region: regionEntries(countryId, catalog),
        time_period: catalog.economy_options.time_period.map((period) => ({
          name: period.name,
          label: period.label,
        })),
        datasets: catalog.economy_options.datasets.map((dataset) => ({
          name: dataset.name,
          label: dataset.label,
          title: dataset.label,
          default: dataset.default,
        })),
      },
      current_law_id: catalog.model_version.current_law_id,
      basicInputs: catalog.basic_inputs,
      modelled_policies: { core: {}, filtered: {} },
      version: catalog.policyengine_version,
      v2Catalog: {
        policyengineVersion: catalog.policyengine_version,
        taxBenefitModelId: catalog.model.id,
      },
    },
  };
}
