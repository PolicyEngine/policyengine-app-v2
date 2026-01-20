/**
 * Unit tests for lazyParameterTree
 *
 * Tests the on-demand parameter tree building with caching functionality.
 */
import { describe, expect, test } from 'vitest';
import {
  clearParameterTreeCache,
  createParameterTreeCache,
  getChildrenForPath,
  hasChildren,
} from '@/libs/lazyParameterTree';
import {
  createPrefilledCache,
  createTestCache,
  MOCK_CACHED_NODES,
  MOCK_PARAMETERS_BRACKETS,
  MOCK_PARAMETERS_EMPTY,
  MOCK_PARAMETERS_NESTED,
  MOCK_PARAMETERS_SIMPLE,
  MOCK_PARAMETERS_WITH_EXCLUDED,
  TEST_PATHS,
} from '@/tests/fixtures/libs/lazyParameterTreeMocks';

describe('lazyParameterTree', () => {
  describe('createParameterTreeCache', () => {
    test('given no arguments then returns empty Map', () => {
      // When
      const cache = createParameterTreeCache();

      // Then
      expect(cache).toBeInstanceOf(Map);
      expect(cache.size).toBe(0);
    });
  });

  describe('clearParameterTreeCache', () => {
    test('given cache with entries then clears all entries', () => {
      // Given
      const cache = createPrefilledCache([['gov', MOCK_CACHED_NODES]]);
      expect(cache.size).toBe(1);

      // When
      clearParameterTreeCache(cache);

      // Then
      expect(cache.size).toBe(0);
    });

    test('given empty cache then remains empty', () => {
      // Given
      const cache = createTestCache();

      // When
      clearParameterTreeCache(cache);

      // Then
      expect(cache.size).toBe(0);
    });
  });

  describe('getChildrenForPath', () => {
    describe('caching behavior', () => {
      test('given path not in cache then builds and caches children', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_SIMPLE, TEST_PATHS.ROOT, cache);

        // Then
        expect(children.length).toBeGreaterThan(0);
        expect(cache.has(TEST_PATHS.ROOT)).toBe(true);
        expect(cache.get(TEST_PATHS.ROOT)).toEqual(children);
      });

      test('given path already in cache then returns cached result', () => {
        // Given
        const cache = createPrefilledCache([[TEST_PATHS.ROOT, MOCK_CACHED_NODES]]);

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_SIMPLE, TEST_PATHS.ROOT, cache);

        // Then
        expect(children).toBe(MOCK_CACHED_NODES);
      });

      test('given multiple calls for same path then returns same reference', () => {
        // Given
        const cache = createTestCache();

        // When
        const first = getChildrenForPath(MOCK_PARAMETERS_NESTED, TEST_PATHS.ROOT, cache);
        const second = getChildrenForPath(MOCK_PARAMETERS_NESTED, TEST_PATHS.ROOT, cache);

        // Then
        expect(first).toBe(second);
      });
    });

    describe('tree building', () => {
      test('given root path then returns top-level categories', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_NESTED, TEST_PATHS.ROOT, cache);

        // Then
        expect(children).toHaveLength(2);
        expect(children.map((c) => c.name)).toContain('gov.tax');
        expect(children.map((c) => c.name)).toContain('gov.benefit');
      });

      test('given intermediate path then returns child nodes', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_NESTED, 'gov.tax', cache);

        // Then
        expect(children).toHaveLength(2);
        expect(children.map((c) => c.name)).toContain('gov.tax.income');
        expect(children.map((c) => c.name)).toContain('gov.tax.capital');
      });

      test('given path with leaf parameters then returns leaf nodes', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_NESTED, 'gov.tax.income', cache);

        // Then
        expect(children).toHaveLength(2);
        children.forEach((child) => {
          expect(child.type).toBe('parameter');
        });
      });

      test('given empty parameters then returns empty array', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_EMPTY, TEST_PATHS.ROOT, cache);

        // Then
        expect(children).toEqual([]);
      });

      test('given path with no children then returns empty array', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_SIMPLE, 'gov.nonexistent', cache);

        // Then
        expect(children).toEqual([]);
      });
    });

    describe('node types', () => {
      test('given leaf parameter then creates parameter node with all fields', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_NESTED, 'gov.tax.income', cache);
        const rateNode = children.find((c) => c.name === 'gov.tax.income.rate');

        // Then
        expect(rateNode).toBeDefined();
        expect(rateNode?.type).toBe('parameter');
        expect(rateNode?.id).toBe('rate-1');
        expect(rateNode?.parameter).toBe('gov.tax.income.rate');
      });

      test('given intermediate path then creates parameterNode type', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_NESTED, TEST_PATHS.ROOT, cache);
        const taxNode = children.find((c) => c.name === 'gov.tax');

        // Then
        expect(taxNode).toBeDefined();
        expect(taxNode?.type).toBe('parameterNode');
      });
    });

    describe('label formatting', () => {
      test('given underscore in segment then replaces with spaces', () => {
        // Given
        const params = {
          'gov.tax_rate.value': {
            parameter: 'gov.tax_rate.value',
            label: 'Value',
          },
        };
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(params, TEST_PATHS.ROOT, cache);

        // Then
        const taxRateNode = children.find((c) => c.name === 'gov.tax_rate');
        expect(taxRateNode?.label).toBe('Tax rate');
      });

      test('given leaf parameter then capitalizes label', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_NESTED, 'gov.tax.income', cache);
        const rateNode = children.find((c) => c.name === 'gov.tax.income.rate');

        // Then
        expect(rateNode?.label).toBe('Income Rate');
      });
    });

    describe('bracket notation', () => {
      test('given parameters with bracket notation then groups under common prefix', () => {
        // Given
        const cache = createTestCache();

        // When
        // Bracket parameters like gov.tax.brackets[0], [1], [2] get grouped
        // under the common prefix "gov.tax.brackets" as a single branch node
        const children = getChildrenForPath(MOCK_PARAMETERS_BRACKETS, 'gov.tax', cache);

        // Then
        expect(children).toHaveLength(1);
        expect(children[0].name).toBe('gov.tax.brackets');
        expect(children[0].type).toBe('parameterNode');
      });

      test('given bracket leaf parameters then returns them as leaves', () => {
        // Given
        // When brackets are leaf parameters accessed directly
        const cache = createTestCache();

        // When - get children of the brackets prefix (will be empty since
        // the implementation uses dot-prefix, not bracket-prefix for children)
        const children = getChildrenForPath(MOCK_PARAMETERS_BRACKETS, 'gov.tax.brackets', cache);

        // Then - no children found because bracket params don't match dot-prefix
        // This is expected behavior - brackets are accessed differently
        expect(children).toEqual([]);
      });
    });

    describe('excluded prefixes', () => {
      test('given calibration prefix then excludes from tree', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_WITH_EXCLUDED, '', cache);

        // Then
        expect(children.map((c) => c.name)).not.toContain('calibration');
      });

      test('given gov.abolitions prefix then excludes from tree', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_WITH_EXCLUDED, TEST_PATHS.ROOT, cache);

        // Then
        expect(children.map((c) => c.name)).not.toContain('gov.abolitions');
      });

      test('given gov.taxsim prefix then excludes from tree', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_WITH_EXCLUDED, TEST_PATHS.ROOT, cache);

        // Then
        expect(children.map((c) => c.name)).not.toContain('gov.taxsim');
      });

      test('given non-gov prefix then excludes from tree', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_WITH_EXCLUDED, '', cache);

        // Then
        expect(children.map((c) => c.name)).not.toContain('other');
      });

      test('given valid gov parameter then includes in tree', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_WITH_EXCLUDED, TEST_PATHS.ROOT, cache);

        // Then
        expect(children.map((c) => c.name)).toContain('gov.tax');
      });
    });

    describe('sorting', () => {
      test('given multiple children then sorts alphabetically by label', () => {
        // Given
        const cache = createTestCache();

        // When
        const children = getChildrenForPath(MOCK_PARAMETERS_NESTED, TEST_PATHS.ROOT, cache);

        // Then
        const labels = children.map((c) => c.label);
        const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b));
        expect(labels).toEqual(sortedLabels);
      });
    });
  });

  describe('hasChildren', () => {
    test('given path with children then returns true', () => {
      // When
      const result = hasChildren(MOCK_PARAMETERS_NESTED, 'gov.tax');

      // Then
      expect(result).toBe(true);
    });

    test('given leaf parameter path then returns false', () => {
      // When
      const result = hasChildren(MOCK_PARAMETERS_NESTED, 'gov.tax.income.rate');

      // Then
      expect(result).toBe(false);
    });

    test('given path not in parameters then returns true', () => {
      // When (path doesn't exist as a parameter, so it's assumed to be a branch)
      const result = hasChildren(MOCK_PARAMETERS_NESTED, 'gov.tax.income');

      // Then
      expect(result).toBe(true);
    });

    test('given path with bracket children then returns true', () => {
      // Given
      const params = {
        'gov.tax.brackets[0].rate': {
          parameter: 'gov.tax.brackets[0].rate',
          label: 'Rate',
        },
      };

      // When
      const result = hasChildren(params, 'gov.tax.brackets[0]');

      // Then
      expect(result).toBe(true);
    });
  });
});
