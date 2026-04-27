import type { CountryId } from '@/libs/countries';
import { BaseModel } from './BaseModel';
import {
  buildAppHouseholdDataFromV1Data,
  buildV1CreateEnvelopeFromAppInput,
  cloneAppHouseholdInputData,
} from './household/appCodec';
import type {
  AppHouseholdInputData,
  AppHouseholdInputEnvelope,
  AppHouseholdInputGroup,
  ComparableHousehold,
  HouseholdFieldValue,
  HouseholdModelData,
  HouseholdScalar,
} from './household/appTypes';
import { buildComparableHousehold } from './household/comparable';
import type { HouseholdGroupAppKey } from './household/schema';
import { cloneValue, deepEqual, inferYearFromData, normalizeCountryId } from './household/utils';
import type { V1HouseholdCreateEnvelope, V1HouseholdMetadataEnvelope } from './household/v1Types';
import { buildV2CreateEnvelope, parseV2HouseholdEnvelope } from './household/v2Codec';
import type { V2CreateHouseholdEnvelope, V2StoredHouseholdEnvelope } from './household/v2Types';

export type { ComparableHousehold, HouseholdModelData } from './household/appTypes';

type HouseholdDefaultEntityKey = 'people' | HouseholdGroupAppKey;

const COUNTRY_DEFAULT_ENTITIES: Partial<Record<CountryId, HouseholdDefaultEntityKey[]>> = {
  us: ['people', 'families', 'taxUnits', 'spmUnits', 'households', 'maritalUnits'],
  uk: ['people', 'benunits', 'households'],
  ca: ['people', 'households'],
  ng: ['people', 'households'],
  il: ['people', 'households'],
};

function normalizeYear(year: string | number): string {
  const normalized = String(year);
  if (!/^\d{4}$/.test(normalized)) {
    throw new Error('Household year must be a four-digit year');
  }

  return normalized;
}

function expandVariables(
  variables: Record<string, unknown> | undefined,
  year: string
): Record<string, HouseholdFieldValue> {
  if (!variables) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(variables).map(([key, value]) => [
      key,
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (cloneValue(value) as HouseholdFieldValue)
        : { [year]: value as HouseholdScalar },
    ])
  );
}

function normalizeBuilderFieldValue(value: HouseholdFieldValue, year: string): HouseholdFieldValue {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return cloneValue(value) as HouseholdFieldValue;
  }

  return { [year]: value as HouseholdScalar };
}

function resolveRequiredYear(year: number | null, householdData: AppHouseholdInputData): string {
  const resolvedYear = year ?? inferYearFromData(householdData);
  if (resolvedYear === null) {
    throw new Error('Household requires a year for builder operations');
  }

  return normalizeYear(resolvedYear);
}

function ensureGroupCollection(
  householdData: AppHouseholdInputData,
  entityName: HouseholdGroupAppKey
): Record<string, AppHouseholdInputGroup> {
  if (!householdData[entityName]) {
    householdData[entityName] = {};
  }

  return householdData[entityName] as Record<string, AppHouseholdInputGroup>;
}

function addPersonToFirstGroup(
  groupMap: Record<string, AppHouseholdInputGroup>,
  defaultGroupName: string,
  personKey: string
): void {
  if (Object.keys(groupMap).length === 0) {
    groupMap[defaultGroupName] = { members: [] };
  }

  const firstGroup = Object.values(groupMap)[0];
  if (!firstGroup.members.includes(personKey)) {
    firstGroup.members.push(personKey);
  }
}

function addPersonToNamedGroup(
  groupMap: Record<string, AppHouseholdInputGroup>,
  groupName: string,
  personKey: string
): void {
  if (!groupMap[groupName]) {
    groupMap[groupName] = { members: [] };
  }

  if (!groupMap[groupName].members.includes(personKey)) {
    groupMap[groupName].members.push(personKey);
  }
}

function getAllGroupCollections(
  householdData: AppHouseholdInputData
): Array<Record<string, AppHouseholdInputGroup>> {
  return [
    householdData.households,
    householdData.families,
    householdData.taxUnits,
    householdData.spmUnits,
    householdData.maritalUnits,
    householdData.benunits,
  ].filter((groups): groups is Record<string, AppHouseholdInputGroup> => Boolean(groups));
}

export class Household extends BaseModel<HouseholdModelData> {
  readonly id: string;

  private readonly countryIdValue: CountryId;

  private readonly labelValue: string | null;

  private readonly yearValue: number | null;

  private readonly appInputData: AppHouseholdInputData;

  private constructor(args: {
    id: string;
    countryId: CountryId;
    label?: string | null;
    year?: number | null;
    appInputData: AppHouseholdInputData;
  }) {
    super();

    if (!args.id) {
      throw new Error('Household requires an id');
    }

    this.id = args.id;
    this.countryIdValue = normalizeCountryId(args.countryId);
    this.labelValue = args.label ?? null;
    this.yearValue = args.year ?? null;
    this.appInputData = cloneAppHouseholdInputData(args.appInputData);
  }

  get countryId(): CountryId {
    return this.countryIdValue;
  }

  get label(): string | null {
    return this.labelValue;
  }

  get year(): number | null {
    return this.yearValue;
  }

  get householdData(): AppHouseholdInputData {
    return cloneValue(this.appInputData);
  }

  get people(): AppHouseholdInputData['people'] {
    return cloneValue(this.appInputData.people);
  }

  get personCount(): number {
    return Object.keys(this.appInputData.people).length;
  }

  get personNames(): string[] {
    return Object.keys(this.appInputData.people);
  }

  static fromAppInput(input: AppHouseholdInputEnvelope): Household {
    const appInputData = cloneAppHouseholdInputData(input.householdData);
    const year = input.year ?? inferYearFromData(appInputData);

    return new Household({
      id: input.id ?? 'draft-household',
      countryId: normalizeCountryId(input.countryId),
      label: input.label ?? null,
      year,
      appInputData,
    });
  }

  static fromDraft(args: {
    countryId: AppHouseholdInputEnvelope['countryId'];
    householdData: AppHouseholdInputData;
    label?: string | null;
    year?: number | null;
    id?: string;
  }): Household {
    return Household.fromAppInput({
      id: args.id,
      countryId: args.countryId,
      householdData: args.householdData,
      label: args.label,
      year: args.year,
    });
  }

  static empty(countryId: CountryId, year: string | number): Household {
    const householdData: AppHouseholdInputData = {
      people: {},
    };
    const defaultEntities = COUNTRY_DEFAULT_ENTITIES[normalizeCountryId(countryId)] ?? [
      'people',
      'households',
    ];

    for (const entity of defaultEntities) {
      if (entity !== 'people') {
        householdData[entity] = {};
      }
    }

    return new Household({
      id: 'draft-household',
      countryId,
      label: null,
      year: Number(normalizeYear(year)),
      appInputData: householdData,
    });
  }

  static fromV1Metadata(metadata: V1HouseholdMetadataEnvelope): Household {
    const appInputData = buildAppHouseholdDataFromV1Data(metadata.household_json);
    const year = inferYearFromData(appInputData);

    return Household.fromAppInput({
      id: String(metadata.id),
      countryId: metadata.country_id as CountryId,
      label: metadata.label ?? null,
      year,
      householdData: appInputData,
    });
  }

  static fromV1CreationPayload(
    payload: V1HouseholdCreateEnvelope,
    options: {
      id?: string;
      label?: string | null;
    } = {}
  ): Household {
    const appInputData = buildAppHouseholdDataFromV1Data(payload.data);
    const year = inferYearFromData(appInputData);

    return Household.fromAppInput({
      id: options.id ?? 'draft-household',
      countryId: payload.country_id as CountryId,
      label: options.label ?? payload.label ?? null,
      year,
      householdData: appInputData,
    });
  }

  static fromV2Response(response: V2StoredHouseholdEnvelope): Household {
    return Household.fromAppInput({
      id: response.id,
      ...parseV2HouseholdEnvelope(response),
    });
  }

  static fromV2CreateEnvelope(envelope: V2CreateHouseholdEnvelope): Household {
    return Household.fromAppInput({
      id: 'draft-household',
      ...parseV2HouseholdEnvelope(envelope),
    });
  }

  withId(id: string): Household {
    return new Household({
      id,
      countryId: this.countryId,
      label: this.label,
      year: this.year,
      appInputData: this.appInputData,
    });
  }

  withLabel(label: string | null): Household {
    return new Household({
      id: this.id,
      countryId: this.countryId,
      label,
      year: this.year,
      appInputData: this.appInputData,
    });
  }

  addAdult(name: string, age: number, variables?: Record<string, unknown>): Household {
    const year = resolveRequiredYear(this.year, this.appInputData);
    const nextData = cloneAppHouseholdInputData(this.appInputData);

    nextData.people[name] = {
      age: { [year]: age },
      ...expandVariables(variables, year),
    };

    return this.withHouseholdData(this.applyCountryDefaults(nextData, name, 'adult'));
  }

  addChild(
    name: string,
    age: number,
    _parentIds: string[] = [],
    variables?: Record<string, unknown>
  ): Household {
    const year = resolveRequiredYear(this.year, this.appInputData);
    const nextData = cloneAppHouseholdInputData(this.appInputData);

    nextData.people[name] = {
      age: { [year]: age },
      ...(this.countryId === 'us' ? { is_tax_unit_dependent: { [year]: true } } : {}),
      ...expandVariables(variables, year),
    };

    return this.withHouseholdData(this.applyCountryDefaults(nextData, name, 'child'));
  }

  addChildren(
    baseName: string,
    count: number,
    age: number,
    parentIds: string[] = [],
    variables?: Record<string, unknown>
  ): Household {
    let nextHousehold = this.withHouseholdData(this.appInputData);

    for (let index = 0; index < count; index += 1) {
      const name = count === 1 ? baseName : `${baseName} ${index + 1}`;
      nextHousehold = nextHousehold.addChild(name, age, parentIds, variables);
    }

    return nextHousehold;
  }

  removePerson(personKey: string): Household {
    const nextData = cloneAppHouseholdInputData(this.appInputData);
    delete nextData.people[personKey];

    for (const groups of getAllGroupCollections(nextData)) {
      for (const [groupKey, group] of Object.entries(groups)) {
        group.members = group.members.filter((member) => member !== personKey);

        if (group.members.length === 0) {
          delete groups[groupKey];
        }
      }
    }

    return this.withHouseholdData(nextData);
  }

  setMaritalStatus(person1Key: string, person2Key: string): Household {
    if (this.countryId !== 'us') {
      return this;
    }

    const nextData = cloneAppHouseholdInputData(this.appInputData);
    const maritalUnits = ensureGroupCollection(nextData, 'maritalUnits');
    maritalUnits['your marital unit'] = {
      members: [person1Key, person2Key],
    };

    return this.withHouseholdData(nextData);
  }

  assignToGroupEntity(
    personKey: string,
    entityName: HouseholdGroupAppKey,
    groupKey: string
  ): Household {
    const nextData = cloneAppHouseholdInputData(this.appInputData);
    const groups = ensureGroupCollection(nextData, entityName);

    if (!groups[groupKey]) {
      groups[groupKey] = { members: [] };
    }

    if (!groups[groupKey].members.includes(personKey)) {
      groups[groupKey].members.push(personKey);
    }

    return this.withHouseholdData(nextData);
  }

  setPersonVariable(
    personKey: string,
    variableName: string,
    value: HouseholdFieldValue
  ): Household {
    const year = resolveRequiredYear(this.year, this.appInputData);
    const nextData = cloneAppHouseholdInputData(this.appInputData);
    const person = nextData.people[personKey];

    if (!person) {
      throw new Error(`Person ${personKey} not found`);
    }

    person[variableName] = normalizeBuilderFieldValue(value, year);

    return this.withHouseholdData(nextData);
  }

  setGroupVariable(
    entityName: HouseholdGroupAppKey,
    groupKey: string,
    variableName: string,
    value: HouseholdFieldValue
  ): Household {
    const year = resolveRequiredYear(this.year, this.appInputData);
    const nextData = cloneAppHouseholdInputData(this.appInputData);
    const groups = ensureGroupCollection(nextData, entityName);

    if (!groups[groupKey]) {
      throw new Error(`Group ${groupKey} not found in ${String(entityName)}`);
    }

    groups[groupKey][variableName] = normalizeBuilderFieldValue(value, year);

    return this.withHouseholdData(nextData);
  }

  toAppInput(): AppHouseholdInputEnvelope {
    return {
      id: this.id,
      countryId: this.countryId,
      label: this.label,
      year: this.year,
      householdData: this.householdData,
    };
  }

  toV1CreationPayload(): V1HouseholdCreateEnvelope {
    return buildV1CreateEnvelopeFromAppInput({
      countryId: this.countryId,
      householdData: this.appInputData,
      label: this.label,
      year: this.year ?? inferYearFromData(this.appInputData),
    });
  }

  toV2CreateEnvelope(): V2CreateHouseholdEnvelope {
    return buildV2CreateEnvelope({
      countryId: this.countryId,
      label: this.label,
      year: this.year,
      householdData: this.appInputData,
    });
  }

  toComparable(): ComparableHousehold {
    return buildComparableHousehold({ id: this.id, envelope: this.toV2CreateEnvelope() });
  }

  toJSON(): HouseholdModelData {
    return {
      id: this.id,
      countryId: this.countryId,
      label: this.label,
      year: this.year,
      householdData: cloneValue(this.appInputData),
    };
  }

  isEqual(other: Household): boolean {
    return deepEqual(this.toJSON(), other.toJSON());
  }

  private withHouseholdData(appInputData: AppHouseholdInputData): Household {
    return new Household({
      id: this.id,
      countryId: this.countryId,
      label: this.label,
      year: this.year,
      appInputData,
    });
  }

  private applyCountryDefaults(
    householdData: AppHouseholdInputData,
    personKey: string,
    personType: 'adult' | 'child'
  ): AppHouseholdInputData {
    switch (this.countryId) {
      case 'us':
        this.applyUSDefaults(householdData, personKey, personType);
        break;
      case 'uk':
        this.applyUKDefaults(householdData, personKey);
        break;
      default:
        this.applyDefaultHousehold(householdData, personKey);
        break;
    }

    return householdData;
  }

  private applyUSDefaults(
    householdData: AppHouseholdInputData,
    personKey: string,
    personType: 'adult' | 'child'
  ): void {
    addPersonToFirstGroup(
      ensureGroupCollection(householdData, 'taxUnits'),
      'your tax unit',
      personKey
    );
    addPersonToFirstGroup(
      ensureGroupCollection(householdData, 'families'),
      'your family',
      personKey
    );
    addPersonToFirstGroup(
      ensureGroupCollection(householdData, 'spmUnits'),
      'your household',
      personKey
    );

    const maritalUnits = ensureGroupCollection(householdData, 'maritalUnits');
    const maritalUnitKey =
      personType === 'adult' ? 'your marital unit' : `${personKey}'s marital unit`;
    addPersonToNamedGroup(maritalUnits, maritalUnitKey, personKey);

    this.applyDefaultHousehold(householdData, personKey);
  }

  private applyUKDefaults(householdData: AppHouseholdInputData, personKey: string): void {
    addPersonToFirstGroup(
      ensureGroupCollection(householdData, 'benunits'),
      'your benefit unit',
      personKey
    );
    this.applyDefaultHousehold(householdData, personKey);
  }

  private applyDefaultHousehold(householdData: AppHouseholdInputData, personKey: string): void {
    addPersonToFirstGroup(
      ensureGroupCollection(householdData, 'households'),
      'your household',
      personKey
    );
  }
}
