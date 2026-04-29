import type { CountryId } from '@/libs/countries';

export type HouseholdGroupAppKey =
  | 'households'
  | 'families'
  | 'taxUnits'
  | 'spmUnits'
  | 'maritalUnits'
  | 'benunits';

export type HouseholdGroupV1Key =
  | 'households'
  | 'families'
  | 'tax_units'
  | 'spm_units'
  | 'marital_units'
  | 'benunits';

export type HouseholdGroupV2Key =
  | 'household'
  | 'family'
  | 'tax_unit'
  | 'spm_unit'
  | 'marital_unit'
  | 'benunit';

export type V2CountryId = 'us' | 'uk';

export interface HouseholdGroupDefinition {
  appKey: HouseholdGroupAppKey;
  v1Key: HouseholdGroupV1Key;
  v2Key: HouseholdGroupV2Key;
  personLinkKey: string;
  groupIdKey: string;
  generatedKeyPrefix: string;
}

export type HouseholdDefaultEntityKey = 'people' | HouseholdGroupAppKey;

export const GROUP_DEFINITIONS: readonly HouseholdGroupDefinition[] = [
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

const DEFAULT_COUNTRY_GROUP_DEFINITIONS = GROUP_DEFINITIONS.filter(
  (definition) => definition.appKey === 'households'
);

export const HOUSEHOLD_GROUP_DEFINITIONS_BY_COUNTRY: Record<
  CountryId,
  readonly HouseholdGroupDefinition[]
> = {
  us: GROUP_DEFINITIONS.filter((definition) => definition.appKey !== 'benunits'),
  uk: GROUP_DEFINITIONS.filter(
    (definition) => definition.appKey === 'households' || definition.appKey === 'benunits'
  ),
  ca: DEFAULT_COUNTRY_GROUP_DEFINITIONS,
  ng: DEFAULT_COUNTRY_GROUP_DEFINITIONS,
  il: DEFAULT_COUNTRY_GROUP_DEFINITIONS,
};

export const V2_GROUP_DEFINITIONS_BY_COUNTRY: Record<
  V2CountryId,
  readonly HouseholdGroupDefinition[]
> = {
  us: HOUSEHOLD_GROUP_DEFINITIONS_BY_COUNTRY.us,
  uk: HOUSEHOLD_GROUP_DEFINITIONS_BY_COUNTRY.uk,
};

export const HOUSEHOLD_HEAD_GROUP_PRIORITY: readonly HouseholdGroupAppKey[] = [
  'taxUnits',
  'benunits',
  'households',
  'families',
  'spmUnits',
  'maritalUnits',
];

const GROUP_DEFINITION_BY_APP_KEY = new Map(
  GROUP_DEFINITIONS.map((definition) => [definition.appKey, definition])
);
const GROUP_DEFINITION_BY_V1_KEY = new Map(
  GROUP_DEFINITIONS.map((definition) => [definition.v1Key, definition])
);

export const KNOWN_APP_ENTITY_KEYS = new Set<string>([
  'people',
  ...GROUP_DEFINITIONS.map((definition) => definition.appKey),
]);

export const KNOWN_V1_ENTITY_KEYS = new Set<string>([
  'people',
  ...GROUP_DEFINITIONS.map((definition) => definition.v1Key),
]);

export const PERSON_LINK_KEYS = new Set(
  GROUP_DEFINITIONS.map((definition) => definition.personLinkKey)
);
export const GROUP_ID_KEYS = new Set(GROUP_DEFINITIONS.map((definition) => definition.groupIdKey));
export const PERSON_META_KEYS = new Set(['name', 'person_id', ...PERSON_LINK_KEYS]);
export const GROUP_META_KEYS = new Set(['members', ...GROUP_ID_KEYS]);

export function getGroupDefinitionByAppKey(key: string): HouseholdGroupDefinition | undefined {
  return GROUP_DEFINITION_BY_APP_KEY.get(key as HouseholdGroupAppKey);
}

export function normalizeHouseholdGroupAppKey(
  entityName: string
): HouseholdGroupAppKey | undefined {
  switch (entityName) {
    case 'households':
    case 'families':
    case 'taxUnits':
    case 'spmUnits':
    case 'maritalUnits':
    case 'benunits':
      return entityName;
    case 'tax_units':
      return 'taxUnits';
    case 'spm_units':
      return 'spmUnits';
    case 'marital_units':
      return 'maritalUnits';
    default:
      return undefined;
  }
}

export function getGroupDefinitionByV1Key(key: string): HouseholdGroupDefinition | undefined {
  return GROUP_DEFINITION_BY_V1_KEY.get(key as HouseholdGroupV1Key);
}

export function buildGeneratedGroupName(prefix: string, index: number): string {
  return `${prefix}${index + 1}`;
}

export function getHouseholdGroupDefinitions(
  countryId: CountryId
): readonly HouseholdGroupDefinition[] {
  return HOUSEHOLD_GROUP_DEFINITIONS_BY_COUNTRY[countryId] ?? DEFAULT_COUNTRY_GROUP_DEFINITIONS;
}

export function isHouseholdGroupEntityConfigured(
  countryId: CountryId,
  entityName: string
): entityName is HouseholdGroupAppKey {
  const entityKey = normalizeHouseholdGroupAppKey(entityName);
  if (!entityKey) {
    return false;
  }

  return getHouseholdGroupDefinitions(countryId).some(
    (definition) => definition.appKey === entityKey
  );
}

export function getHouseholdDefaultEntityKeys(
  countryId: CountryId
): readonly HouseholdDefaultEntityKey[] {
  return [
    'people',
    ...getHouseholdGroupDefinitions(countryId).map((definition) => definition.appKey),
  ];
}

export function getHouseholdHeadGroupKeys(countryId: CountryId): readonly HouseholdGroupAppKey[] {
  const configuredGroups = new Set(
    getHouseholdGroupDefinitions(countryId).map((definition) => definition.appKey)
  );

  return HOUSEHOLD_HEAD_GROUP_PRIORITY.filter((groupName) => configuredGroups.has(groupName));
}

export function getV2GroupDefinitions(countryId: V2CountryId): readonly HouseholdGroupDefinition[] {
  return V2_GROUP_DEFINITIONS_BY_COUNTRY[countryId];
}
