/**
 * Hook for getting basic input fields categorized by entity type
 *
 * This hook combines static metadata (basicInputs, entities) with Redux-stored
 * variables to produce a categorized object of input field names for the
 * household builder.
 *
 * ## Usage
 *
 * ```typescript
 * import { useBasicInputFields } from '@/hooks/useBasicInputFields';
 *
 * // Get basic input fields categorized by entity
 * const basicInputFields = useBasicInputFields('us');
 * // { person: ['age', 'employment_income'], tax_unit: [...], ... }
 * ```
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useBasicInputs, useEntities } from './useStaticMetadata';

/**
 * Get basic input fields categorized by entity type
 *
 * Combines static basicInputs and entities with Redux-stored variables
 * to produce a categorized object of input field names.
 *
 * @param countryId - Country code ('us' or 'uk')
 * @returns Object with entity types as keys and arrays of field names as values
 */
export function useBasicInputFields(countryId: string) {
  const basicInputs = useBasicInputs(countryId);
  const entities = useEntities(countryId);
  const variables = useSelector((state: RootState) => state.metadata.variables);

  return useMemo(() => {
    const inputs = basicInputs || [];

    // Dynamically build categories from metadata entities (country-agnostic)
    // This handles US entities (tax_unit, spm_unit, etc.) and UK entities (benunit) automatically
    const categorized: Record<string, string[]> = {};

    // Initialize categories from available entities in metadata
    if (entities) {
      for (const [entityType, entityInfo] of Object.entries(entities)) {
        // Use 'person' as the key for person entities, otherwise use the entity type
        const key = (entityInfo as any).is_person ? 'person' : entityType;
        categorized[key] = [];
      }
    }

    // Categorize each field by looking up its entity in metadata
    for (const field of inputs) {
      const variable = variables?.[field];
      if (!variable) {
        continue;
      }

      const entityType = variable.entity;
      const entityInfo = entities?.[entityType];

      if (!entityInfo) {
        // Unknown entity - skip field with warning
        console.warn(
          `[useBasicInputFields] Unknown entity type "${entityType}" for field "${field}"`
        );
        continue;
      }

      // Use 'person' as the key for person entities, otherwise use the entity type
      const key = (entityInfo as any).is_person ? 'person' : entityType;

      if (!categorized[key]) {
        categorized[key] = [];
      }
      categorized[key].push(field);
    }

    return categorized;
  }, [basicInputs, entities, variables]);
}
