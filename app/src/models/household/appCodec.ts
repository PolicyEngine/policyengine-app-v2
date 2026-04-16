import type {
  AppHouseholdInputData,
  AppHouseholdInputEnvelope,
  AppHouseholdInputGroup,
  AppHouseholdInputGroupMap,
  HouseholdFieldValue,
} from './appTypes';
import { parseNamedPeople, validateNamedGroupCollection } from './namedCodecHelpers';
import { GROUP_DEFINITIONS, KNOWN_APP_ENTITY_KEYS, KNOWN_V1_ENTITY_KEYS } from './schema';
import {
  cloneValue,
  isYearValueMap,
  normalizeCountryId,
  normalizeHouseholdFieldValue,
  wrapForYear,
} from './utils';
import type {
  V1HouseholdCreateEnvelope,
  V1HouseholdData,
  V1HouseholdGroupData,
  V1HouseholdPersonData,
} from './v1Types';

function assertKnownAppEntityKeys(rawData: Record<string, unknown>): void {
  const unknownKeys = Object.keys(rawData).filter((key) => !KNOWN_APP_ENTITY_KEYS.has(key));

  if (unknownKeys.length > 0) {
    throw new Error(`Unsupported household entities: ${unknownKeys.join(', ')}`);
  }
}

export function cloneAppHouseholdInputData(
  householdData: AppHouseholdInputData
): AppHouseholdInputData {
  const rawData = householdData as unknown as Record<string, unknown>;
  assertKnownAppEntityKeys(rawData);
  const people = parseNamedPeople(rawData.people, 'Household input');
  const peopleNames = new Set(Object.keys(people));

  for (const definition of GROUP_DEFINITIONS) {
    validateNamedGroupCollection({
      rawGroupCollection: rawData[definition.appKey],
      context: 'Household input',
      groupKey: definition.appKey,
      peopleNames,
    });
  }

  return cloneValue(householdData);
}

export function buildAppHouseholdDataFromV1Data(
  householdData: V1HouseholdData
): AppHouseholdInputData {
  const rawData = householdData as unknown as Record<string, unknown>;
  const unknownKeys = Object.keys(rawData).filter((key) => !KNOWN_V1_ENTITY_KEYS.has(key));

  if (unknownKeys.length > 0) {
    throw new Error(`Unsupported household entities in v1 payload: ${unknownKeys.join(', ')}`);
  }

  const people: AppHouseholdInputData['people'] = Object.fromEntries(
    Object.entries(householdData.people).map(([personName, rawPerson]) => {
      const personData = Object.fromEntries(
        Object.entries(rawPerson).filter(([, fieldValue]) => fieldValue !== undefined)
      ) as AppHouseholdInputData['people'][string];

      return [personName, personData];
    })
  );

  const toAppGroupMap = (
    groupMap: Record<string, V1HouseholdGroupData> | undefined
  ): AppHouseholdInputGroupMap | undefined => {
    if (!groupMap) {
      return undefined;
    }

    return Object.fromEntries(
      Object.entries(groupMap).map(([groupName, rawGroup]) => {
        const { members, ...rawValues } = rawGroup;

        return [
          groupName,
          {
            members: cloneValue(members),
            ...Object.fromEntries(
              Object.entries(rawValues).filter(([, fieldValue]) => fieldValue !== undefined)
            ),
          },
        ];
      })
    );
  };

  return {
    people,
    households: toAppGroupMap(householdData.households),
    families: toAppGroupMap(householdData.families),
    taxUnits: toAppGroupMap(householdData.tax_units),
    spmUnits: toAppGroupMap(householdData.spm_units),
    maritalUnits: toAppGroupMap(householdData.marital_units),
    benunits: toAppGroupMap(householdData.benunits),
  };
}

function buildV1FieldValueFromAppInput(
  value: HouseholdFieldValue | string[],
  year: number | null,
  context: string
): Record<string, string | number | boolean | null> {
  if (Array.isArray(value)) {
    throw new Error(`${context} cannot serialize array values into a v1 field`);
  }

  const normalizedValue = normalizeHouseholdFieldValue(value, context);
  if (isYearValueMap(normalizedValue)) {
    return cloneValue(normalizedValue);
  }
  if (year === null) {
    throw new Error(`${context} requires a year to emit a v1 payload`);
  }

  return wrapForYear(normalizedValue, year);
}

function buildV1GroupMapFromAppInput(
  groupMap: Record<string, AppHouseholdInputGroup> | undefined,
  year: number | null,
  context: string
): Record<string, V1HouseholdGroupData> | undefined {
  if (!groupMap) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(groupMap).map(([groupName, rawGroup]) => {
      const { members, ...rawValues } = rawGroup;
      const groupData: V1HouseholdGroupData = {
        members: cloneValue(members),
        ...Object.fromEntries(
          Object.entries(rawValues).map(([fieldKey, fieldValue]) => [
            fieldKey,
            buildV1FieldValueFromAppInput(fieldValue, year, `${context}.${groupName}.${fieldKey}`),
          ])
        ),
      };

      return [groupName, groupData];
    })
  );
}

export function buildV1CreateEnvelopeFromAppInput(args: {
  countryId: AppHouseholdInputEnvelope['countryId'];
  householdData: AppHouseholdInputData;
  label?: string | null;
  year?: number | null;
}): V1HouseholdCreateEnvelope {
  const clonedData = cloneAppHouseholdInputData(args.householdData);
  const year = args.year ?? null;

  return {
    country_id: normalizeCountryId(args.countryId),
    label: args.label ?? undefined,
    data: {
      people: Object.fromEntries(
        Object.entries(clonedData.people).map(([personName, rawPerson]) => {
          const personData: V1HouseholdPersonData = Object.fromEntries(
            Object.entries(rawPerson).map(([fieldKey, fieldValue]) => [
              fieldKey,
              buildV1FieldValueFromAppInput(
                fieldValue,
                year,
                `Household input.people.${personName}.${fieldKey}`
              ),
            ])
          );

          return [personName, personData];
        })
      ),
      households: buildV1GroupMapFromAppInput(
        clonedData.households,
        year,
        'Household input.households'
      ),
      families: buildV1GroupMapFromAppInput(clonedData.families, year, 'Household input.families'),
      tax_units: buildV1GroupMapFromAppInput(clonedData.taxUnits, year, 'Household input.taxUnits'),
      spm_units: buildV1GroupMapFromAppInput(clonedData.spmUnits, year, 'Household input.spmUnits'),
      marital_units: buildV1GroupMapFromAppInput(
        clonedData.maritalUnits,
        year,
        'Household input.maritalUnits'
      ),
      benunits: buildV1GroupMapFromAppInput(clonedData.benunits, year, 'Household input.benunits'),
    },
  };
}
