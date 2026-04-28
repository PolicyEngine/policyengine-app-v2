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
  AppHouseholdInputGroupMap,
  AppHouseholdInputPerson,
  ComparableHousehold,
  HouseholdFieldValue,
  HouseholdModelData,
  HouseholdScalar,
} from './household/appTypes';
import { buildComparableHousehold } from './household/comparable';
import { buildPythonPackageHouseholdDataFromAppInput } from './household/pythonPackageCodec';
import type { PythonPackageHouseholdData } from './household/pythonPackageTypes';
import {
  buildGeneratedGroupName,
  getGroupDefinitionByAppKey,
  normalizeHouseholdGroupAppKey,
  type HouseholdGroupAppKey,
} from './household/schema';
import {
  cloneValue,
  deepEqual,
  inferYearFromData,
  isYearValueMap,
  normalizeCountryId,
} from './household/utils';
import type { V1HouseholdCreateEnvelope, V1HouseholdMetadataEnvelope } from './household/v1Types';
import { buildV2CreateEnvelope, parseV2HouseholdEnvelope } from './household/v2Codec';
import type { V2CreateHouseholdEnvelope, V2StoredHouseholdEnvelope } from './household/v2Types';

export type { ComparableHousehold, HouseholdModelData } from './household/appTypes';

type HouseholdDefaultEntityKey = 'people' | HouseholdGroupAppKey;

export interface PersonWithName extends AppHouseholdInputPerson {
  name: string;
}

export interface HouseholdGroupSummary {
  key: string;
  members: string[];
}

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

function getGroupCollectionFromData(
  householdData: AppHouseholdInputData,
  entityName: string
): AppHouseholdInputGroupMap | undefined {
  const entityKey = normalizeHouseholdGroupAppKey(entityName);
  if (!entityKey) {
    return undefined;
  }

  return householdData[entityKey];
}

function normalizeGroupKeyOrThrow(entityName: string): HouseholdGroupAppKey {
  const entityKey = normalizeHouseholdGroupAppKey(entityName);
  if (!entityKey) {
    throw new Error(`Unsupported household entity group "${entityName}"`);
  }

  return entityKey;
}

function getPreferredGroupNameFromData(
  householdData: AppHouseholdInputData,
  entityName: string
): string | undefined {
  const groups = getGroupCollectionFromData(householdData, entityName);
  if (!groups) {
    return undefined;
  }

  const groupNames = Object.keys(groups);
  if (groupNames.length === 0) {
    return undefined;
  }

  return [...groupNames].sort((left, right) => left.localeCompare(right))[0];
}

function getYearValue(
  value: AppHouseholdInputPerson[string] | AppHouseholdInputGroup[string] | undefined,
  year: string
): HouseholdScalar | undefined {
  if (!isYearValueMap(value)) {
    return undefined;
  }

  return value[year];
}

function setYearValue(
  target: Record<string, HouseholdFieldValue | string[]>,
  variableName: string,
  year: string,
  value: HouseholdScalar
): void {
  const existing = target[variableName];
  target[variableName] = {
    ...(isYearValueMap(existing) ? existing : {}),
    [year]: value,
  };
}

function removeVariableFromEntityData(
  entityData: Record<string, HouseholdFieldValue | string[]> | undefined,
  variableName: string
): void {
  if (entityData) {
    delete entityData[variableName];
  }
}

function applyDefaultHouseholdGroups(
  householdData: AppHouseholdInputData,
  personKey: string
): void {
  addPersonToFirstGroup(
    ensureGroupCollection(householdData, 'households'),
    'your household',
    personKey
  );
}

function applyUSDefaultGroups(
  householdData: AppHouseholdInputData,
  personKey: string,
  personType: 'adult' | 'child'
): void {
  addPersonToFirstGroup(
    ensureGroupCollection(householdData, 'taxUnits'),
    'your tax unit',
    personKey
  );
  addPersonToFirstGroup(ensureGroupCollection(householdData, 'families'), 'your family', personKey);
  addPersonToFirstGroup(
    ensureGroupCollection(householdData, 'spmUnits'),
    'your household',
    personKey
  );

  const maritalUnits = ensureGroupCollection(householdData, 'maritalUnits');
  const maritalUnitKey =
    personType === 'adult' ? 'your marital unit' : `${personKey}'s marital unit`;
  addPersonToNamedGroup(maritalUnits, maritalUnitKey, personKey);

  applyDefaultHouseholdGroups(householdData, personKey);
}

function applyUKDefaultGroups(householdData: AppHouseholdInputData, personKey: string): void {
  addPersonToFirstGroup(
    ensureGroupCollection(householdData, 'benunits'),
    'your benefit unit',
    personKey
  );
  applyDefaultHouseholdGroups(householdData, personKey);
}

interface HouseholdCountryStrategy {
  defaultEntities: HouseholdDefaultEntityKey[];
  applyPersonDefaults: (
    householdData: AppHouseholdInputData,
    personKey: string,
    personType: 'adult' | 'child'
  ) => void;
}

const DEFAULT_COUNTRY_STRATEGY: HouseholdCountryStrategy = {
  defaultEntities: ['people', 'households'],
  applyPersonDefaults: (householdData, personKey) =>
    applyDefaultHouseholdGroups(householdData, personKey),
};

const HOUSEHOLD_COUNTRY_STRATEGIES: Partial<Record<CountryId, HouseholdCountryStrategy>> = {
  us: {
    defaultEntities: ['people', 'families', 'taxUnits', 'spmUnits', 'households', 'maritalUnits'],
    applyPersonDefaults: applyUSDefaultGroups,
  },
  uk: {
    defaultEntities: ['people', 'benunits', 'households'],
    applyPersonDefaults: applyUKDefaultGroups,
  },
  ca: DEFAULT_COUNTRY_STRATEGY,
  ng: DEFAULT_COUNTRY_STRATEGY,
  il: DEFAULT_COUNTRY_STRATEGY,
};

function getHouseholdCountryStrategy(countryId: CountryId): HouseholdCountryStrategy {
  return HOUSEHOLD_COUNTRY_STRATEGIES[normalizeCountryId(countryId)] ?? DEFAULT_COUNTRY_STRATEGY;
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

  getAllPeople(): PersonWithName[] {
    return Object.entries(this.appInputData.people).map(([name, person]) => ({
      name,
      ...cloneValue(person),
    }));
  }

  getAdults(year: string): PersonWithName[] {
    return this.getAllPeople().filter((person) => {
      const age = getYearValue(person.age, year);
      return typeof age === 'number' && age >= 18;
    });
  }

  getChildren(year: string): PersonWithName[] {
    return this.getAllPeople().filter((person) => {
      const age = getYearValue(person.age, year);
      return typeof age === 'number' && age < 18;
    });
  }

  getAdultCount(year: string): number {
    return this.getAdults(year).length;
  }

  getChildCount(year: string): number {
    return this.getChildren(year).length;
  }

  isEmpty(): boolean {
    return this.personCount === 0;
  }

  getPersonVariableAtYear(
    personName: string,
    variableName: string,
    year: string
  ): HouseholdScalar | undefined {
    return getYearValue(this.appInputData.people[personName]?.[variableName], year);
  }

  getGroupVariableAtYear(
    entityName: string,
    groupKey: string,
    variableName: string,
    year: string
  ): HouseholdScalar | undefined {
    const groups = getGroupCollectionFromData(this.appInputData, entityName);
    return getYearValue(groups?.[groupKey]?.[variableName], year);
  }

  getEntityVariableAtYear(
    entityName: string,
    entityKey: string,
    variableName: string,
    year: string
  ): HouseholdScalar | undefined {
    if (entityName === 'people') {
      return this.getPersonVariableAtYear(entityKey, variableName, year);
    }

    return this.getGroupVariableAtYear(entityName, entityKey, variableName, year);
  }

  getGroupCollection(entityName: string): AppHouseholdInputGroupMap | undefined {
    const groups = getGroupCollectionFromData(this.appInputData, entityName);
    return groups ? cloneValue(groups) : undefined;
  }

  getPreferredGroupName(entityName: string): string | undefined {
    return getPreferredGroupNameFromData(this.appInputData, entityName);
  }

  getGroupMembers(entityName: string, groupKey: string): string[] {
    const groups = getGroupCollectionFromData(this.appInputData, entityName);
    return cloneValue(groups?.[groupKey]?.members ?? []);
  }

  getGroups(entityName: string): HouseholdGroupSummary[] {
    const groups = getGroupCollectionFromData(this.appInputData, entityName);
    if (!groups) {
      return [];
    }

    return Object.entries(groups).map(([key, group]) => ({
      key,
      members: cloneValue(group.members),
    }));
  }

  getAllGroupCollections(): Array<{
    entityName: HouseholdGroupAppKey;
    groups: AppHouseholdInputGroupMap;
  }> {
    return [
      ['households', this.appInputData.households],
      ['families', this.appInputData.families],
      ['taxUnits', this.appInputData.taxUnits],
      ['spmUnits', this.appInputData.spmUnits],
      ['maritalUnits', this.appInputData.maritalUnits],
      ['benunits', this.appInputData.benunits],
    ]
      .filter((entry): entry is [HouseholdGroupAppKey, AppHouseholdInputGroupMap] =>
        Boolean(entry[1])
      )
      .map(([entityName, groups]) => ({ entityName, groups: cloneValue(groups) }));
  }

  getEntityInstanceNames(entityName: string): string[] {
    if (entityName === 'people') {
      return Object.keys(this.appInputData.people);
    }

    return Object.keys(getGroupCollectionFromData(this.appInputData, entityName) ?? {});
  }

  hasEntityInstance(entityName: string, entityKey: string): boolean {
    if (entityName === 'people') {
      return entityKey in this.appInputData.people;
    }

    return entityKey in (getGroupCollectionFromData(this.appInputData, entityName) ?? {});
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
    const defaultEntities = getHouseholdCountryStrategy(countryId).defaultEntities;

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

  setPersonVariableAtYear(
    personKey: string,
    variableName: string,
    year: string,
    value: HouseholdScalar
  ): Household {
    const nextData = cloneAppHouseholdInputData(this.appInputData);
    const person = nextData.people[personKey];

    if (!person) {
      throw new Error(`Person ${personKey} not found`);
    }

    setYearValue(person, variableName, normalizeYear(year), value);

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

  setGroupVariableAtYear(
    entityName: string,
    groupKey: string,
    variableName: string,
    year: string,
    value: HouseholdScalar
  ): Household {
    const nextData = cloneAppHouseholdInputData(this.appInputData);
    const entityKey = normalizeGroupKeyOrThrow(entityName);
    const groups = ensureGroupCollection(nextData, entityKey);

    if (!groups[groupKey]) {
      throw new Error(`Group ${groupKey} not found in ${String(entityKey)}`);
    }

    setYearValue(groups[groupKey], variableName, normalizeYear(year), value);

    return this.withHouseholdData(nextData);
  }

  setEntityVariableAtYear(
    entityName: string,
    entityKey: string,
    variableName: string,
    year: string,
    value: HouseholdScalar
  ): Household {
    if (entityName === 'people') {
      return this.setPersonVariableAtYear(entityKey, variableName, year, value);
    }

    return this.setGroupVariableAtYear(entityName, entityKey, variableName, year, value);
  }

  addEntityVariableIfMissingAtYear(
    entityName: string,
    entityKey: string,
    variableName: string,
    year: string,
    value: HouseholdScalar
  ): Household {
    if (this.getEntityVariableAtYear(entityName, entityKey, variableName, year) !== undefined) {
      return this;
    }

    if (entityName === 'people' && !this.hasEntityInstance(entityName, entityKey)) {
      const nextData = cloneAppHouseholdInputData(this.appInputData);
      nextData.people[entityKey] = {};
      return this.withHouseholdData(nextData).setPersonVariableAtYear(
        entityKey,
        variableName,
        year,
        value
      );
    }

    if (entityName !== 'people' && !this.hasEntityInstance(entityName, entityKey)) {
      const nextData = cloneAppHouseholdInputData(this.appInputData);
      const entityGroupKey = normalizeGroupKeyOrThrow(entityName);
      ensureGroupCollection(nextData, entityGroupKey)[entityKey] = { members: [] };
      return this.withHouseholdData(nextData).setGroupVariableAtYear(
        entityGroupKey,
        entityKey,
        variableName,
        year,
        value
      );
    }

    return this.setEntityVariableAtYear(entityName, entityKey, variableName, year, value);
  }

  removeEntityVariable(entityName: string, entityKey: string, variableName: string): Household {
    const nextData = cloneAppHouseholdInputData(this.appInputData);

    if (entityName === 'people') {
      removeVariableFromEntityData(nextData.people[entityKey], variableName);
      return this.withHouseholdData(nextData);
    }

    const groups = getGroupCollectionFromData(nextData, entityName);
    removeVariableFromEntityData(groups?.[entityKey], variableName);

    return this.withHouseholdData(nextData);
  }

  ensureGroupInstance(entityName: string): { household: Household; groupKey: string } {
    const existingName = this.getPreferredGroupName(entityName);
    if (existingName) {
      return { household: this, groupKey: existingName };
    }

    const entityKey = normalizeGroupKeyOrThrow(entityName);
    const groupDefinition = getGroupDefinitionByAppKey(entityKey);
    if (!groupDefinition) {
      throw new Error(`Unsupported household entity group "${entityName}"`);
    }

    const nextData = cloneAppHouseholdInputData(this.appInputData);
    const groupCollection = ensureGroupCollection(nextData, entityKey);
    let nextIndex = 0;
    let nextName = buildGeneratedGroupName(groupDefinition.generatedKeyPrefix, nextIndex);

    while (nextName in groupCollection) {
      nextIndex += 1;
      nextName = buildGeneratedGroupName(groupDefinition.generatedKeyPrefix, nextIndex);
    }

    groupCollection[nextName] = {
      members: Object.keys(nextData.people).sort((left, right) => left.localeCompare(right)),
    };

    return { household: this.withHouseholdData(nextData), groupKey: nextName };
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

  toPythonPackage(): PythonPackageHouseholdData {
    return buildPythonPackageHouseholdDataFromAppInput({
      householdData: this.appInputData,
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
    getHouseholdCountryStrategy(this.countryId).applyPersonDefaults(
      householdData,
      personKey,
      personType
    );

    return householdData;
  }
}
