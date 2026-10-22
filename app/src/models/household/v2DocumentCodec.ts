import type { CountryId } from '@/libs/countries';
import { Household } from '@/models/Household';
import type {
  V1HouseholdData,
  V1HouseholdGroupData,
  V1HouseholdPersonData,
} from '@/models/household/v1Types';
import type { SPMSelection } from '@/types/spm';
import type {
  V2HouseholdCreateBody,
  V2HouseholdDocument,
  V2HouseholdEntityRecord,
  V2HouseholdItem,
  V2HouseholdPersonRecord,
  V2UKHouseholdDocument,
  V2USHouseholdDocument,
} from '@/types/v2Households';
import { isAssociationCountry } from '@/types/v2User';

/**
 * The app's household model to and from the Public API's v2 household
 * document (`/v2/households`).
 *
 * The document is built exactly as the Public API translates a v1
 * household (`translate_legacy_household`): people and each collection's
 * groups take ids in name order ("person-1", "tax_unit-2"), each keeps its
 * v1 name as `source_name`, each group's members become every person's
 * `memberships`, and the SPM settings move onto the document. So a
 * household v3 saves is the same stored household as the dual-write copy
 * of the identical v1 household: the Public API deduplicates them.
 */

/** A v2 document's collections of groups: every key but its people and its SPM settings. */
type V2GroupCollection = Exclude<
  keyof V2USHouseholdDocument | keyof V2UKHouseholdDocument,
  'people' | 'spm'
>;

/** A v1 household's collections of groups: every key but its people. */
type V1GroupCollection = Exclude<keyof V1HouseholdData, 'people'>;

/** Either country's v2 document, collection by collection: a UK document has no tax units. */
type V2DocumentCollections = Partial<Record<V2GroupCollection, V2HouseholdEntityRecord[]>>;

/** Each country's v2 collections, beside the v1 collection each comes from. */
const COLLECTIONS: Record<
  'us' | 'uk',
  ReadonlyArray<readonly [v2Name: V2GroupCollection, v1Name: V1GroupCollection]>
> = {
  us: [
    ['household', 'households'],
    ['family', 'families'],
    ['tax_unit', 'tax_units'],
    ['spm_unit', 'spm_units'],
    ['marital_unit', 'marital_units'],
  ],
  uk: [
    ['household', 'households'],
    ['benunit', 'benunits'],
  ],
};

/** A group of a collection, as a person "is not in any …": "marital unit". */
const COLLECTION_NOUNS: Record<V2GroupCollection, string> = {
  household: 'household',
  family: 'family',
  tax_unit: 'tax unit',
  spm_unit: 'SPM unit',
  marital_unit: 'marital unit',
  benunit: 'benefit unit',
};

/** A household that cannot be written as, or read from, a v2 document. */
export class V2HouseholdDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'V2HouseholdDocumentError';
  }
}

function collectionsFor(countryId: string) {
  if (!isAssociationCountry(countryId)) {
    throw new V2HouseholdDocumentError(`v2 households are not available for ${countryId}.`);
  }
  return COLLECTIONS[countryId];
}

/**
 * Ids in name order, as the Public API gives them (Python's `sorted`,
 * which orders by code point, as JavaScript's default sort does).
 */
function stableIds(kind: string, names: string[]): Map<string, string> {
  return new Map([...names].sort().map((name, index) => [name, `${kind}-${index + 1}`]));
}

/** A v1 household's data as a v2 document. */
export function v2DocumentFromV1Data(
  countryId: string,
  data: V1HouseholdData,
  spm?: SPMSelection
): V2HouseholdDocument {
  const collections = collectionsFor(countryId);
  const people = data.people ?? {};
  const personNames = Object.keys(people);
  const personIds = stableIds('person', personNames);
  const memberships = new Map<string, Record<string, string>>(
    personNames.map((name) => [name, {}])
  );
  const groupsByCollection: V2DocumentCollections = {};

  for (const [collection, v1Name] of collections) {
    const groups: Record<string, V1HouseholdGroupData> = data[v1Name] ?? {};
    const groupIds = stableIds(collection, Object.keys(groups));
    groupsByCollection[collection] = [...groupIds.keys()].map(
      (groupName): V2HouseholdEntityRecord => {
        const { members, ...values } = groups[groupName];
        for (const member of members ?? []) {
          const personMemberships = memberships.get(member);
          if (!personMemberships) {
            throw new V2HouseholdDocumentError(
              `${groupName} names ${member}, who is not a person.`
            );
          }
          const previous = personMemberships[collection];
          if (previous && previous !== groupIds.get(groupName)) {
            throw new V2HouseholdDocumentError(
              `${member} is in more than one ${COLLECTION_NOUNS[collection]}.`
            );
          }
          personMemberships[collection] = groupIds.get(groupName)!;
        }
        return { id: groupIds.get(groupName)!, source_name: groupName, values };
      }
    );
  }

  const personRecords = [...personIds.keys()].map((name): V2HouseholdPersonRecord => {
    const personMemberships = memberships.get(name)!;
    for (const [collection] of collections) {
      if (!personMemberships[collection]) {
        throw new V2HouseholdDocumentError(
          `${name} is not in any ${COLLECTION_NOUNS[collection]}.`
        );
      }
    }
    return {
      id: personIds.get(name)!,
      source_name: name,
      values: { ...people[name] },
      memberships: personMemberships,
    };
  });
  // The country's collections, as `collectionsFor` lists them, then its people and SPM settings.
  return {
    ...groupsByCollection,
    people: personRecords,
    ...(countryId === 'us' && spm ? { spm } : {}),
  } as V2HouseholdDocument;
}

/** A v2 document as a v1 household's data, named by each record's v1 name (else its id). */
export function v1DataFromV2Document(
  countryId: string,
  document: V2HouseholdDocument
): { data: V1HouseholdData; spm?: SPMSelection } {
  const collections = collectionsFor(countryId);
  const groupsByCollection: V2DocumentCollections = document;
  const nameOf = (record: V2HouseholdEntityRecord) => record.source_name ?? record.id;
  // People in the household builder's order ("you", "your partner", then
  // dependants), not the document's name order.
  const personByName = new Map(document.people.map((person) => [nameOf(person), person]));
  const people = Household.sortPersonNames([...personByName.keys()]).map(
    (name) => personByName.get(name)!
  );
  // Values are passed through as stored: each is keyed by period, as in a v1 household.
  const data: V1HouseholdData = {
    people: Object.fromEntries(
      people.map((person) => [nameOf(person), { ...person.values } as V1HouseholdPersonData])
    ),
  };
  for (const [collection, v1Name] of collections) {
    const groups = groupsByCollection[collection] ?? [];
    data[v1Name] = Object.fromEntries(
      groups.map((group) => [
        nameOf(group),
        {
          members: people
            .filter((person) => person.memberships[collection] === group.id)
            .map(nameOf),
          ...group.values,
        } as V1HouseholdGroupData,
      ])
    );
  }
  const spm = 'spm' in document ? document.spm : undefined;
  return { data, ...(spm ? { spm } : {}) };
}

/** What `POST /v2/households` takes for a household: its content, in its year, without its label. */
export function householdToV2CreateBody(household: Household): V2HouseholdCreateBody {
  const countryId = household.countryId;
  collectionsFor(countryId);
  const payload = household.toV1CreationPayload();
  const year = household.year;
  if (year === null || !Number.isInteger(year)) {
    throw new V2HouseholdDocumentError('The household has no year to save it in.');
  }
  return {
    country_id: countryId as V2HouseholdCreateBody['country_id'],
    default_year: year,
    household_data: v2DocumentFromV1Data(countryId, payload.data, payload.spm),
  };
}

/** JSON with every object's keys sorted, so the order keys were set in never reads as a change. */
function sortedKeyJson(value: unknown): string {
  return JSON.stringify(value, (_key, nested) =>
    nested && typeof nested === 'object' && !Array.isArray(nested)
      ? Object.fromEntries(
          Object.keys(nested)
            .sort()
            .map((name) => [name, (nested as Record<string, unknown>)[name]])
        )
      : nested
  );
}

/**
 * Whether two households would be the same stored household: compared as
 * `POST /v2/households` takes them, whatever their ids, labels and the
 * order of their people, groups and inputs. A household read back from
 * the Public API lists its groups in name order, so it can differ in order
 * alone from the same household as the builder holds it.
 */
export function haveSameStoredContent(first: Household, second: Household): boolean {
  try {
    return (
      sortedKeyJson(householdToV2CreateBody(first)) ===
      sortedKeyJson(householdToV2CreateBody(second))
    );
  } catch {
    // A household that cannot be stored is compared as changed; saving it says why.
    return false;
  }
}

/**
 * A stored v2 household as the app's household model, with the stored id,
 * in the stored default year: not the latest year its values name, which
 * differs for inputs in several years, and which values without a year
 * do not give.
 */
export function householdFromV2Item(item: V2HouseholdItem): Household {
  const { data, spm } = v1DataFromV2Document(item.country_id, item.household_data);
  const household = Household.fromV1CreationPayload(
    { country_id: item.country_id as CountryId, data, ...(spm ? { spm } : {}) },
    { id: item.id }
  );
  return Household.fromAppInput({ ...household.toJSON(), year: item.default_year });
}
