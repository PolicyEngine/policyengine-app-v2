/**
 * Constants for ReportBuilder components
 */
import { colors, typography } from '@/designTokens';
import { IngredientColorConfig } from './types';

// ============================================================================
// FONT SIZES
// ============================================================================

export const FONT_SIZES = {
  title: typography.fontSize['3xl'], // 28px
  normal: typography.fontSize.base, // 16px
  small: typography.fontSize.sm, // 14px
  tiny: typography.fontSize.xs, // 12px
};

// ============================================================================
// INGREDIENT COLORS
// ============================================================================

export const INGREDIENT_COLORS: Record<
  'policy' | 'population' | 'dynamics',
  IngredientColorConfig
> = {
  policy: {
    icon: colors.primary[600],
    bg: colors.primary[50],
    border: colors.primary[200],
    accent: colors.primary[500],
  },
  population: {
    icon: colors.secondary[600],
    bg: colors.secondary[50],
    border: colors.secondary[200],
    accent: colors.secondary[500],
  },
  dynamics: {
    // Muted gray-green for dynamics (distinct from teal and slate)
    icon: colors.gray[500],
    bg: colors.gray[50],
    border: colors.gray[200],
    accent: colors.gray[400],
  },
};

// ============================================================================
// COUNTRY CONFIGURATION
// ============================================================================

export const COUNTRY_CONFIG = {
  us: {
    nationwideTitle: 'United States',
    nationwideSubtitle: 'Nationwide',
    nationwideLabel: 'United States',
    geographyId: 'us',
  },
  uk: {
    nationwideTitle: 'United Kingdom',
    nationwideSubtitle: 'UK-wide',
    nationwideLabel: 'United Kingdom',
    geographyId: 'uk',
  },
} as const;

// ============================================================================
// SAMPLE POPULATIONS
// ============================================================================

export const getSamplePopulations = (countryId: 'us' | 'uk') => {
  const config = COUNTRY_CONFIG[countryId] || COUNTRY_CONFIG.us;
  return {
    household: {
      label: 'Smith family (4 members)',
      type: 'household' as const,
      household: {
        id: 'sample-household',
        countryId,
        householdData: { people: { person1: { age: { 2025: 40 } } } },
      },
      geography: null,
    },
    nationwide: {
      label: config.nationwideLabel,
      type: 'geography' as const,
      household: null,
      geography: {
        id: config.geographyId,
        countryId,
        scope: 'national' as const,
        geographyId: config.geographyId,
        name: config.nationwideLabel,
      },
    },
  };
};

// Default sample populations (for backwards compatibility)
export const SAMPLE_POPULATIONS = getSamplePopulations('us');

// ============================================================================
// MODAL CONFIGURATION
// ============================================================================

export const BROWSE_MODAL_CONFIG = {
  width: '90vw',
  maxWidth: '1400px',
  height: '92vh',
  maxHeight: '1300px',
  sidebarWidth: 220,
};
