import { describe, expect, it } from 'vitest';
import { getEntities, US_ENTITIES, UK_ENTITIES } from '@/data/static/entities';
import {
  TEST_COUNTRIES,
  EXPECTED_US_ENTITY_KEYS,
  EXPECTED_UK_ENTITY_KEYS,
  EXPECTED_ENTITY_PROPERTIES,
} from '@/tests/fixtures/data/static/staticDataMocks';

describe('entities', () => {
  describe('US_ENTITIES', () => {
    it('given US entities then contains all expected entity types', () => {
      // When
      const entityKeys = Object.keys(US_ENTITIES);

      // Then
      expect(entityKeys).toEqual(expect.arrayContaining([...EXPECTED_US_ENTITY_KEYS]));
      expect(entityKeys.length).toBe(EXPECTED_US_ENTITY_KEYS.length);
    });

    it('given US entities then person has is_person flag', () => {
      // When
      const person = US_ENTITIES.person;

      // Then
      expect(person.is_person).toBe(true);
      expect(person.label).toBe(EXPECTED_ENTITY_PROPERTIES.PERSON.label);
      expect(person.plural).toBe(EXPECTED_ENTITY_PROPERTIES.PERSON.plural);
    });

    it('given US entities then tax_unit has correct properties', () => {
      // When
      const taxUnit = US_ENTITIES.tax_unit;

      // Then
      expect(taxUnit.label).toBe(EXPECTED_ENTITY_PROPERTIES.TAX_UNIT.label);
      expect(taxUnit.plural).toBe(EXPECTED_ENTITY_PROPERTIES.TAX_UNIT.plural);
      expect(taxUnit.is_person).toBeUndefined();
    });
  });

  describe('UK_ENTITIES', () => {
    it('given UK entities then contains all expected entity types', () => {
      // When
      const entityKeys = Object.keys(UK_ENTITIES);

      // Then
      expect(entityKeys).toEqual(expect.arrayContaining([...EXPECTED_UK_ENTITY_KEYS]));
      expect(entityKeys.length).toBe(EXPECTED_UK_ENTITY_KEYS.length);
    });

    it('given UK entities then person has is_person flag', () => {
      // When
      const person = UK_ENTITIES.person;

      // Then
      expect(person.is_person).toBe(true);
    });

    it('given UK entities then benunit has correct properties', () => {
      // When
      const benunit = UK_ENTITIES.benunit;

      // Then
      expect(benunit.label).toBe(EXPECTED_ENTITY_PROPERTIES.BENUNIT.label);
      expect(benunit.plural).toBe(EXPECTED_ENTITY_PROPERTIES.BENUNIT.plural);
    });
  });

  describe('getEntities', () => {
    it('given US country code then returns US entities', () => {
      // When
      const entities = getEntities(TEST_COUNTRIES.US);

      // Then
      expect(entities).toBe(US_ENTITIES);
    });

    it('given UK country code then returns UK entities', () => {
      // When
      const entities = getEntities(TEST_COUNTRIES.UK);

      // Then
      expect(entities).toBe(UK_ENTITIES);
    });

    it('given unknown country code then returns empty object', () => {
      // When
      const entities = getEntities(TEST_COUNTRIES.UNKNOWN);

      // Then
      expect(entities).toEqual({});
    });
  });
});
