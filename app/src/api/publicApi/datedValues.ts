import { parameterValueFromApi } from '@/api/publicApi/jsonValues';
import type { components } from '@/api/publicApi/schema';
import type { ValuesList } from '@/types/subIngredients/valueInterval';

/** v1 dated a value in force since the earliest date 0000-01-01; Python's earliest is year 1. */
const V2_EARLIEST_DATE = '0001-01-01';
const V1_EARLIEST_DATE = '0000-01-01';

/**
 * A parameter's dated values from the Public API's v2 catalog routes, as
 * v1's metadata dated them: each value under the date it starts, the
 * earliest date written as v1 wrote it. Each value is checked where it
 * arrives (`parameterValueFromApi`), so a malformed response fails here,
 * naming the parameter.
 */
export function v1DatedValues(
  parameterName: string,
  values: components['schemas']['MetadataDatedValue'][]
): ValuesList {
  return Object.fromEntries(
    values.map((dated) => {
      const date = dated.start_date.slice(0, 10);
      return [
        date === V2_EARLIEST_DATE ? V1_EARLIEST_DATE : date,
        parameterValueFromApi(dated.value, parameterName),
      ];
    })
  );
}
