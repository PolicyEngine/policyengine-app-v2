import type { Reform } from '@/types/ingredients/Reform';

type ReformParameters = Reform['parameters'];

const sortedParameters = (parameters: ReformParameters) =>
  [...parameters]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((parameter) => ({
      name: parameter.name,
      values: parameter.values.map(({ startDate, endDate, value }) => ({
        startDate,
        endDate,
        value,
      })),
    }));

/**
 * Two reforms set the same parameters to the same values over the same
 * dates — in any order. A run reuses such a saved reform rather than
 * saving a copy of it.
 */
export function sameReformParameters(a: ReformParameters, b: ReformParameters): boolean {
  return JSON.stringify(sortedParameters(a)) === JSON.stringify(sortedParameters(b));
}

/** The saved reform among `reforms` that sets exactly these parameters, if any. */
export function findMatchingReform(
  reforms: Reform[],
  parameters: ReformParameters
): Reform | undefined {
  return reforms.find((reform) => sameReformParameters(reform.parameters, parameters));
}
