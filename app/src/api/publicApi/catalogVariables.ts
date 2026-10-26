import { createPublicApiClient, requireResult, type PublicApiClient } from '@/api/publicApi/client';
import type { components } from '@/api/publicApi/schema';
import type { ValuesList } from '@/types/subIngredients/valueInterval';

/**
 * Every variable of a catalog version, from the Public API's
 * `GET /v2/model-catalog/variables`, in the shape v1's
 * `GET /{country}/metadata` gave each variable, so the household builder,
 * its variable picker and the household breakdown read them unchanged.
 *
 * Where a variable's `adds` or `subtracts` names a parameter, v1 gave the
 * parameter's path as the value, and the breakdown read that parameter
 * from the whole parameter list for the report's year. On v2 the path is
 * kept the same way, and the parameter's dated values come with the
 * variables (`part_parameter_values`), so the breakdown never needs the
 * whole parameter list.
 *
 * The catalog does not publish a variable's unit, definition period,
 * category or position in its module, so those stay unset.
 */

type Schemas = components['schemas'];

export interface LoadedCatalogVariables {
  /** Each variable by name, as v1's metadata described it. */
  variables: Record<string, V1ShapedVariable>;
  /** The dated values of each parameter a variable's adds or subtracts names. */
  partParameterValues: Record<string, ValuesList>;
}

/** The fields of a v1 metadata variable that the catalog publishes. */
export interface V1ShapedVariable {
  name: string;
  label: string;
  entity: string;
  documentation: string | null;
  valueType: string | null;
  defaultValue: unknown;
  /** A list of variable names, or the path of a parameter whose value is that list. */
  adds: string[] | string | null;
  subtracts: string[] | string | null;
  isInputVariable: boolean;
  hidden_input: boolean;
  moduleName: string | null;
  possibleValues?: Array<{ value: string; label: Schemas['MetadataEnumValue']['label'] }>;
}

/** v1 dated a value in force since the earliest date 0000-01-01; Python's earliest is year 1. */
const V2_EARLIEST_DATE = '0001-01-01';
const V1_EARLIEST_DATE = '0000-01-01';

export function v1DatedValues(values: Schemas['MetadataDatedValue'][]): ValuesList {
  return Object.fromEntries(
    values.map((dated) => {
      const date = dated.start_date.slice(0, 10);
      return [date === V2_EARLIEST_DATE ? V1_EARLIEST_DATE : date, dated.value];
    })
  ) as ValuesList;
}

export function v1ShapedVariable(variable: Schemas['MetadataVariable']): V1ShapedVariable {
  const shaped: V1ShapedVariable = {
    name: variable.name,
    // v1 always had a label; a variable without one reads as its name.
    label: variable.label ?? variable.name,
    entity: variable.entity,
    documentation: variable.description,
    valueType: variable.data_type,
    defaultValue: variable.default_value,
    adds: variable.adds_parameter_path ?? variable.adds,
    subtracts: variable.subtracts_parameter_path ?? variable.subtracts,
    isInputVariable: variable.is_input_variable ?? false,
    hidden_input: variable.hidden_input ?? false,
    moduleName: variable.module_name ?? null,
  };
  if (variable.enum_values) {
    shaped.possibleValues = variable.enum_values.map((enumValue) => ({
      value: enumValue.value,
      label: enumValue.label,
    }));
  }
  return shaped;
}

/** All of a catalog version's variables, with the values their parameter-named parts read. */
export async function fetchCatalogVariables(
  countryId: string,
  policyengineVersion: string,
  client: PublicApiClient = createPublicApiClient()
): Promise<LoadedCatalogVariables> {
  const result = await requireResult(
    client.GET('/v2/model-catalog/variables', {
      params: {
        query: {
          country_id: countryId as 'us' | 'uk',
          policyengine_version: policyengineVersion,
        },
      },
    })
  );
  return {
    variables: Object.fromEntries(
      result.variables.map((variable) => [variable.name, v1ShapedVariable(variable)])
    ),
    partParameterValues: Object.fromEntries(
      Object.entries(result.part_parameter_values).map(([path, values]) => [
        path,
        v1DatedValues(values),
      ])
    ),
  };
}
