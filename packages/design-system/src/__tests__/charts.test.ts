import { describe, it, expect } from 'vitest';
import {
  chartColors,
  chartLayout,
  chartDimensions,
  chartLogo,
  getChartConfig,
  formatCurrency,
  formatPercent,
} from '../charts';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';

describe('charts', () => {
  describe('chartColors', () => {
    it('should have primary as teal', () => {
      expect(chartColors.primary).toBe(colors.primary[500]);
      expect(chartColors.primary).toBe('#319795');
    });

    it('should have semantic colors', () => {
      expect(chartColors.positive).toBe(colors.success);
      expect(chartColors.negative).toBe(colors.error);
    });

    it('should have a series array for multi-line charts', () => {
      expect(chartColors.series).toBeInstanceOf(Array);
      expect(chartColors.series.length).toBeGreaterThanOrEqual(5);
      expect(chartColors.series[0]).toBe(chartColors.primary);
    });
  });

  describe('chartLayout', () => {
    it('should use Roboto Serif font for charts', () => {
      expect(chartLayout.font.family).toBe(typography.fontFamily.chart);
      expect(chartLayout.font.family).toContain('Roboto Serif');
    });

    it('should have white background', () => {
      expect(chartLayout.paper_bgcolor).toBe(colors.white);
      expect(chartLayout.plot_bgcolor).toBe(colors.white);
    });

    it('should have sensible margins', () => {
      expect(chartLayout.margin.l).toBeGreaterThan(0);
      expect(chartLayout.margin.r).toBeGreaterThan(0);
      expect(chartLayout.margin.t).toBeGreaterThan(0);
      expect(chartLayout.margin.b).toBeGreaterThan(0);
    });

    it('should have horizontal legend at top', () => {
      expect(chartLayout.legend.orientation).toBe('h');
      expect(chartLayout.legend.y).toBeGreaterThan(1);
    });
  });

  describe('chartDimensions', () => {
    it('should have default dimensions', () => {
      expect(chartDimensions.default.width).toBe(800);
      expect(chartDimensions.default.height).toBe(600);
    });

    it('should have compact dimensions', () => {
      expect(chartDimensions.compact.width).toBeLessThan(chartDimensions.default.width);
      expect(chartDimensions.compact.height).toBeLessThan(chartDimensions.default.height);
    });

    it('should have wide dimensions', () => {
      expect(chartDimensions.wide.width).toBeGreaterThan(chartDimensions.default.width);
    });

    it('should have square dimensions', () => {
      expect(chartDimensions.square.width).toBe(chartDimensions.square.height);
    });
  });

  describe('chartLogo', () => {
    it('should reference the teal-square logo', () => {
      expect(chartLogo.source).toContain('teal-square.png');
    });

    it('should be positioned in bottom-right', () => {
      expect(chartLogo.x).toBe(1);
      expect(chartLogo.y).toBe(0);
      expect(chartLogo.xanchor).toBe('right');
      expect(chartLogo.yanchor).toBe('bottom');
    });
  });

  describe('getChartConfig', () => {
    it('should return default config when called without arguments', () => {
      const config = getChartConfig();
      expect(config.style.width).toBe('800px');
      expect(config.style.height).toBe('600px');
    });

    it('should return compact config when specified', () => {
      const config = getChartConfig('compact');
      expect(config.style.width).toBe('600px');
      expect(config.style.height).toBe('400px');
    });

    it('should disable mode bar by default', () => {
      const config = getChartConfig();
      expect(config.config.displayModeBar).toBe(false);
    });

    it('should enable responsive mode', () => {
      const config = getChartConfig();
      expect(config.config.responsive).toBe(true);
    });
  });

  describe('formatCurrency', () => {
    it('should format small values without suffix', () => {
      expect(formatCurrency(500)).toBe('$500');
      expect(formatCurrency(999)).toBe('$999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatCurrency(1000)).toBe('$1K');
      expect(formatCurrency(5000)).toBe('$5K');
      expect(formatCurrency(50000)).toBe('$50K');
    });

    it('should format millions with M suffix', () => {
      expect(formatCurrency(1000000)).toBe('$1.0M');
      expect(formatCurrency(5500000)).toBe('$5.5M');
    });

    it('should format billions with B suffix', () => {
      expect(formatCurrency(1000000000)).toBe('$1.0B');
      expect(formatCurrency(2500000000)).toBe('$2.5B');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-5000)).toBe('$-5K');
      expect(formatCurrency(-1000000)).toBe('$-1.0M');
    });
  });

  describe('formatPercent', () => {
    it('should format decimals as percentages', () => {
      expect(formatPercent(0.5)).toBe('50%');
      expect(formatPercent(0.25)).toBe('25%');
      expect(formatPercent(1)).toBe('100%');
    });

    it('should support decimal places', () => {
      expect(formatPercent(0.256, 1)).toBe('25.6%');
      expect(formatPercent(0.2567, 2)).toBe('25.67%');
    });

    it('should handle values over 100%', () => {
      expect(formatPercent(1.5)).toBe('150%');
    });

    it('should handle zero', () => {
      expect(formatPercent(0)).toBe('0%');
    });
  });
});
