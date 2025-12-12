import { describe, it, expect } from 'vitest';
import {
  colors,
  TEAL_PRIMARY,
  TEAL_ACCENT,
  SUCCESS_GREEN,
  WARNING_YELLOW,
  ERROR_RED,
  INFO_BLUE,
  BACKGROUND_PRIMARY,
  BACKGROUND_SIDEBAR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  BORDER_LIGHT,
} from '../tokens/colors';

describe('colors', () => {
  describe('primary (teal) colors', () => {
    it('should have primary.500 as the main brand color', () => {
      expect(colors.primary[500]).toBe('#319795');
    });

    it('should have a complete primary scale from 50-900', () => {
      const expectedShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
      expectedShades.forEach((shade) => {
        expect(colors.primary[shade as keyof typeof colors.primary]).toBeDefined();
        expect(colors.primary[shade as keyof typeof colors.primary]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should have alpha variants for transparency', () => {
      expect(colors.primary.alpha[40]).toBe('#31979566');
      expect(colors.primary.alpha[50]).toBe('#31979580');
      expect(colors.primary.alpha[60]).toBe('#31979599');
    });
  });

  describe('convenience exports', () => {
    it('should export TEAL_PRIMARY as primary.500', () => {
      expect(TEAL_PRIMARY).toBe(colors.primary[500]);
      expect(TEAL_PRIMARY).toBe('#319795');
    });

    it('should export TEAL_ACCENT for legacy compatibility', () => {
      expect(TEAL_ACCENT).toBe('#39C6C0');
    });
  });

  describe('semantic colors', () => {
    it('should have success, warning, error, info colors', () => {
      expect(colors.success).toBe('#22C55E');
      expect(colors.warning).toBe('#FEC601');
      expect(colors.error).toBe('#EF4444');
      expect(colors.info).toBe('#1890FF');
    });

    it('should export semantic colors as constants', () => {
      expect(SUCCESS_GREEN).toBe(colors.success);
      expect(WARNING_YELLOW).toBe(colors.warning);
      expect(ERROR_RED).toBe(colors.error);
      expect(INFO_BLUE).toBe(colors.info);
    });
  });

  describe('background colors', () => {
    it('should have background variants', () => {
      expect(colors.background.primary).toBe('#FFFFFF');
      expect(colors.background.secondary).toBe('#F5F9FF');
      expect(colors.background.tertiary).toBe('#F1F5F9');
    });

    it('should export background colors for givecalc compatibility', () => {
      expect(BACKGROUND_PRIMARY).toBe(colors.background.primary);
      expect(BACKGROUND_SIDEBAR).toBe(colors.background.secondary);
    });
  });

  describe('text colors', () => {
    it('should have text variants', () => {
      expect(colors.text.primary).toBe('#000000');
      expect(colors.text.secondary).toBe('#5A5A5A');
      expect(colors.text.tertiary).toBe('#9CA3AF');
      expect(colors.text.inverse).toBe('#FFFFFF');
    });

    it('should export text colors for givecalc compatibility', () => {
      expect(TEXT_PRIMARY).toBe(colors.text.primary);
      expect(TEXT_SECONDARY).toBe(colors.text.secondary);
    });
  });

  describe('border colors', () => {
    it('should have border variants', () => {
      expect(colors.border.light).toBe('#E2E8F0');
      expect(colors.border.medium).toBe('#CBD5E1');
      expect(colors.border.dark).toBe('#94A3B8');
    });

    it('should export BORDER_LIGHT for givecalc compatibility', () => {
      expect(BORDER_LIGHT).toBe(colors.border.light);
    });
  });

  describe('gray scale', () => {
    it('should have gray scale from 50-900', () => {
      expect(colors.gray[50]).toBeDefined();
      expect(colors.gray[100]).toBe('#F2F4F7');
      expect(colors.gray[200]).toBe('#E2E8F0');
      expect(colors.gray[700]).toBe('#344054');
      expect(colors.gray[900]).toBe('#101828');
    });
  });

  describe('color format validation', () => {
    it('should have all hex colors in valid format', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;
      const rgbaRegex = /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/;

      // Check primary colors
      Object.values(colors.primary).forEach((value) => {
        if (typeof value === 'string') {
          expect(value).toMatch(hexRegex);
        }
      });

      // Check semantic colors
      expect(colors.success).toMatch(hexRegex);
      expect(colors.warning).toMatch(hexRegex);
      expect(colors.error).toMatch(hexRegex);
      expect(colors.info).toMatch(hexRegex);

      // Check shadow colors (rgba format)
      Object.values(colors.shadow).forEach((value) => {
        expect(value).toMatch(rgbaRegex);
      });
    });
  });
});
