import { describe, it, expect } from 'vitest';
import { typography, FONT_UI, FONT_CHART, FONT_PROSE, FONT_MONO } from '../tokens/typography';

describe('typography', () => {
  describe('font families', () => {
    it('should use Inter for all non-mono font families', () => {
      expect(typography.fontFamily.primary).toContain('Inter');
      expect(typography.fontFamily.secondary).toContain('Inter');
      expect(typography.fontFamily.body).toContain('Inter');
      expect(typography.fontFamily.chart).toContain('Inter');
      expect(typography.fontFamily.prose).toContain('Inter');
    });

    it('should have all non-mono families resolve to the same value', () => {
      const inter = typography.fontFamily.primary;
      expect(typography.fontFamily.secondary).toBe(inter);
      expect(typography.fontFamily.body).toBe(inter);
      expect(typography.fontFamily.chart).toBe(inter);
      expect(typography.fontFamily.prose).toBe(inter);
    });

    it('should have monospace font', () => {
      expect(typography.fontFamily.mono).toContain('JetBrains Mono');
    });

    it('should include fallback fonts', () => {
      expect(typography.fontFamily.primary).toContain('sans-serif');
      expect(typography.fontFamily.mono).toContain('monospace');
    });
  });

  describe('convenience exports', () => {
    it('should export FONT_UI as primary font family', () => {
      expect(FONT_UI).toBe(typography.fontFamily.primary);
    });

    it('should export FONT_CHART as Inter', () => {
      expect(FONT_CHART).toBe(typography.fontFamily.chart);
      expect(FONT_CHART).toContain('Inter');
    });

    it('should export FONT_PROSE as Inter (same as primary)', () => {
      expect(FONT_PROSE).toBe(typography.fontFamily.primary);
      expect(FONT_PROSE).toContain('Inter');
    });

    it('should export FONT_MONO for code', () => {
      expect(FONT_MONO).toBe(typography.fontFamily.mono);
    });
  });

  describe('font weights', () => {
    it('should have standard weight scale', () => {
      expect(typography.fontWeight.normal).toBe(400);
      expect(typography.fontWeight.medium).toBe(500);
      expect(typography.fontWeight.semibold).toBe(600);
      expect(typography.fontWeight.bold).toBe(700);
    });

    it('should have all weights from thin to black', () => {
      expect(typography.fontWeight.thin).toBe(100);
      expect(typography.fontWeight.black).toBe(900);
    });
  });

  describe('font sizes', () => {
    it('should have base size of 16px', () => {
      expect(typography.fontSize.base).toBe('16px');
    });

    it('should have a complete size scale', () => {
      expect(typography.fontSize.xs).toBe('12px');
      expect(typography.fontSize.sm).toBe('14px');
      expect(typography.fontSize.lg).toBe('18px');
      expect(typography.fontSize.xl).toBe('20px');
      expect(typography.fontSize['2xl']).toBe('24px');
      expect(typography.fontSize['4xl']).toBe('32px');
    });

    it('should have all sizes in px format', () => {
      Object.values(typography.fontSize).forEach((size) => {
        expect(size).toMatch(/^\d+px$/);
      });
    });
  });

  describe('line heights', () => {
    it('should have semantic line height values', () => {
      expect(typography.lineHeight.none).toBe('1');
      expect(typography.lineHeight.tight).toBe('1.25');
      expect(typography.lineHeight.normal).toBe('1.5');
      expect(typography.lineHeight.loose).toBe('2');
    });

    it('should have pixel-based line heights for specific uses', () => {
      expect(typography.lineHeight['20']).toBe('20px');
      expect(typography.lineHeight['22']).toBe('22px');
      expect(typography.lineHeight['24']).toBe('24px');
    });
  });

  describe('text styles', () => {
    it('should have predefined text styles', () => {
      expect(typography.textStyles['sm-medium']).toBeDefined();
      expect(typography.textStyles['sm-semibold']).toBeDefined();
      expect(typography.textStyles['body-regular']).toBeDefined();
    });

    it('should use Inter for all text styles', () => {
      Object.values(typography.textStyles).forEach((style) => {
        expect(style.fontFamily).toBe('Inter');
      });
    });

    it('should have complete text style definitions', () => {
      const smMedium = typography.textStyles['sm-medium'];
      expect(smMedium.fontFamily).toBe('Inter');
      expect(smMedium.fontSize).toBe('14px');
      expect(smMedium.fontWeight).toBe(500);
      expect(smMedium.lineHeight).toBe('20px');
    });
  });
});
