import { describe, expect, it } from 'vitest';
import { MetadataAdapter } from '@/adapters/MetadataAdapter';
import {
  createMockVariable,
  createMockVariables,
  createMockParameter,
  createMockParameters,
  createMockDataset,
  createMockDatasets,
  createMockParameterValue,
  createMockParameterValues,
  TEST_POLICY_IDS,
} from '@/tests/fixtures/api/v2/apiV2Mocks';

describe('MetadataAdapter', () => {
  describe('variableFromV2', () => {
    it('given V2 variable then converts to VariableMetadata', () => {
      // Given
      const v2Variable = createMockVariable({
        id: 'var-123',
        name: 'employment_income',
        entity: 'person',
        description: 'Employment income',
      });

      // When
      const result = MetadataAdapter.variableFromV2(v2Variable);

      // Then
      expect(result.id).toBe('var-123');
      expect(result.name).toBe('employment_income');
      expect(result.entity).toBe('person');
      expect(result.description).toBe('Employment income');
    });

    it('given variable name with underscores then generates title-case label', () => {
      // Given
      const v2Variable = createMockVariable({ name: 'employment_income' });

      // When
      const result = MetadataAdapter.variableFromV2(v2Variable);

      // Then
      expect(result.label).toBe('Employment Income');
    });

    it('given single word name then capitalizes label', () => {
      // Given
      const v2Variable = createMockVariable({ name: 'age' });

      // When
      const result = MetadataAdapter.variableFromV2(v2Variable);

      // Then
      expect(result.label).toBe('Age');
    });
  });

  describe('variablesFromV2', () => {
    it('given array of V2 variables then converts to keyed record', () => {
      // Given
      const v2Variables = createMockVariables(3);

      // When
      const result = MetadataAdapter.variablesFromV2(v2Variables);

      // Then
      expect(Object.keys(result)).toHaveLength(3);
      expect(result['variable_0']).toBeDefined();
      expect(result['variable_1']).toBeDefined();
      expect(result['variable_2']).toBeDefined();
    });

    it('given empty array then returns empty record', () => {
      // Given
      const v2Variables: ReturnType<typeof createMockVariable>[] = [];

      // When
      const result = MetadataAdapter.variablesFromV2(v2Variables);

      // Then
      expect(result).toEqual({});
    });
  });

  describe('parameterFromV2', () => {
    it('given V2 parameter then converts to ParameterMetadata', () => {
      // Given
      const v2Parameter = createMockParameter({
        id: 'param-123',
        name: 'tax.rate',
        label: 'Tax Rate',
        description: 'Standard tax rate',
        unit: '/1',
      });

      // When
      const result = MetadataAdapter.parameterFromV2(v2Parameter);

      // Then
      expect(result.id).toBe('param-123');
      expect(result.name).toBe('tax.rate');
      expect(result.label).toBe('Tax Rate');
      expect(result.description).toBe('Standard tax rate');
      expect(result.unit).toBe('/1');
    });

    it('given V2 parameter then sets parameter path from name', () => {
      // Given
      const v2Parameter = createMockParameter({ name: 'gov.tax.income.rate' });

      // When
      const result = MetadataAdapter.parameterFromV2(v2Parameter);

      // Then
      expect(result.parameter).toBe('gov.tax.income.rate');
    });

    it('given V2 parameter then sets type to parameter', () => {
      // Given
      const v2Parameter = createMockParameter();

      // When
      const result = MetadataAdapter.parameterFromV2(v2Parameter);

      // Then
      expect(result.type).toBe('parameter');
    });

    it('given V2 parameter then initializes values as empty object', () => {
      // Given
      const v2Parameter = createMockParameter();

      // When
      const result = MetadataAdapter.parameterFromV2(v2Parameter);

      // Then
      expect(result.values).toEqual({});
    });
  });

  describe('parametersFromV2', () => {
    it('given array of V2 parameters then converts to keyed record', () => {
      // Given
      const v2Parameters = createMockParameters(3);

      // When
      const result = MetadataAdapter.parametersFromV2(v2Parameters);

      // Then
      expect(Object.keys(result)).toHaveLength(3);
      expect(result['test.param_0']).toBeDefined();
      expect(result['test.param_1']).toBeDefined();
      expect(result['test.param_2']).toBeDefined();
    });

    it('given empty array then returns empty record', () => {
      // Given
      const v2Parameters: ReturnType<typeof createMockParameter>[] = [];

      // When
      const result = MetadataAdapter.parametersFromV2(v2Parameters);

      // Then
      expect(result).toEqual({});
    });
  });

  describe('datasetFromV2', () => {
    it('given V2 dataset then converts to DatasetEntry', () => {
      // Given
      const v2Dataset = createMockDataset({
        name: 'cps_2024',
        description: 'Current Population Survey 2024',
      });

      // When
      const result = MetadataAdapter.datasetFromV2(v2Dataset, false);

      // Then
      expect(result.name).toBe('cps_2024');
      expect(result.label).toBe('cps_2024');
      expect(result.title).toBe('Current Population Survey 2024');
      expect(result.default).toBe(false);
    });

    it('given isDefault true then sets default flag', () => {
      // Given
      const v2Dataset = createMockDataset();

      // When
      const result = MetadataAdapter.datasetFromV2(v2Dataset, true);

      // Then
      expect(result.default).toBe(true);
    });

    it('given dataset without description then uses name as title', () => {
      // Given
      const v2Dataset = createMockDataset({ name: 'cps_2024', description: '' });

      // When
      const result = MetadataAdapter.datasetFromV2(v2Dataset, false);

      // Then
      expect(result.title).toBe('cps_2024');
    });
  });

  describe('datasetsFromV2', () => {
    it('given array of V2 datasets then first is marked as default', () => {
      // Given
      const v2Datasets = createMockDatasets(3);

      // When
      const result = MetadataAdapter.datasetsFromV2(v2Datasets);

      // Then
      expect(result).toHaveLength(3);
      expect(result[0].default).toBe(true);
      expect(result[1].default).toBe(false);
      expect(result[2].default).toBe(false);
    });

    it('given empty array then returns empty array', () => {
      // Given
      const v2Datasets: ReturnType<typeof createMockDataset>[] = [];

      // When
      const result = MetadataAdapter.datasetsFromV2(v2Datasets);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('parameterValuesFromV2', () => {
    it('given V2 parameter values then converts to ValuesList', () => {
      // Given (note: API returns ISO timestamps like "2020-01-01T00:00:00")
      const v2Values = [
        createMockParameterValue({ start_date: '2020-01-01T00:00:00', value_json: 100 }),
        createMockParameterValue({ start_date: '2021-01-01T00:00:00', value_json: 110 }),
        createMockParameterValue({ start_date: '2022-01-01T00:00:00', value_json: 120 }),
      ];

      // When
      const result = MetadataAdapter.parameterValuesFromV2(v2Values);

      // Then (dates are converted to YYYY-MM-DD format)
      expect(result).toEqual({
        '2020-01-01': 100,
        '2021-01-01': 110,
        '2022-01-01': 120,
      });
    });

    it('given empty array then returns empty object', () => {
      // Given
      const v2Values: ReturnType<typeof createMockParameterValue>[] = [];

      // When
      const result = MetadataAdapter.parameterValuesFromV2(v2Values);

      // Then
      expect(result).toEqual({});
    });

    it('given values with different types then preserves types', () => {
      // Given
      const v2Values = [
        createMockParameterValue({ start_date: '2020-01-01T00:00:00', value_json: 100 }),
        createMockParameterValue({ start_date: '2021-01-01T00:00:00', value_json: 0.25 }),
        createMockParameterValue({ start_date: '2022-01-01T00:00:00', value_json: true }),
      ];

      // When
      const result = MetadataAdapter.parameterValuesFromV2(v2Values);

      // Then
      expect(result['2020-01-01']).toBe(100);
      expect(result['2021-01-01']).toBe(0.25);
      expect(result['2022-01-01']).toBe(true);
    });

    it('given values from factory then converts correctly', () => {
      // Given
      const v2Values = createMockParameterValues(3, 'param-1', TEST_POLICY_IDS.BASELINE);

      // When
      const result = MetadataAdapter.parameterValuesFromV2(v2Values);

      // Then
      expect(Object.keys(result)).toHaveLength(3);
      expect(result['2020-01-01']).toBe(100);
      expect(result['2021-01-01']).toBe(110);
      expect(result['2022-01-01']).toBe(120);
    });
  });
});
