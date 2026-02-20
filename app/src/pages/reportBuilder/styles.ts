/**
 * Shared styles for ReportBuilder components
 */
import { colors, spacing, typography } from '@/designTokens';
import { BROWSE_MODAL_CONFIG, FONT_SIZES } from './constants';

// ============================================================================
// PAGE STYLES
// ============================================================================

export const pageStyles = {
  pageContainer: {
    minHeight: '100vh',
    background: `linear-gradient(180deg, ${colors.gray[50]} 0%, ${colors.background.secondary} 100%)`,
    padding: `${spacing.lg} ${spacing['3xl']}`,
  },

  headerSection: {
    marginBottom: spacing.xl,
  },

  mainTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: FONT_SIZES.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    letterSpacing: '-0.02em',
    margin: 0,
  },
};

// ============================================================================
// CANVAS STYLES
// ============================================================================

export const canvasStyles = {
  canvasContainer: {
    background: colors.white,
    borderRadius: spacing.radius.xl,
    border: `1px solid ${colors.border.light}`,
    boxShadow: `0 4px 24px ${colors.shadow.light}`,
    padding: spacing['2xl'],
    position: 'relative' as const,
    overflow: 'hidden',
  },

  canvasGrid: {
    background: `
      linear-gradient(90deg, ${colors.gray[100]}18 1px, transparent 1px),
      linear-gradient(${colors.gray[100]}18 1px, transparent 1px)
    `,
    backgroundSize: '20px 20px',
    position: 'absolute' as const,
    inset: 0,
    pointerEvents: 'none' as const,
  },

  simulationsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: 'auto auto auto auto', // header, policy, population, dynamics
    gap: `${spacing.sm} ${spacing['2xl']}`,
    position: 'relative' as const,
    zIndex: 1,
    minHeight: '450px',
    alignItems: 'start',
  },
};

// ============================================================================
// SIMULATION CARD STYLES
// ============================================================================

export const simulationStyles = {
  simulationCard: {
    background: colors.white,
    borderRadius: spacing.radius.lg,
    border: `2px solid ${colors.gray[200]}`,
    padding: spacing.xl,
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    display: 'grid',
    gridRow: 'span 4', // span all 4 rows (header + 3 panels)
    gridTemplateRows: 'subgrid',
    minWidth: 0,
    overflow: 'hidden',
    gap: spacing.sm,
  },

  simulationCardActive: {
    border: `2px solid ${colors.primary[400]}`,
    boxShadow: `0 0 0 4px ${colors.primary[50]}, 0 8px 32px ${colors.shadow.medium}`,
  },

  simulationHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    minWidth: 0,
    overflow: 'hidden',
  },

  simulationTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: FONT_SIZES.normal,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
  },
};

// ============================================================================
// INGREDIENT SECTION STYLES
// ============================================================================

export const ingredientStyles = {
  ingredientSection: {
    padding: spacing.md,
    borderRadius: spacing.radius.lg,
    border: `1px solid`,
    background: 'white',
    minWidth: 0,
    overflow: 'hidden',
  },

  ingredientSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  ingredientSectionIcon: {
    width: 32,
    height: 32,
    borderRadius: spacing.radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

// ============================================================================
// CHIP STYLES
// ============================================================================

export const chipStyles = {
  // Chip grid for card view (square chips, 3 per row)
  chipGridSquare: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing.sm,
  },

  // Row layout for row view
  chipRowContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.xs,
  },

  // Square chip (expands to fill grid cell, min 80px height)
  chipSquare: {
    minHeight: 80,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: 'pointer',
    transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
    padding: spacing.sm,
  },

  chipSquareSelected: {
    borderWidth: 2,
    boxShadow: `0 0 0 2px`,
  },

  // Row chip (80 height)
  chipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    cursor: 'pointer',
    transition: 'background 0.15s ease, border-color 0.15s ease',
    minHeight: 80,
  },

  chipRowSelected: {
    borderWidth: 2,
  },

  chipRowIcon: {
    width: 40,
    height: 40,
    borderRadius: spacing.radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Perforated "Create new policy" chip (expands to fill grid cell)
  chipCustomSquare: {
    minHeight: 80,
    borderRadius: spacing.radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: 'pointer',
    transition: 'background 0.15s ease, border-color 0.15s ease',
    padding: spacing.sm,
  },

  chipCustomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: spacing.radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    cursor: 'pointer',
    transition: 'background 0.15s ease, border-color 0.15s ease',
    minHeight: 80,
  },
};

// ============================================================================
// ADD SIMULATION CARD STYLES
// ============================================================================

export const addSimulationStyles = {
  addSimulationCard: {
    background: colors.white,
    borderRadius: spacing.radius.lg,
    border: `2px dashed ${colors.border.medium}`,
    padding: spacing.xl,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    gridRow: 'span 4', // span all 4 rows to match SimulationBlock
  },
};

// ============================================================================
// REPORT META PANEL STYLES
// ============================================================================

export const reportMetaStyles = {
  reportMetaCard: {
    background: colors.white,
    borderRadius: spacing.radius.lg,
    border: `1px solid ${colors.border.light}`,
    padding: `${spacing.xl} ${spacing.xl} ${spacing['2xl']} ${spacing.xl}`,
    marginBottom: spacing.xl,
    position: 'relative' as const,
    overflow: 'hidden',
  },

  inheritedBadge: {
    fontSize: FONT_SIZES.tiny,
    color: colors.gray[500],
    fontStyle: 'italic',
    marginLeft: spacing.xs,
  },
};

// ============================================================================
// MODAL STYLES
// ============================================================================

export const modalStyles = {
  sidebar: {
    width: BROWSE_MODAL_CONFIG.sidebarWidth,
    borderRight: `1px solid ${colors.border.light}`,
    paddingRight: spacing.lg,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.lg,
    flexShrink: 0,
  },

  sidebarSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.xs,
  },

  sidebarLabel: {
    fontSize: FONT_SIZES.tiny,
    fontWeight: 600,
    color: colors.gray[500],
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    padding: `0 ${spacing.sm}`,
    marginBottom: spacing.xs,
  },

  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.sm}`,
    borderRadius: spacing.radius.md,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.lg,
    minWidth: 0,
  },

  searchBar: {
    marginBottom: spacing.md,
  },

  policyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: spacing.md,
  },

  policyCard: {
    padding: spacing.lg,
    borderRadius: spacing.radius.lg,
    border: `1px solid ${colors.border.light}`,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: colors.white,
  },

  householdCard: {
    padding: spacing.lg,
    borderRadius: spacing.radius.lg,
    border: `1px solid ${colors.border.light}`,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: colors.white,
  },

  regionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: spacing.sm,
  },

  regionChip: {
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: spacing.radius.md,
    border: `1px solid ${colors.border.light}`,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: colors.white,
    textAlign: 'left' as const,
  },
};

// ============================================================================
// STATUS HEADER STYLES (DOCK)
// ============================================================================

export const statusHeaderStyles = {
  container: (hasChanges: boolean, colorConfig: { border: string }) => ({
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: spacing.radius.lg,
    border: `1px solid ${hasChanges ? colorConfig.border : colors.border.light}`,
    boxShadow: hasChanges
      ? `0 4px 20px ${colorConfig.border}40`
      : `0 2px 8px ${colors.shadow.light}`,
    padding: `${spacing.sm} ${spacing.lg}`,
    marginBottom: spacing.lg,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    transition: 'all 0.3s ease',
  }),

  divider: {
    width: 1,
    height: 24,
    background: colors.border.light,
    flexShrink: 0,
  },
};

// ============================================================================
// COMBINED STYLES EXPORT (for backwards compatibility)
// ============================================================================

export const styles = {
  ...pageStyles,
  ...canvasStyles,
  ...simulationStyles,
  ...ingredientStyles,
  ...chipStyles,
  ...addSimulationStyles,
  ...reportMetaStyles,
};
