import { cloneAppHouseholdInputData } from './appCodec';
import type {
  AppHouseholdInputData,
  AppHouseholdInputGroup,
  HouseholdFieldValue,
  HouseholdScalar,
} from './appTypes';
import type {
  PythonPackageHouseholdData,
  PythonPackageHouseholdGroupData,
} from './pythonPackageTypes';
import { cloneValue, isYearValueMap, normalizeHouseholdFieldValue, wrapForYear } from './utils';

function buildPythonPackageFieldValueFromAppInput(
  value: HouseholdFieldValue | string[],
  year: number | null,
  context: string
): Record<string, HouseholdScalar> {
  if (Array.isArray(value)) {
    throw new Error(`${context} cannot serialize array values into Python package data`);
  }

  const normalizedValue = normalizeHouseholdFieldValue(value, context);
  if (isYearValueMap(normalizedValue)) {
    return cloneValue(normalizedValue);
  }
  if (year === null) {
    throw new Error(`${context} requires a year to emit Python package data`);
  }

  return wrapForYear(normalizedValue, year);
}

function buildPythonPackageGroupMapFromAppInput(
  groupMap: Record<string, AppHouseholdInputGroup> | undefined,
  year: number | null,
  context: string
): Record<string, PythonPackageHouseholdGroupData> | undefined {
  if (!groupMap) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(groupMap).map(([groupName, rawGroup]) => {
      const { members, ...rawValues } = rawGroup;
      const groupData: PythonPackageHouseholdGroupData = {
        members: cloneValue(members),
        ...Object.fromEntries(
          Object.entries(rawValues).map(([fieldKey, fieldValue]) => [
            fieldKey,
            buildPythonPackageFieldValueFromAppInput(
              fieldValue,
              year,
              `${context}.${groupName}.${fieldKey}`
            ),
          ])
        ),
      };

      return [groupName, groupData];
    })
  );
}

export function buildPythonPackageHouseholdDataFromAppInput(args: {
  householdData: AppHouseholdInputData;
  year?: number | null;
}): PythonPackageHouseholdData {
  const clonedData = cloneAppHouseholdInputData(args.householdData);
  const year = args.year ?? null;

  return {
    people: Object.fromEntries(
      Object.entries(clonedData.people).map(([personName, rawPerson]) => {
        const personData = Object.fromEntries(
          Object.entries(rawPerson).map(([fieldKey, fieldValue]) => [
            fieldKey,
            buildPythonPackageFieldValueFromAppInput(
              fieldValue,
              year,
              `Household input.people.${personName}.${fieldKey}`
            ),
          ])
        );

        return [personName, personData];
      })
    ),
    households: buildPythonPackageGroupMapFromAppInput(
      clonedData.households,
      year,
      'Household input.households'
    ),
    families: buildPythonPackageGroupMapFromAppInput(
      clonedData.families,
      year,
      'Household input.families'
    ),
    tax_units: buildPythonPackageGroupMapFromAppInput(
      clonedData.taxUnits,
      year,
      'Household input.taxUnits'
    ),
    spm_units: buildPythonPackageGroupMapFromAppInput(
      clonedData.spmUnits,
      year,
      'Household input.spmUnits'
    ),
    marital_units: buildPythonPackageGroupMapFromAppInput(
      clonedData.maritalUnits,
      year,
      'Household input.maritalUnits'
    ),
    benunits: buildPythonPackageGroupMapFromAppInput(
      clonedData.benunits,
      year,
      'Household input.benunits'
    ),
  };
}
