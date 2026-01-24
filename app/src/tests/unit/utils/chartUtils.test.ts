import { describe, expect, it } from 'vitest';
import {
  EXPECTED_LABEL_DEFAULT,
  EXPECTED_LABEL_WITH_DESCRIPTIVE,
  EXPECTED_LABEL_WITH_ID_0,
  EXPECTED_LABEL_WITH_ID_7,
  EXPECTED_LABEL_WITH_ID_12345,
  EXPECTED_LABEL_WITH_SHORT,
  SAMPLE_POLICY_ID_NULL,
  SAMPLE_POLICY_ID_POSITIVE,
  SAMPLE_POLICY_ID_SINGLE_DIGIT,
  SAMPLE_POLICY_ID_UNDEFINED,
  SAMPLE_POLICY_ID_ZERO,
  SAMPLE_POLICY_LABEL_DESCRIPTIVE,
  SAMPLE_POLICY_LABEL_EMPTY_STRING,
  SAMPLE_POLICY_LABEL_SHORT,
} from '@/tests/fixtures/utils/chartUtilsMocks';
import { getChartLogoImage, getReformPolicyLabel } from '@/utils/chartUtils';

describe('chartUtils', () => {
  describe('getReformPolicyLabel', () => {
    describe('priority: policy label', () => {
      it('given policy label then returns policy label', () => {
        // Given/When
        const result = getReformPolicyLabel(SAMPLE_POLICY_LABEL_DESCRIPTIVE);

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_DESCRIPTIVE);
      });

      it('given short policy label then returns short label', () => {
        // Given/When
        const result = getReformPolicyLabel(SAMPLE_POLICY_LABEL_SHORT);

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_SHORT);
      });

      it('given policy label and policy ID then prioritizes label', () => {
        // Given/When
        const result = getReformPolicyLabel(
          SAMPLE_POLICY_LABEL_DESCRIPTIVE,
          SAMPLE_POLICY_ID_POSITIVE
        );

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_DESCRIPTIVE);
      });

      it('given empty string label then falls back to policy ID', () => {
        // Given/When
        const result = getReformPolicyLabel(
          SAMPLE_POLICY_LABEL_EMPTY_STRING,
          SAMPLE_POLICY_ID_POSITIVE
        );

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_ID_12345);
      });
    });

    describe('priority: policy ID', () => {
      it('given policy ID without label then returns formatted ID', () => {
        // Given/When
        const result = getReformPolicyLabel(undefined, SAMPLE_POLICY_ID_POSITIVE);

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_ID_12345);
      });

      it('given single-digit policy ID then formats correctly', () => {
        // Given/When
        const result = getReformPolicyLabel(undefined, SAMPLE_POLICY_ID_SINGLE_DIGIT);

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_ID_7);
      });

      it('given policy ID 0 then formats correctly', () => {
        // Given/When
        const result = getReformPolicyLabel(undefined, SAMPLE_POLICY_ID_ZERO);

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_ID_0);
      });

      it('given null label and valid policy ID then returns formatted ID', () => {
        // Given/When
        const result = getReformPolicyLabel(null, SAMPLE_POLICY_ID_POSITIVE);

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_ID_12345);
      });
    });

    describe('default: "Reform"', () => {
      it('given no arguments then returns default label', () => {
        // Given/When
        const result = getReformPolicyLabel();

        // Then
        expect(result).toBe(EXPECTED_LABEL_DEFAULT);
      });

      it('given undefined label and undefined ID then returns default', () => {
        // Given/When
        const result = getReformPolicyLabel(SAMPLE_POLICY_ID_UNDEFINED, SAMPLE_POLICY_ID_UNDEFINED);

        // Then
        expect(result).toBe(EXPECTED_LABEL_DEFAULT);
      });

      it('given null label and null ID then returns default', () => {
        // Given/When
        const result = getReformPolicyLabel(SAMPLE_POLICY_ID_NULL, SAMPLE_POLICY_ID_NULL);

        // Then
        expect(result).toBe(EXPECTED_LABEL_DEFAULT);
      });

      it('given empty string label and null ID then returns default', () => {
        // Given/When
        const result = getReformPolicyLabel(
          SAMPLE_POLICY_LABEL_EMPTY_STRING,
          SAMPLE_POLICY_ID_NULL
        );

        // Then
        expect(result).toBe(EXPECTED_LABEL_DEFAULT);
      });
    });
  });

  describe('getChartLogoImage', () => {
    it('given no arguments then returns logo image config with default size', () => {
      // Given/When
      const result = getChartLogoImage();

      // Then
      expect(result).toEqual({
        source: '/assets/logos/policyengine/teal.png',
        xref: 'paper',
        yref: 'paper',
        x: 1,
        y: -0.18,
        sizex: 0.1,
        sizey: 0.1,
        xanchor: 'right',
        yanchor: 'bottom',
        opacity: 0.8,
      });
    });

    it('given custom size then returns logo image config with custom size', () => {
      // Given/When
      const result = getChartLogoImage({ sizex: 0.15, sizey: 0.15 });

      // Then
      expect(result.sizex).toBe(0.15);
      expect(result.sizey).toBe(0.15);
      expect(result.source).toBe('/assets/logos/policyengine/teal.png');
    });

    it('given custom opacity then returns logo image config with custom opacity', () => {
      // Given/When
      const result = getChartLogoImage({ opacity: 0.5 });

      // Then
      expect(result.opacity).toBe(0.5);
    });

    it('given custom position then returns logo image config with custom position', () => {
      // Given/When
      const result = getChartLogoImage({ x: 0.5, y: 0.5 });

      // Then
      expect(result.x).toBe(0.5);
      expect(result.y).toBe(0.5);
    });
  });
});
