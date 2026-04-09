import type { V2HouseholdShape } from '@/api/v2/householdCalculation';
import type { HouseholdV2Response } from '@/api/v2/households';
import { countryIds, type CountryId } from '@/libs/countries';
import { store } from '@/store';
import type { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import type { HouseholdCreationPayload } from '@/types/payloads';
import { BaseModel } from './BaseModel';

interface HouseholdModelData {
  id: string;
  countryId: CountryId;
  label: string | null;
  year: number | null;
  data: Record<string, unknown>;
}

export interface ComparableHousehold {
  id: string;
  countryId: CountryId;
  year: number | null;
  label: string | null;
  data: Record<string, unknown>;
}

type GroupDefinition = {
  appKey: string;
  v1Key: string;
  v2Key: 'household' | 'family' | 'tax_unit' | 'spm_unit' | 'marital_unit' | 'benunit';
  personLinkKey: string;
  groupIdKey: string;
  generatedKeyPrefix: string;
};

const GROUP_DEFINITIONS: readonly GroupDefinition[] = [
  {
    appKey: 'households',
    v1Key: 'households',
    v2Key: 'household',
    personLinkKey: 'person_household_id',
    groupIdKey: 'household_id',
    generatedKeyPrefix: 'household',
  },
  {
    appKey: 'families',
    v1Key: 'families',
    v2Key: 'family',
    personLinkKey: 'person_family_id',
    groupIdKey: 'family_id',
    generatedKeyPrefix: 'family',
  },
  {
    appKey: 'taxUnits',
    v1Key: 'tax_units',
    v2Key: 'tax_unit',
    personLinkKey: 'person_tax_unit_id',
    groupIdKey: 'tax_unit_id',
    generatedKeyPrefix: 'taxUnit',
  },
  {
    appKey: 'spmUnits',
    v1Key: 'spm_units',
    v2Key: 'spm_unit',
    personLinkKey: 'person_spm_unit_id',
    groupIdKey: 'spm_unit_id',
    generatedKeyPrefix: 'spmUnit',
  },
  {
    appKey: 'maritalUnits',
    v1Key: 'marital_units',
    v2Key: 'marital_unit',
    personLinkKey: 'person_marital_unit_id',
    groupIdKey: 'marital_unit_id',
    generatedKeyPrefix: 'maritalUnit',
  },
  {
    appKey: 'benunits',
    v1Key: 'benunits',
    v2Key: 'benunit',
    personLinkKey: 'person_benunit_id',
    groupIdKey: 'benunit_id',
    generatedKeyPrefix: 'benunit',
  },
] as const;

const PERSON_LINK_KEYS = new Set(GROUP_DEFINITIONS.map((definition) => definition.personLinkKey));
const PERSON_META_KEYS = new Set(['name', 'person_id', ...PERSON_LINK_KEYS]);
const GROUP_ID_KEYS = new Set(GROUP_DEFINITIONS.map((definition) => definition.groupIdKey));
type HouseholdV2Source = {
  id: string;
  country_id: string;
  year: number;
  label?: string | null;
  people: HouseholdV2Response['people'];
  tax_unit?: HouseholdV2Response['tax_unit'];
  family?: HouseholdV2Response['family'];
  spm_unit?: HouseholdV2Response['spm_unit'];
  marital_unit?: HouseholdV2Response['marital_unit'];
  household?: HouseholdV2Response['household'];
  benunit?: HouseholdV2Response['benunit'];
};

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeCountryId(countryId: string): CountryId {
  if (!countryIds.includes(countryId as CountryId)) {
    throw new Error(`Unknown country_id "${countryId}". Expected one of: ${countryIds.join(', ')}`);
  }
  return countryId as CountryId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function camelToSnake(value: string): string {
  return value.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function isYearKey(value: string): boolean {
  return /^\d{4}$/.test(value);
}

function isYearValueMap(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  const keys = Object.keys(value);
  return keys.length > 0 && keys.every(isYearKey);
}

function inferYearFromData(data: Record<string, unknown>): number | null {
  const years = new Set<number>();

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isRecord(value)) {
      return;
    }

    const keys = Object.keys(value);
    if (keys.length > 0 && keys.every(isYearKey)) {
      keys.forEach((key) => years.add(Number(key)));
      return;
    }

    Object.values(value).forEach(visit);
  };

  visit(data);
  return years.size > 0 ? Math.max(...years) : null;
}

function selectYearValue(value: Record<string, unknown>, preferredYear: number | null): unknown {
  if (preferredYear !== null && String(preferredYear) in value) {
    return value[String(preferredYear)];
  }

  const sortedKeys = Object.keys(value).sort();
  return value[sortedKeys[sortedKeys.length - 1]];
}

function flattenForYear(value: unknown, preferredYear: number | null): unknown {
  if (isYearValueMap(value)) {
    return selectYearValue(value, preferredYear);
  }
  return cloneValue(value);
}

function wrapForYear(value: unknown, year: number): unknown {
  if (Array.isArray(value) || isRecord(value)) {
    return cloneValue(value);
  }

  return { [String(year)]: value };
}

function flattenEntityRecord(
  record: Record<string, unknown>,
  preferredYear: number | null,
  omittedKeys: readonly string[] = []
): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (omittedKeys.includes(key) || value === undefined) {
      continue;
    }
    flattened[key] = flattenForYear(value, preferredYear);
  }

  return flattened;
}

function wrapEntityRecordForYear(
  record: Record<string, unknown>,
  year: number,
  omittedKeys: readonly string[] = []
): Record<string, unknown> {
  const wrapped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (omittedKeys.includes(key) || value === undefined) {
      continue;
    }
    wrapped[key] = wrapForYear(value, year);
  }

  return wrapped;
}

function getEntityMetadata() {
  const state = store.getState();
  return state.metadata?.entities || {};
}

function getEntityPluralKey(entityName: string): string | null {
  const entities = getEntityMetadata();

  if (entityName === 'people') {
    return 'people';
  }

  for (const entity of Object.values(entities)) {
    if ((entity as { plural?: string }).plural === entityName) {
      return entityName;
    }
  }

  const snakeCase = camelToSnake(entityName);
  for (const entity of Object.values(entities)) {
    if ((entity as { plural?: string }).plural === snakeCase) {
      return snakeCase;
    }
  }

  return null;
}

function validateEntityName(entityName: string): void {
  if (entityName === 'people') {
    return;
  }

  const pluralKey = getEntityPluralKey(entityName);
  if (pluralKey) {
    return;
  }

  const entities = getEntityMetadata();
  const validEntities = Object.values(entities)
    .map((entity) => (entity as { plural?: string }).plural)
    .filter(Boolean)
    .join(', ');

  throw new Error(`Unknown entity "${entityName}". Valid entities are: people, ${validEntities}`);
}

function getGroupEntries(
  data: Record<string, unknown>,
  appKey: string
): [string, Record<string, unknown>][] {
  const rawValue = data[appKey];
  if (!isRecord(rawValue)) {
    return [];
  }

  return Object.entries(rawValue).filter(([, value]) => isRecord(value)) as [
    string,
    Record<string, unknown>,
  ][];
}

function buildGeneratedGroupName(prefix: string, index: number): string {
  return `${prefix}${index + 1}`;
}

function sortForComparison(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(sortForComparison)
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, nestedValue]) => [key, sortForComparison(nestedValue)])
  );
}

function buildPeopleFromV2Response(
  people: HouseholdV2Response['people'],
  year: number
): {
  peopleByName: Record<string, unknown>;
  personNameById: Map<number, string>;
} {
  const peopleByName: Record<string, unknown> = {};
  const personNameById = new Map<number, string>();
  const usedNames = new Set<string>();

  for (const [index, personValue] of people.entries()) {
    const person = isRecord(personValue) ? personValue : {};
    const explicitName =
      typeof person.name === 'string' && person.name.length > 0 ? person.name : null;
    const personId = typeof person.person_id === 'number' ? person.person_id : index;

    let personName = explicitName ?? `person_${personId}`;
    while (usedNames.has(personName)) {
      personName = `${personName}_${index + 1}`;
    }

    usedNames.add(personName);
    personNameById.set(personId, personName);

    peopleByName[personName] = wrapEntityRecordForYear(person, year, [...PERSON_META_KEYS]);
  }

  return { peopleByName, personNameById };
}

function buildGroupMembersFromPeople(
  people: HouseholdV2Response['people'],
  personNameById: Map<number, string>,
  personLinkKey: string,
  groupId: number
): string[] {
  const members: string[] = [];

  for (const [index, personValue] of people.entries()) {
    const person = isRecord(personValue) ? personValue : {};
    const linkedGroupId =
      typeof person[personLinkKey] === 'number' ? (person[personLinkKey] as number) : null;
    const personId = typeof person.person_id === 'number' ? (person.person_id as number) : index;

    if (linkedGroupId !== groupId) {
      continue;
    }

    const personName = personNameById.get(personId);
    if (personName) {
      members.push(personName);
    }
  }

  return members;
}

export class Household extends BaseModel<HouseholdModelData> {
  readonly id: string;
  readonly countryId: CountryId;
  readonly year: number | null;

  private _label: string | null;
  private _data: Record<string, unknown>;

  constructor(data: HouseholdModelData) {
    super();
    if (!data.id) {
      throw new Error('Household requires an id');
    }
    this.id = data.id;
    this.countryId = data.countryId;
    this.year = data.year;
    this._label = data.label;
    this._data = cloneValue(data.data);
  }

  get label(): string | null {
    return this._label;
  }

  get data(): Record<string, unknown> {
    return cloneValue(this._data);
  }

  get people(): Record<string, unknown> {
    const people = this._data.people;
    return isRecord(people) ? cloneValue(people) : {};
  }

  get personCount(): number {
    return Object.keys(this.people).length;
  }

  get personNames(): string[] {
    return Object.keys(this.people);
  }

  set label(value: string | null) {
    this._label = value;
  }

  static fromDraft(args: {
    countryId: CountryId;
    householdData: Record<string, unknown>;
    label?: string | null;
    year?: number | null;
    id?: string;
  }): Household {
    return new Household({
      id: args.id ?? 'draft-household',
      countryId: args.countryId,
      label: args.label ?? null,
      year: args.year ?? inferYearFromData(args.householdData),
      data: args.householdData,
    });
  }

  static fromV1Metadata(metadata: HouseholdMetadata): Household {
    return Household.fromV1Payload({
      id: String(metadata.id),
      countryId: metadata.country_id,
      householdData: metadata.household_json,
      label: metadata.label ?? null,
    });
  }

  static fromV1Payload(args: {
    id: string;
    countryId: string;
    householdData: HouseholdCreationPayload['data'];
    label?: string | null;
  }): Household {
    const data: Record<string, unknown> = {
      people: cloneValue(args.householdData.people),
    };

    for (const [key, value] of Object.entries(args.householdData)) {
      if (key === 'people') {
        continue;
      }

      const camelKey = snakeToCamel(key);

      try {
        validateEntityName(key);
      } catch {
        console.warn(`Entity "${key}" not found in metadata, including anyway`);
      }

      data[camelKey] = cloneValue(value);
    }

    return new Household({
      id: String(args.id),
      countryId: normalizeCountryId(args.countryId),
      label: args.label ?? null,
      year: inferYearFromData(data),
      data,
    });
  }

  static fromV2Response(response: HouseholdV2Response): Household {
    return Household.fromV2Shape(response);
  }

  static fromV2Shape(shape: HouseholdV2Source): Household {
    const { peopleByName, personNameById } = buildPeopleFromV2Response(shape.people, shape.year);
    const data: Record<string, unknown> = {
      people: peopleByName,
    };

    for (const definition of GROUP_DEFINITIONS) {
      const rawGroup = shape[definition.v2Key];
      if (!isRecord(rawGroup)) {
        continue;
      }

      const groupId =
        typeof rawGroup[definition.groupIdKey] === 'number'
          ? (rawGroup[definition.groupIdKey] as number)
          : 0;
      const members = buildGroupMembersFromPeople(
        shape.people,
        personNameById,
        definition.personLinkKey,
        groupId
      );

      data[definition.appKey] = {
        [buildGeneratedGroupName(definition.generatedKeyPrefix, 0)]: {
          members: members.length > 0 ? members : Object.keys(peopleByName),
          ...wrapEntityRecordForYear(rawGroup, shape.year, [definition.groupIdKey]),
        },
      };
    }

    return new Household({
      id: shape.id,
      countryId: normalizeCountryId(shape.country_id),
      label: shape.label ?? null,
      year: shape.year ?? null,
      data,
    });
  }

  toV1CreationPayload(): HouseholdCreationPayload {
    const payloadData: Record<string, unknown> = {
      people: cloneValue(this.people),
    };

    for (const [key, value] of Object.entries(this._data)) {
      if (key === 'people' || value === undefined) {
        continue;
      }

      const pluralKey = getEntityPluralKey(key);
      if (pluralKey) {
        payloadData[pluralKey] = cloneValue(value);
        continue;
      }

      const snakeKey = camelToSnake(key);
      console.warn(`Entity "${key}" not found in metadata, using snake_case "${snakeKey}"`);
      payloadData[snakeKey] = cloneValue(value);
    }

    return {
      country_id: this.countryId,
      data: payloadData as unknown as HouseholdCreationPayload['data'],
      label: this._label ?? undefined,
    };
  }

  toV2Shape(): V2HouseholdShape {
    const year = this.year ?? inferYearFromData(this._data);
    if (year === null) {
      throw new Error('Household requires a year to convert to v2 shape');
    }

    const groupedEntries = new Map<string, [string, Record<string, unknown>][]>([]);
    for (const definition of GROUP_DEFINITIONS) {
      const entries = getGroupEntries(this._data, definition.appKey);
      if (entries.length > 1) {
        throw new Error(`Cannot convert household with multiple ${definition.appKey} to v2 shape`);
      }
      groupedEntries.set(definition.appKey, entries);
    }

    const personAssignments = new Map<string, Record<string, number>>();
    for (const definition of GROUP_DEFINITIONS) {
      const entries = groupedEntries.get(definition.appKey) ?? [];
      entries.forEach(([, record], groupIndex) => {
        const members = Array.isArray(record.members)
          ? record.members.map((member) => String(member))
          : [];

        members.forEach((member) => {
          const currentAssignments = personAssignments.get(member) ?? {};
          currentAssignments[definition.personLinkKey] = groupIndex;
          personAssignments.set(member, currentAssignments);
        });
      });
    }

    const peopleEntries = Object.entries(this.people).filter(([, value]) => isRecord(value));
    const people = peopleEntries.map(([personName, personValue], personIndex) => ({
      person_id: personIndex,
      ...personAssignments.get(personName),
      ...flattenEntityRecord(personValue as Record<string, unknown>, year),
    }));

    const v2Shape: V2HouseholdShape = {
      id: this.id === 'draft-household' ? undefined : this.id,
      country_id: this.countryId,
      year,
      label: this._label,
      people,
    };

    for (const definition of GROUP_DEFINITIONS) {
      const entries = groupedEntries.get(definition.appKey) ?? [];
      if (entries.length === 0) {
        continue;
      }

      const [, record] = entries[0];
      v2Shape[definition.v2Key] = {
        [definition.groupIdKey]: 0,
        ...flattenEntityRecord(record, year, ['members']),
      };
    }

    return v2Shape;
  }

  toComparable(): ComparableHousehold {
    const v2Shape = this.toV2Shape();
    const comparableData = {
      people: v2Shape.people,
      tax_unit: v2Shape.tax_unit ?? null,
      family: v2Shape.family ?? null,
      spm_unit: v2Shape.spm_unit ?? null,
      marital_unit: v2Shape.marital_unit ?? null,
      household: v2Shape.household ?? null,
      benunit: v2Shape.benunit ?? null,
    };

    return {
      id: this.id,
      countryId: this.countryId,
      year: this.year ?? inferYearFromData(this._data),
      label: this._label,
      data: sortForComparison(comparableData) as Record<string, unknown>,
    };
  }

  toJSON(): HouseholdModelData {
    return {
      id: this.id,
      countryId: this.countryId,
      label: this._label,
      year: this.year,
      data: cloneValue(this._data),
    };
  }

  isEqual(other: Household): boolean {
    return JSON.stringify(this.toJSON()) === JSON.stringify(other.toJSON());
  }
}
