import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createMockVariables,
  createMockParameters,
  createMockParameterValues,
  createMockDatasets,
  createMockCacheMetadata,
  createMockVariable,
  createMockParameter,
  TEST_COUNTRIES,
  TEST_VERSIONS,
} from '@/tests/fixtures/storage/storageMocks';

// Mock the database module
vi.mock('@/storage/metadataDb', () => {
  const mockTable = {
    bulkPut: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    toArray: vi.fn().mockResolvedValue([]),
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(0),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
  };

  return {
    db: {
      variables: { ...mockTable },
      parameters: { ...mockTable },
      parameterValues: { ...mockTable },
      datasets: { ...mockTable },
      cacheMetadata: { ...mockTable },
      transaction: vi.fn((mode, tables, callback) => callback()),
    },
  };
});

// Import after mock setup
import { db } from '@/storage/metadataDb';
import {
  bulkLoadVariables,
  bulkLoadParameters,
  bulkLoadParameterValues,
  clearAndLoadVariables,
  clearAndLoadParameters,
  clearAndLoadParameterValues,
  clearAndLoadDatasets,
  getAllVariables,
  getAllParameters,
  getAllParameterValues,
  getAllDatasets,
  getVariablesByVersion,
  getParametersByVersion,
  getParameterValues,
  getVariableByName,
  getParameterByName,
  getCacheMetadata,
  setCacheMetadata,
  clearVersionData,
  getStoreCounts,
  clearAllStores,
} from '@/storage/metadataBulkLoader';

describe('metadataBulkLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('bulkLoadVariables', () => {
    it('given empty array then returns 0 without database call', async () => {
      // When
      const result = await bulkLoadVariables([]);

      // Then
      expect(result).toBe(0);
      expect(db.variables.bulkPut).not.toHaveBeenCalled();
    });

    it('given array of variables then calls bulkPut and returns count', async () => {
      // Given
      const variables = createMockVariables(5);

      // When
      const result = await bulkLoadVariables(variables);

      // Then
      expect(result).toBe(5);
      expect(db.variables.bulkPut).toHaveBeenCalledWith(variables);
    });
  });

  describe('bulkLoadParameters', () => {
    it('given empty array then returns 0 without database call', async () => {
      // When
      const result = await bulkLoadParameters([]);

      // Then
      expect(result).toBe(0);
      expect(db.parameters.bulkPut).not.toHaveBeenCalled();
    });

    it('given array of parameters then calls bulkPut and returns count', async () => {
      // Given
      const parameters = createMockParameters(3);

      // When
      const result = await bulkLoadParameters(parameters);

      // Then
      expect(result).toBe(3);
      expect(db.parameters.bulkPut).toHaveBeenCalledWith(parameters);
    });
  });

  describe('bulkLoadParameterValues', () => {
    it('given empty array then returns 0 without database call', async () => {
      // When
      const result = await bulkLoadParameterValues([]);

      // Then
      expect(result).toBe(0);
      expect(db.parameterValues.bulkPut).not.toHaveBeenCalled();
    });

    it('given array of parameter values then calls bulkPut and returns count', async () => {
      // Given
      const parameterValues = createMockParameterValues(5);

      // When
      const result = await bulkLoadParameterValues(parameterValues);

      // Then
      expect(result).toBe(5);
      expect(db.parameterValues.bulkPut).toHaveBeenCalledWith(parameterValues);
    });
  });

  describe('clearAndLoadVariables', () => {
    it('given array of variables then clears and loads in transaction', async () => {
      // Given
      const variables = createMockVariables(10);

      // When
      const result = await clearAndLoadVariables(variables);

      // Then
      expect(result).toBe(10);
      expect(db.transaction).toHaveBeenCalled();
      expect(db.variables.clear).toHaveBeenCalled();
      expect(db.variables.bulkPut).toHaveBeenCalledWith(variables);
    });
  });

  describe('clearAndLoadParameters', () => {
    it('given array of parameters then clears and loads in transaction', async () => {
      // Given
      const parameters = createMockParameters(7);

      // When
      const result = await clearAndLoadParameters(parameters);

      // Then
      expect(result).toBe(7);
      expect(db.transaction).toHaveBeenCalled();
      expect(db.parameters.clear).toHaveBeenCalled();
      expect(db.parameters.bulkPut).toHaveBeenCalledWith(parameters);
    });
  });

  describe('clearAndLoadParameterValues', () => {
    it('given array of parameter values then clears and loads in transaction', async () => {
      // Given
      const parameterValues = createMockParameterValues(10);

      // When
      const result = await clearAndLoadParameterValues(parameterValues);

      // Then
      expect(result).toBe(10);
      expect(db.transaction).toHaveBeenCalled();
      expect(db.parameterValues.clear).toHaveBeenCalled();
      expect(db.parameterValues.bulkPut).toHaveBeenCalledWith(parameterValues);
    });
  });

  describe('clearAndLoadDatasets', () => {
    it('given array of datasets then clears and loads in transaction', async () => {
      // Given
      const datasets = createMockDatasets(3);

      // When
      const result = await clearAndLoadDatasets(datasets);

      // Then
      expect(result).toBe(3);
      expect(db.transaction).toHaveBeenCalled();
      expect(db.datasets.clear).toHaveBeenCalled();
      expect(db.datasets.bulkPut).toHaveBeenCalledWith(datasets);
    });
  });

  describe('getAllVariables', () => {
    it('given database with variables then returns all variables', async () => {
      // Given
      const variables = createMockVariables(5);
      vi.mocked(db.variables.toArray).mockResolvedValue(variables);

      // When
      const result = await getAllVariables();

      // Then
      expect(result).toEqual(variables);
      expect(db.variables.toArray).toHaveBeenCalled();
    });
  });

  describe('getAllParameters', () => {
    it('given database with parameters then returns all parameters', async () => {
      // Given
      const parameters = createMockParameters(3);
      vi.mocked(db.parameters.toArray).mockResolvedValue(parameters);

      // When
      const result = await getAllParameters();

      // Then
      expect(result).toEqual(parameters);
      expect(db.parameters.toArray).toHaveBeenCalled();
    });
  });

  describe('getAllDatasets', () => {
    it('given database with datasets then returns all datasets', async () => {
      // Given
      const datasets = createMockDatasets(2);
      vi.mocked(db.datasets.toArray).mockResolvedValue(datasets);

      // When
      const result = await getAllDatasets();

      // Then
      expect(result).toEqual(datasets);
      expect(db.datasets.toArray).toHaveBeenCalled();
    });
  });

  describe('getAllParameterValues', () => {
    it('given database with parameter values then returns all parameter values', async () => {
      // Given
      const parameterValues = createMockParameterValues(5);
      vi.mocked(db.parameterValues.toArray).mockResolvedValue(parameterValues);

      // When
      const result = await getAllParameterValues();

      // Then
      expect(result).toEqual(parameterValues);
      expect(db.parameterValues.toArray).toHaveBeenCalled();
    });
  });

  describe('getVariablesByVersion', () => {
    it('given version id then queries variables by version', async () => {
      // Given
      const variables = createMockVariables(3);
      vi.mocked(db.variables.where).mockReturnThis();
      vi.mocked(db.variables.equals).mockReturnThis();
      vi.mocked(db.variables.toArray).mockResolvedValue(variables);

      // When
      const result = await getVariablesByVersion(TEST_VERSIONS.US_VERSION_ID);

      // Then
      expect(result).toEqual(variables);
      expect(db.variables.where).toHaveBeenCalledWith('tax_benefit_model_version_id');
      expect(db.variables.equals).toHaveBeenCalledWith(TEST_VERSIONS.US_VERSION_ID);
    });
  });

  describe('getParametersByVersion', () => {
    it('given version id then queries parameters by version', async () => {
      // Given
      const parameters = createMockParameters(3);
      vi.mocked(db.parameters.where).mockReturnThis();
      vi.mocked(db.parameters.equals).mockReturnThis();
      vi.mocked(db.parameters.toArray).mockResolvedValue(parameters);

      // When
      const result = await getParametersByVersion(TEST_VERSIONS.US_VERSION_ID);

      // Then
      expect(result).toEqual(parameters);
      expect(db.parameters.where).toHaveBeenCalledWith('tax_benefit_model_version_id');
      expect(db.parameters.equals).toHaveBeenCalledWith(TEST_VERSIONS.US_VERSION_ID);
    });
  });

  describe('getParameterValues', () => {
    it('given parameter id then queries parameter values by parameter id', async () => {
      // Given
      const parameterValues = createMockParameterValues(2);
      vi.mocked(db.parameterValues.where).mockReturnThis();
      vi.mocked(db.parameterValues.equals).mockReturnThis();
      vi.mocked(db.parameterValues.toArray).mockResolvedValue(parameterValues);

      // When
      const result = await getParameterValues('param-1');

      // Then
      expect(result).toEqual(parameterValues);
      expect(db.parameterValues.where).toHaveBeenCalledWith('parameter_id');
      expect(db.parameterValues.equals).toHaveBeenCalledWith('param-1');
    });
  });

  describe('getVariableByName', () => {
    it('given variable name then queries and returns variable', async () => {
      // Given
      const variable = createMockVariable({ name: 'income_tax' });
      vi.mocked(db.variables.where).mockReturnThis();
      vi.mocked(db.variables.equals).mockReturnThis();
      vi.mocked(db.variables.first).mockResolvedValue(variable);

      // When
      const result = await getVariableByName('income_tax');

      // Then
      expect(result).toEqual(variable);
      expect(db.variables.where).toHaveBeenCalledWith('name');
      expect(db.variables.equals).toHaveBeenCalledWith('income_tax');
    });

    it('given non-existent variable name then returns undefined', async () => {
      // Given
      vi.mocked(db.variables.where).mockReturnThis();
      vi.mocked(db.variables.equals).mockReturnThis();
      vi.mocked(db.variables.first).mockResolvedValue(undefined);

      // When
      const result = await getVariableByName('non_existent');

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getParameterByName', () => {
    it('given parameter name then queries and returns parameter', async () => {
      // Given
      const parameter = createMockParameter({ name: 'basic_rate' });
      vi.mocked(db.parameters.where).mockReturnThis();
      vi.mocked(db.parameters.equals).mockReturnThis();
      vi.mocked(db.parameters.first).mockResolvedValue(parameter);

      // When
      const result = await getParameterByName('basic_rate');

      // Then
      expect(result).toEqual(parameter);
      expect(db.parameters.where).toHaveBeenCalledWith('name');
      expect(db.parameters.equals).toHaveBeenCalledWith('basic_rate');
    });

    it('given non-existent parameter name then returns undefined', async () => {
      // Given
      vi.mocked(db.parameters.where).mockReturnThis();
      vi.mocked(db.parameters.equals).mockReturnThis();
      vi.mocked(db.parameters.first).mockResolvedValue(undefined);

      // When
      const result = await getParameterByName('non_existent');

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('clearVersionData', () => {
    it('given version id then clears variables and parameters for that version', async () => {
      // Given
      vi.mocked(db.variables.where).mockReturnThis();
      vi.mocked(db.variables.equals).mockReturnThis();
      vi.mocked(db.parameters.where).mockReturnThis();
      vi.mocked(db.parameters.equals).mockReturnThis();

      // When
      await clearVersionData(TEST_VERSIONS.US_VERSION_ID);

      // Then
      expect(db.transaction).toHaveBeenCalled();
      expect(db.variables.where).toHaveBeenCalledWith('tax_benefit_model_version_id');
      expect(db.variables.equals).toHaveBeenCalledWith(TEST_VERSIONS.US_VERSION_ID);
      expect(db.variables.delete).toHaveBeenCalled();
      expect(db.parameters.where).toHaveBeenCalledWith('tax_benefit_model_version_id');
      expect(db.parameters.equals).toHaveBeenCalledWith(TEST_VERSIONS.US_VERSION_ID);
      expect(db.parameters.delete).toHaveBeenCalled();
    });
  });

  describe('getCacheMetadata', () => {
    it('given country with cache then returns cache metadata', async () => {
      // Given
      const cacheMetadata = createMockCacheMetadata();
      vi.mocked(db.cacheMetadata.get).mockResolvedValue(cacheMetadata);

      // When
      const result = await getCacheMetadata(TEST_COUNTRIES.US);

      // Then
      expect(result).toEqual(cacheMetadata);
      expect(db.cacheMetadata.get).toHaveBeenCalledWith(TEST_COUNTRIES.US);
    });

    it('given country without cache then returns undefined', async () => {
      // Given
      vi.mocked(db.cacheMetadata.get).mockResolvedValue(undefined);

      // When
      const result = await getCacheMetadata(TEST_COUNTRIES.UK);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('setCacheMetadata', () => {
    it('given cache metadata then stores in database', async () => {
      // Given
      const cacheMetadata = createMockCacheMetadata();

      // When
      await setCacheMetadata(cacheMetadata);

      // Then
      expect(db.cacheMetadata.put).toHaveBeenCalledWith(cacheMetadata);
    });
  });

  describe('getStoreCounts', () => {
    it('given database with data then returns counts for all stores', async () => {
      // Given
      vi.mocked(db.variables.count).mockResolvedValueOnce(100);
      vi.mocked(db.parameters.count).mockResolvedValueOnce(50);
      vi.mocked(db.parameterValues.count).mockResolvedValueOnce(500);
      vi.mocked(db.datasets.count).mockResolvedValueOnce(5);

      // When
      const result = await getStoreCounts();

      // Then
      expect(result.variables).toBe(100);
      expect(result.parameters).toBe(50);
      expect(result.parameterValues).toBe(500);
      expect(result.datasets).toBe(5);
    });
  });

  describe('clearAllStores', () => {
    it('given database with data then clears all stores in transaction', async () => {
      // When
      await clearAllStores();

      // Then
      expect(db.transaction).toHaveBeenCalled();
      expect(db.variables.clear).toHaveBeenCalled();
      expect(db.parameters.clear).toHaveBeenCalled();
      expect(db.parameterValues.clear).toHaveBeenCalled();
      expect(db.datasets.clear).toHaveBeenCalled();
      expect(db.cacheMetadata.clear).toHaveBeenCalled();
    });
  });
});
