import { createPublicApiClient, requireResult, type PublicApiClient } from '@/api/publicApi/client';
import type { components } from '@/api/publicApi/schema';
import type { MetadataApiPayload, MetadataRegionEntry, V2CatalogReference } from '@/types/metadata';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { ValuesList } from '@/types/subIngredients/valueInterval';

/**
 * The v3 workspace's model metadata from the PolicyEngine API's v2 routes,
 * in the shape `GET /{country}/metadata` returns, so everything that reads
 * the metadata store works unchanged:
 *
 * 1. `GET /v2/tax-benefit-models/by-country/{country}` selects the catalog
 *    version (and gives entities, basic inputs, years and current law);
 * 2. `GET /v2/model-catalog` and `GET /v2/regions` read that exact version.
 *
 * v1 left out things v3 never reads (variable modules, modelled policies,
 * datasets) and the US SPM settings, which v2 does not publish; those come
 * back empty here.
 */

type Schemas = components['schemas'];

/** Region types v1 listed per country; v2 also has places, which v3 never offered. */
const V1_REGION_TYPES: Record<string, readonly string[]> = {
  us: ['national', 'state', 'congressional_district'],
  uk: ['national', 'country', 'constituency', 'local_authority'],
};

const REGION_PAGE_SIZE = 500;
/** A generous bound so a misbehaving server cannot loop forever. */
const MAXIMUM_REGION_PAGES = 20;

/** v1 metadata covered only the government parameter tree. */
function isGovernmentPath(path: string): boolean {
  return path.startsWith('gov');
}

/**
 * v1's label for a parameter or node without a label of its own: "bracket N"
 * for a bracket, otherwise the last path segment with spaces for underscores.
 */
function v1FallbackLabel(path: string): string {
  const bracket = /\[(\d+)\]$/.exec(path);
  if (bracket) {
    return `bracket ${Number(bracket[1]) + 1}`;
  }
  return (path.split('.').pop() ?? path).replaceAll('_', ' ');
}

function parameterCollection(
  catalog: Schemas['MetadataCatalogResult'],
  hasPresentationMetadata: boolean
): ParameterMetadataCollection {
  const parameters: ParameterMetadataCollection = {};
  for (const node of catalog.parameter_nodes) {
    if (!isGovernmentPath(node.name)) {
      continue;
    }
    parameters[node.name] = {
      type: 'parameterNode',
      parameter: node.name,
      label: node.label ?? v1FallbackLabel(node.name),
      description: node.description,
    };
  }
  for (const parameter of catalog.parameters) {
    if (!isGovernmentPath(parameter.name)) {
      continue;
    }
    // Before catalog format 2 there is no metadata label; PolicyEngine.py's
    // generated label is the closest stand-in.
    const ownLabel = hasPresentationMetadata ? parameter.metadata_label : parameter.label;
    parameters[parameter.name] = {
      type: 'parameter',
      parameter: parameter.name,
      label: ownLabel ?? v1FallbackLabel(parameter.name),
      description: parameter.description,
      unit: parameter.unit,
      period: parameter.period ?? null,
      values: parameter.values as ValuesList,
      economy: parameter.economy ?? true,
      household: parameter.household ?? true,
    };
  }
  return parameters;
}

/** v1 kept only numeric and boolean defaults, and an enum's value name. */
function v1DefaultValue(variable: Schemas['MetadataVariable']): unknown {
  const value = variable.default_value;
  if (variable.possible_values) {
    return value;
  }
  return typeof value === 'number' || typeof value === 'boolean' ? value : null;
}

function variableCollection(catalog: Schemas['MetadataCatalogResult']): Record<string, any> {
  const variables: Record<string, any> = {};
  for (const variable of catalog.variables) {
    variables[variable.name] = {
      name: variable.name,
      label: variable.label,
      entity: variable.entity,
      documentation: variable.description,
      valueType: variable.value_type ?? (variable.possible_values ? 'Enum' : variable.data_type),
      definitionPeriod: variable.definition_period ?? null,
      unit: variable.unit ?? null,
      moduleName: variable.module_name ?? null,
      isInputVariable: variable.is_input_variable ?? false,
      hidden_input: variable.hidden_input ?? false,
      defaultValue: v1DefaultValue(variable),
      adds: variable.adds,
      subtracts: variable.subtracts,
      ...(variable.possible_values
        ? {
            possibleValues: variable.possible_values.map((value) => ({
              value,
              label: variable.possible_value_labels?.[value] ?? value,
            })),
          }
        : {}),
    };
  }
  return variables;
}

function entityCollection(
  entities: Schemas['MetadataEntity'][] | null | undefined
): Record<string, any> {
  return Object.fromEntries(
    (entities ?? []).map((entity) => [
      entity.key,
      {
        key: entity.key,
        plural: entity.plural,
        label: entity.label,
        doc: entity.description,
        is_person: entity.is_person,
        roles: Object.fromEntries(
          entity.roles.map((role) => [
            role.key,
            { plural: role.plural, label: role.label, doc: role.description },
          ])
        ),
      },
    ])
  );
}

function regionEntries(countryId: string, regions: Schemas['MetadataRegion'][]) {
  const offered = V1_REGION_TYPES[countryId] ?? ['national'];
  return regions
    .filter((region) => offered.includes(region.region_type))
    .sort(
      (first, second) => offered.indexOf(first.region_type) - offered.indexOf(second.region_type)
    )
    .map(
      (region) =>
        ({
          name: region.code,
          label: region.label,
          type: region.region_type,
          // v1 gave the state only for congressional districts.
          ...(region.region_type === 'congressional_district' && region.state_code
            ? { state_abbreviation: region.state_code, state_name: region.state_name ?? '' }
            : {}),
        }) as MetadataRegionEntry
    );
}

function catalogReference(
  selection: Schemas['MetadataModelSelectionResult'],
  catalog: Schemas['MetadataCatalogResult']
): V2CatalogReference {
  return {
    policyengineVersion: catalog.policyengine_version,
    taxBenefitModelId: selection.model.id,
    parameterIds: Object.fromEntries(
      catalog.parameters
        .filter((parameter) => isGovernmentPath(parameter.name))
        .map((parameter) => [parameter.name, parameter.id])
    ),
  };
}

async function readRegions(
  client: PublicApiClient,
  countryId: string,
  policyengineVersion: string
): Promise<Schemas['MetadataRegion'][]> {
  const regions: Schemas['MetadataRegion'][] = [];
  for (let page = 0; page < MAXIMUM_REGION_PAGES; page += 1) {
    const result = await requireResult(
      client.GET('/v2/regions', {
        params: {
          query: {
            country_id: countryId,
            policyengine_version: policyengineVersion,
            offset: page * REGION_PAGE_SIZE,
            limit: REGION_PAGE_SIZE,
          },
        },
      })
    );
    regions.push(...result.items);
    if (!result.has_more || result.items.length === 0) {
      break;
    }
  }
  return regions;
}

/** A country's model metadata from the v2 routes, as a v1 metadata envelope. */
export async function fetchV2Metadata(
  countryId: string,
  client: PublicApiClient = createPublicApiClient()
): Promise<MetadataApiPayload> {
  const selection = await requireResult(
    client.GET('/v2/tax-benefit-models/by-country/{country_id}', {
      params: { path: { country_id: countryId } },
    })
  );
  const policyengineVersion = selection.policyengine_version;
  const [catalog, regions] = await Promise.all([
    requireResult(
      client.GET('/v2/model-catalog', {
        params: {
          query: { country_id: countryId, policyengine_version: policyengineVersion },
        },
      })
    ),
    readRegions(client, countryId, policyengineVersion),
  ]);
  const modelVersion = selection.model_version;
  const hasPresentationMetadata =
    modelVersion.catalog_format !== null && modelVersion.catalog_format !== undefined;

  return {
    status: 'ok',
    message: null,
    result: {
      variables: variableCollection(catalog),
      parameters: parameterCollection(catalog, hasPresentationMetadata),
      entities: entityCollection(modelVersion.entities),
      variableModules: {},
      economy_options: {
        region: regionEntries(countryId, regions),
        time_period: modelVersion.metadata_time_periods.map((year) => ({
          name: year,
          label: String(year),
        })),
        datasets: [],
      },
      current_law_id: modelVersion.current_law_id,
      basicInputs: modelVersion.basic_inputs ?? [],
      modelled_policies: { core: {}, filtered: {} },
      version: policyengineVersion,
      v2Catalog: catalogReference(selection, catalog),
    },
  };
}
