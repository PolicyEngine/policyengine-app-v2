import { describe, it, expect } from 'vitest';
import { colors, TEAL_PRIMARY } from '../tokens/colors';
import { typography } from '../tokens/typography';

/**
 * Tests for Python export functionality
 * These tests verify that the exported Python constants will match
 * what givecalc expects
 */

describe('python export compatibility', () => {
  describe('givecalc color constants', () => {
    // These are the exact constants used in givecalc/constants.py
    it('should export TEAL_PRIMARY matching givecalc', () => {
      expect(TEAL_PRIMARY).toBe('#319795');
    });

    it('should export SUCCESS_GREEN matching givecalc', () => {
      expect(colors.success).toBe('#22C55E');
    });

    it('should export WARNING_YELLOW matching givecalc', () => {
      expect(colors.warning).toBe('#FEC601');
    });

    it('should export ERROR_RED matching givecalc', () => {
      expect(colors.error).toBe('#EF4444');
    });

    it('should export INFO_BLUE matching givecalc', () => {
      expect(colors.info).toBe('#1890FF');
    });

    it('should export BACKGROUND_PRIMARY matching givecalc', () => {
      expect(colors.background.primary).toBe('#FFFFFF');
    });

    it('should export BACKGROUND_SIDEBAR matching givecalc', () => {
      expect(colors.background.secondary).toBe('#F5F9FF');
    });

    it('should export TEXT_PRIMARY matching givecalc', () => {
      expect(colors.text.primary).toBe('#000000');
    });

    it('should export TEXT_SECONDARY matching givecalc', () => {
      expect(colors.text.secondary).toBe('#5A5A5A');
    });

    it('should export TEXT_TERTIARY matching givecalc', () => {
      expect(colors.text.tertiary).toBe('#9CA3AF');
    });

    it('should export BORDER_LIGHT matching givecalc', () => {
      expect(colors.border.light).toBe('#E2E8F0');
    });
  });

  describe('givecalc font constants', () => {
    it('should export chart font as Roboto Serif', () => {
      // givecalc uses "Roboto Serif" for charts
      expect(typography.fontFamily.chart).toContain('Roboto Serif');
    });

    it('should export UI font as Inter', () => {
      // givecalc imports Inter via Google Fonts
      expect(typography.fontFamily.primary).toContain('Inter');
    });
  });

  describe('python-safe color format', () => {
    it('should have all colors in hex format suitable for Python', () => {
      // Python/Streamlit expects hex colors like "#319795"
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;

      expect(TEAL_PRIMARY).toMatch(hexRegex);
      expect(colors.success).toMatch(hexRegex);
      expect(colors.warning).toMatch(hexRegex);
      expect(colors.error).toMatch(hexRegex);
      expect(colors.info).toMatch(hexRegex);
      expect(colors.background.primary).toMatch(hexRegex);
      expect(colors.text.primary).toMatch(hexRegex);
    });
  });

  describe('exported values have correct types', () => {
    it('colors object should be typed as const', () => {
      // The 'as const' assertion provides type narrowing
      // This test verifies the structure matches expected type
      const teal: '#319795' = colors.primary[500];
      expect(teal).toBe('#319795');
    });
  });
});

describe('json/yaml export format', () => {
  it('should have flat structure for simple Python dict conversion', () => {
    // The JSON export should be easily convertible to Python dicts
    const expectedStructure = {
      colors: expect.objectContaining({
        primary: expect.any(Object),
        success: expect.any(String),
      }),
      typography: expect.objectContaining({
        fontFamily: expect.any(Object),
      }),
    };

    const tokens = { colors, typography };
    expect(tokens).toEqual(expectedStructure);
  });
});
