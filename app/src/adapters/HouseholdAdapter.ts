import { countryIds } from '@/libs/countries';
import { store } from '@/store';
import { Household, HouseholdData } from '@/types/ingredients/Household';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { HouseholdCreationPayload } from '@/types/payloads';

/**
 * Get entity metadata from the Redux store
 */
function getEntityMetadata() {
  const state = store.getState();
  return state.metadata?.entities || {};
}

/**
 * Convert entity name from camelCase to snake_case plural form using metadata
 */
function getEntityPluralKey(entityName: string): string | null {
  const entities = getEntityMetadata();

  // Special case for 'people' which is already plural
  if (entityName === 'people') {
    return 'people';
  }

  // Look for an entity whose plural matches the entityName
  for (const [_key, entity] of Object.entries(entities)) {
    if ((entity as any).plural === entityName) {
      return entityName;
    }
  }

  // Try to find by converting camelCase to snake_case
  // e.g., 'taxUnits' -> 'tax_units', 'maritalUnits' -> 'marital_units'
  const snakeCase = entityName.replace(/([A-Z])/g, '_$1').toLowerCase();
  for (const [_key, entity] of Object.entries(entities)) {
    if ((entity as any).plural === snakeCase) {
      return snakeCase;
    }
  }

  return null;
}

/**
 * Validate that an entity name exists in metadata
 */
function validateEntityName(entityName: string): void {
  if (entityName === 'people') {
    return; // People is always valid
  }

  const pluralKey = getEntityPluralKey(entityName);
  if (!pluralKey) {
    const entities = getEntityMetadata();
    const validEntities = Object.values(entities)
      .map((e: any) => e.plural)
      .join(', ');
    throw new Error(`Unknown entity "${entityName}". Valid entities are: people, ${validEntities}`);
  }
}

/**
 * Adapter to convert between API format (HouseholdMetadata) and internal format (Household)
 */
export class HouseholdAdapter {
  /**
   * Convert API response to internal Household format
   * Dynamically handles all entity types based on metadata
   */
  static fromMetadata(metadata: HouseholdMetadata): Household {
    const householdData: HouseholdData = {
      people: metadata.household_json.people as any,
    };

    // Iterate over all keys in household_json
    for (const [key, value] of Object.entries(metadata.household_json)) {
      if (key === 'people') {
        continue; // Already handled
      }

      // Try to validate the entity exists in metadata
      try {
        validateEntityName(key);
        // Convert snake_case to camelCase for internal representation
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        householdData[camelKey] = value as any;
      } catch {
        // If entity not found in metadata, still include it
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        householdData[camelKey] = value as any;
      }
    }

    return {
      id: metadata.id,
      countryId: metadata.country_id as (typeof countryIds)[number],
      householdData,
    };
  }

  /**
   * Create a minimal Household for creation requests
   * Dynamically handles all entity types based on metadata
   */
  static toCreationPayload(
    householdData: HouseholdData,
    countryId: string
  ): HouseholdCreationPayload {
    const household_json: any = {
      people: householdData.people as any,
    };

    // Iterate over all keys in householdData
    for (const [key, value] of Object.entries(householdData)) {
      if (key === 'people') {
        continue; // Already handled
      }

      // Get the plural form from metadata
      const pluralKey = getEntityPluralKey(key);
      if (pluralKey) {
        household_json[pluralKey] = value as any;
      } else {
        // If not found in metadata, try snake_case conversion
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        household_json[snakeKey] = value as any;
      }
    }

    return {
      country_id: countryId,
      data: household_json,
    };
  }
}
