import type { CountryId } from '@/libs/countries';
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
  PythonPackageHouseholdPersonData,
  PythonPackageHouseholdSituation,
  PythonPackageHouseholdWithAxes,
} from './pythonPackageTypes';
import { getHouseholdGroupDefinitions } from './schema';
import { cloneValue, isYearValueMap, normalizeHouseholdFieldValue, wrapForYear } from './utils';

export const PYTHON_PACKAGE_HOUSEHOLD_VARIATION_POINT_COUNT = 401;

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
  countryId: CountryId;
  householdData: AppHouseholdInputData;
  year?: number | null;
}): PythonPackageHouseholdData {
  const clonedData = cloneAppHouseholdInputData(args.householdData);
  const year = args.year ?? null;

  const householdData: PythonPackageHouseholdData = {
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
  };

  for (const definition of getHouseholdGroupDefinitions(args.countryId)) {
    const groupMap = buildPythonPackageGroupMapFromAppInput(
      clonedData[definition.appKey],
      year,
      `Household input.${definition.appKey}`
    );

    if (groupMap) {
      householdData[definition.v1Key] = groupMap;
    }
  }

  return householdData;
}

export function getPythonPackageHouseholdVariationMaxEarnings(
  currentEarnings: number,
  countryId: string
): number {
  return Math.max(countryId === 'ng' ? 1_200_000 : 200_000, 2 * currentEarnings);
}

function getPythonPackageVariationPersonKey(
  householdInput: PythonPackageHouseholdData,
  personName?: string | null
): string {
  if (personName && householdInput.people[personName]) {
    return personName;
  }

  if (householdInput.people.you) {
    return 'you';
  }

  const fallbackPersonKey = Object.keys(householdInput.people)[0];
  if (!fallbackPersonKey) {
    throw new Error('Household has no people defined');
  }

  return fallbackPersonKey;
}

function getPythonPackageEarningsForYear(
  householdInput: PythonPackageHouseholdData,
  personKey: string,
  year: string
): number {
  const value = householdInput.people[personKey]?.employment_income;
  if (!isYearValueMap(value)) {
    return 0;
  }

  const earnings = value[year];
  return typeof earnings === 'number' ? earnings : 0;
}

export function addVariationAxesToPythonPackageHouseholdData(
  householdInput: PythonPackageHouseholdData,
  year: string,
  countryId: string,
  personName?: string | null
): PythonPackageHouseholdWithAxes {
  if (Object.keys(householdInput.people).length === 0) {
    throw new Error('Household has no people defined');
  }

  const householdDataWithVariation = cloneValue(householdInput) as PythonPackageHouseholdWithAxes;
  const targetPersonKey = getPythonPackageVariationPersonKey(
    householdDataWithVariation,
    personName
  );
  const targetPerson = householdDataWithVariation.people[targetPersonKey];
  const currentEarnings = getPythonPackageEarningsForYear(
    householdDataWithVariation,
    targetPersonKey,
    year
  );
  const maxEarnings = getPythonPackageHouseholdVariationMaxEarnings(currentEarnings, countryId);
  const existingEmploymentIncome = isYearValueMap(targetPerson.employment_income)
    ? targetPerson.employment_income
    : {};

  targetPerson.employment_income = {
    ...existingEmploymentIncome,
    [year]: null,
  };

  householdDataWithVariation.axes = [
    [
      {
        name: 'employment_income',
        period: year,
        min: 0,
        max: maxEarnings,
        count: PYTHON_PACKAGE_HOUSEHOLD_VARIATION_POINT_COUNT,
      },
    ],
  ];

  return householdDataWithVariation;
}

export function cleanPythonPackageHouseholdNullValuesForYear(
  householdInput: PythonPackageHouseholdData,
  year: number
): PythonPackageHouseholdSituation {
  const yearKey = String(year);
  const householdInputCopy = cloneValue(householdInput) as PythonPackageHouseholdSituation;
  const entityCollections = Object.values(householdInputCopy) as Array<
    Record<string, PythonPackageHouseholdPersonData | PythonPackageHouseholdGroupData> | undefined
  >;

  for (const entityCollection of entityCollections) {
    if (!entityCollection || Array.isArray(entityCollection)) {
      continue;
    }

    for (const entity of Object.values(entityCollection)) {
      for (const [variable, value] of Object.entries(entity)) {
        if (variable === 'members') {
          continue;
        }

        if (isYearValueMap(value) && value[yearKey] === null) {
          delete entity[variable];
        }
      }
    }
  }

  return householdInputCopy;
}
