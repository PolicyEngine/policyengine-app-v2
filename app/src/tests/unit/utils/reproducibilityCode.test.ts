import { describe, expect, test } from 'vitest';
import { TEST_COUNTRIES } from '@/tests/fixtures/constants';
import {
  BASELINE_AND_REFORM_POLICY,
  COMPLEX_HOUSEHOLD_INPUT,
  EMPTY_POLICY,
  EXPECTED_COLAB_LINKS,
  EXPECTED_IMPORTS,
  HOUSEHOLD_INPUT_WITH_NULLS,
  POLICY_WITH_INFINITY,
  POLICY_WITH_NEGATIVE_INFINITY,
  REFORM_ONLY_POLICY,
  SIMPLE_HOUSEHOLD_INPUT,
  TEST_DATASETS,
  TEST_REGIONS,
  TEST_YEARS,
  V2_POLICIES_BOTH_CUSTOM,
  V2_POLICIES_EMPTY,
  V2_POLICIES_WITH_REFORM,
} from '@/tests/fixtures/utils/reproducibilityCodeMocks';
import {
  convertPoliciesToV1Format,
  getColabLink,
  getReproducibilityCodeBlock,
  sanitizeStringToPython,
} from '@/utils/reproducibilityCode';

describe('reproducibilityCode', () => {
  describe('sanitizeStringToPython', () => {
    test('given string with true then converts to Python True', () => {
      // Given
      const input = '{"enabled": true}';

      // When
      const result = sanitizeStringToPython(input);

      // Then
      expect(result).toBe('{"enabled": True}');
    });

    test('given string with false then converts to Python False', () => {
      // Given
      const input = '{"enabled": false}';

      // When
      const result = sanitizeStringToPython(input);

      // Then
      expect(result).toBe('{"enabled": False}');
    });

    test('given string with null then converts to Python None', () => {
      // Given
      const input = '{"value": null}';

      // When
      const result = sanitizeStringToPython(input);

      // Then
      expect(result).toBe('{"value": None}');
    });

    test('given string with Infinity then converts to np.inf', () => {
      // Given
      const input = '{"threshold": "Infinity"}';

      // When
      const result = sanitizeStringToPython(input);

      // Then
      expect(result).toBe('{"threshold": np.inf}');
    });

    test('given string with negative Infinity then converts to -np.inf', () => {
      // Given
      const input = '{"threshold": "-Infinity"}';

      // When
      const result = sanitizeStringToPython(input);

      // Then
      expect(result).toBe('{"threshold": -np.inf}');
    });

    test('given string with multiple JS values then converts all to Python', () => {
      // Given
      const input = '{"a": true, "b": false, "c": null}';

      // When
      const result = sanitizeStringToPython(input);

      // Then
      expect(result).toBe('{"a": True, "b": False, "c": None}');
    });
  });

  describe('getColabLink', () => {
    test('given US country then returns US Colab link', () => {
      // When
      const result = getColabLink(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(EXPECTED_COLAB_LINKS.US);
    });

    test('given UK country then returns UK Colab link', () => {
      // When
      const result = getColabLink(TEST_COUNTRIES.UK);

      // Then
      expect(result).toBe(EXPECTED_COLAB_LINKS.UK);
    });

    test('given unknown country then returns null', () => {
      // When
      const result = getColabLink(TEST_COUNTRIES.CA);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('convertPoliciesToV1Format', () => {
    test('given empty policies array then returns empty baseline and reform', () => {
      // When
      const result = convertPoliciesToV1Format(V2_POLICIES_EMPTY);

      // Then
      expect(result).toEqual({
        baseline: { data: {} },
        reform: { data: {} },
      });
    });

    test('given undefined policies then returns empty baseline and reform', () => {
      // When
      const result = convertPoliciesToV1Format(undefined);

      // Then
      expect(result).toEqual({
        baseline: { data: {} },
        reform: { data: {} },
      });
    });

    test('given policies with reform then converts to v1 format', () => {
      // When
      const result = convertPoliciesToV1Format(V2_POLICIES_WITH_REFORM);

      // Then
      expect(result.baseline.data).toEqual({});
      expect(result.reform.data).toEqual({
        'gov.irs.credits.ctc.amount.base': {
          '2024-01-01.2100-12-31': 3000,
        },
      });
    });

    test('given policies with both baseline and reform then converts both', () => {
      // When
      const result = convertPoliciesToV1Format(V2_POLICIES_BOTH_CUSTOM);

      // Then
      expect(result.baseline.data).toEqual({
        'gov.irs.income.standard_deduction.amount': {
          '2024-01-01.2100-12-31': 15000,
        },
      });
      expect(result.reform.data).toEqual({
        'gov.irs.credits.ctc.amount.base': {
          '2024-01-01.2100-12-31': 3000,
        },
      });
    });
  });

  describe('getReproducibilityCodeBlock', () => {
    describe('household simulations', () => {
      test('given US household with empty policy then generates basic simulation code', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'household',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null,
          SIMPLE_HOUSEHOLD_INPUT,
          false
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain(EXPECTED_IMPORTS.US_HOUSEHOLD);
        expect(code).toContain('situation =');
        expect(code).toContain('simulation = Simulation(');
        expect(code).toContain('situation=situation');
        expect(code).toContain('simulation.calculate("household_net_income"');
        expect(code).not.toContain(EXPECTED_IMPORTS.REFORM_IMPORT);
      });

      test('given UK household then uses policyengine_uk import', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'household',
          TEST_COUNTRIES.UK,
          EMPTY_POLICY,
          TEST_REGIONS.UK_NATIONAL,
          TEST_YEARS.DEFAULT,
          null,
          SIMPLE_HOUSEHOLD_INPUT,
          false
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain(EXPECTED_IMPORTS.UK_HOUSEHOLD);
      });

      test('given household with reform policy then includes reform code', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'household',
          TEST_COUNTRIES.US,
          REFORM_ONLY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null,
          SIMPLE_HOUSEHOLD_INPUT,
          false
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain(EXPECTED_IMPORTS.REFORM_IMPORT);
        expect(code).toContain('reform = Reform.from_dict(');
        expect(code).toContain('reform=reform');
      });

      test('given household with earning variation then adds axes', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'household',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null,
          SIMPLE_HOUSEHOLD_INPUT,
          true // earningVariation enabled
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain('axes');
        expect(code).toContain('employment_income');
        expect(code).toContain('count');
        expect(code).toContain('200');
      });

      test('given household input with null values then cleans them up', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'household',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null,
          HOUSEHOLD_INPUT_WITH_NULLS,
          false
        );
        const code = lines.join('\n');

        // Then
        expect(code).not.toContain('some_null_variable');
        expect(code).toContain('age');
        expect(code).toContain('employment_income');
      });

      test('given complex household then includes all people', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'household',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null,
          COMPLEX_HOUSEHOLD_INPUT,
          false
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain('you');
        expect(code).toContain('your_partner');
        expect(code).toContain('child_1');
      });
    });

    describe('policy/microsimulations', () => {
      test('given US policy simulation then generates microsimulation code', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain(EXPECTED_IMPORTS.US_POLICY);
        expect(code).toContain('baseline = Microsimulation(');
        expect(code).toContain('reformed = Microsimulation(');
        expect(code).toContain('baseline_income = baseline.calculate(');
        expect(code).toContain('reformed_income = reformed.calculate(');
        expect(code).toContain('difference_income = reformed_income - baseline_income');
      });

      test('given UK policy simulation then uses policyengine_uk import', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.UK,
          EMPTY_POLICY,
          TEST_REGIONS.UK_NATIONAL,
          TEST_YEARS.DEFAULT,
          null
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain(EXPECTED_IMPORTS.UK_POLICY);
      });

      test('given policy with reform then includes reform in microsimulation', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          REFORM_ONLY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain(EXPECTED_IMPORTS.REFORM_IMPORT);
        expect(code).toContain('reform = Reform.from_dict(');
        expect(code).toContain('reformed = Microsimulation(reform=reform');
      });

      test('given policy with baseline and reform then includes both', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          BASELINE_AND_REFORM_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain('baseline = Reform.from_dict(');
        expect(code).toContain('reform = Reform.from_dict(');
        expect(code).toContain('Microsimulation(reform=baseline');
        expect(code).toContain('Microsimulation(reform=reform');
      });

      test('given US state region then uses state-specific dataset', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.CA_STATE, // "state/ca"
          TEST_YEARS.DEFAULT,
          null
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain('states/CA.h5');
      });

      test('given congressional district region then uses district-specific dataset', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.CA_DISTRICT, // "congressional_district/CA-01"
          TEST_YEARS.DEFAULT,
          null
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain('districts/CA-01.h5');
      });

      test('given place region then uses state dataset with place_fips filtering', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.NJ_PLACE, // "place/NJ-57000"
          TEST_YEARS.DEFAULT,
          null
        );
        const code = lines.join('\n');

        // Then - uses parent state's dataset, not a city-specific one
        expect(code).toContain('states/NJ.h5');
        expect(code).not.toContain('cities/');
        // Filters by place_fips
        expect(code).toContain('place_fips');
        expect(code).toContain('57000');
        // Creates filtered dataframe for simulations
        expect(code).toContain('subset_df');
        expect(code).toContain('Microsimulation(dataset=subset_df');
        // Includes pandas import for filtering
        expect(code).toContain('import pandas as pd');
      });

      test('given non-default dataset then includes dataset URL', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          TEST_DATASETS.ENHANCED_CPS,
          null,
          false,
          false // not the default dataset
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain('enhanced_cps_2024.h5');
        expect(code).toContain('dataset=');
      });

      test('given full dataset url then uses it verbatim', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          'hf://policyengine/policyengine-us-data/enhanced_cps_2024.h5@1.77.0',
          null,
          false,
          false
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain(
          'dataset="hf://policyengine/policyengine-us-data/enhanced_cps_2024.h5@1.77.0"'
        );
      });

      test('given default dataset then omits dataset specifier', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          TEST_DATASETS.CPS,
          null,
          false,
          true // is the default dataset
        );
        const code = lines.join('\n');

        // Then
        expect(code).not.toContain('dataset=');
      });

      test('given null dataset then does not include dataset specifier', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null
        );
        const code = lines.join('\n');

        // Then
        expect(code).not.toContain('dataset=');
      });

      test('given specific year then uses that year in calculation', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          EMPTY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.PREVIOUS,
          null
        );
        const code = lines.join('\n');

        // Then
        expect(code).toContain(`period=${TEST_YEARS.PREVIOUS}`);
      });
    });

    describe('syntax validation', () => {
      /**
       * Checks that brackets and parentheses are balanced in generated Python.
       * Counts (), {}, and [] pairs — any mismatch means invalid syntax.
       */
      function assertBalancedBrackets(code: string) {
        let parens = 0;
        let braces = 0;
        let squares = 0;
        for (const ch of code) {
          if (ch === '(') {
            parens++;
          }
          if (ch === ')') {
            parens--;
          }
          if (ch === '{') {
            braces++;
          }
          if (ch === '}') {
            braces--;
          }
          if (ch === '[') {
            squares++;
          }
          if (ch === ']') {
            squares--;
          }
          // Should never go negative (closing before opening)
          expect(parens).toBeGreaterThanOrEqual(0);
          expect(braces).toBeGreaterThanOrEqual(0);
          expect(squares).toBeGreaterThanOrEqual(0);
        }
        expect(parens).toBe(0);
        expect(braces).toBe(0);
        expect(squares).toBe(0);
      }

      test('given reform-only policy then generated code has balanced brackets', () => {
        // When
        const code = getReproducibilityCodeBlock(
          'household',
          TEST_COUNTRIES.US,
          REFORM_ONLY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null,
          SIMPLE_HOUSEHOLD_INPUT,
          false
        ).join('\n');

        // Then
        assertBalancedBrackets(code);
      });

      test('given baseline-and-reform policy then generated code has balanced brackets', () => {
        // When
        const code = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          BASELINE_AND_REFORM_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null
        ).join('\n');

        // Then
        assertBalancedBrackets(code);
      });

      test('given household with earning variation then generated code has balanced brackets', () => {
        // When
        const code = getReproducibilityCodeBlock(
          'household',
          TEST_COUNTRIES.US,
          REFORM_ONLY_POLICY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null,
          SIMPLE_HOUSEHOLD_INPUT,
          true
        ).join('\n');

        // Then
        assertBalancedBrackets(code);
      });

      test('given place region with reform then generated code has balanced brackets', () => {
        // When
        const code = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          REFORM_ONLY_POLICY,
          TEST_REGIONS.NJ_PLACE,
          TEST_YEARS.DEFAULT,
          null
        ).join('\n');

        // Then
        assertBalancedBrackets(code);
      });
    });

    describe('infinity handling', () => {
      test('given policy with Infinity then adds numpy import', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          POLICY_WITH_INFINITY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null
        );
        const code = lines.join('\n');

        // Then - numpy import is added because the code detects Infinity values
        // Note: JSON.stringify converts JS Infinity to null, so the output shows None
        // The numpy import is still added based on the raw value check
        expect(code).toContain(EXPECTED_IMPORTS.NUMPY_IMPORT);
      });

      test('given policy with negative Infinity then adds numpy import', () => {
        // When
        const lines = getReproducibilityCodeBlock(
          'policy',
          TEST_COUNTRIES.US,
          POLICY_WITH_NEGATIVE_INFINITY,
          TEST_REGIONS.US_NATIONAL,
          TEST_YEARS.DEFAULT,
          null
        );
        const code = lines.join('\n');

        // Then - numpy import is added because the code detects -Infinity values
        expect(code).toContain(EXPECTED_IMPORTS.NUMPY_IMPORT);
      });
    });
  });
});
