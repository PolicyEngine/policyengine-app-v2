/**
 * ReportBuilder - A visual, building-block approach to report configuration
 *
 * Design Direction: Refined utilitarian with distinct color coding.
 * - Policy: Secondary (slate) - authoritative, grounded
 * - Population: Primary (teal) - brand-focused, people
 * - Dynamics: Blue - forward-looking, data-driven
 *
 * Three view modes:
 * - Card view: 50/50 grid with square chips
 * - Row view: Stacked horizontal rows
 * - Horizontal view: Full-width stacked simulations
 */
import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Stack,
  Group,
  Text,
  ActionIcon,
  Paper,
  Modal,
  TextInput,
  Select,
  Button,
  Tooltip,
  Transition,
  Divider,
  ScrollArea,
  Tabs,
} from '@mantine/core';
import {
  IconPlus,
  IconScale,
  IconUsers,
  IconChartLine,
  IconCheck,
  IconX,
  IconPencil,
  IconChevronDown,
  IconChevronRight,
  IconTrash,
  IconSparkles,
  IconFileDescription,
  IconLayoutList,
  IconLayoutColumns,
  IconHome,
  IconWorld,
  IconRowInsertBottom,
  IconSearch,
} from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import {
  SimulationStateProps,
  PolicyStateProps,
  PopulationStateProps,
} from '@/types/pathwayState';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';
import { initializePolicyState } from '@/utils/pathwayState/initializePolicyState';
import { initializePopulationState } from '@/utils/pathwayState/initializePopulationState';
import { CURRENT_YEAR } from '@/constants';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { MOCK_USER_ID } from '@/constants';

// ============================================================================
// TYPES
// ============================================================================

interface ReportBuilderState {
  label: string | null;
  year: string;
  simulations: SimulationStateProps[];
}

type IngredientType = 'policy' | 'population' | 'dynamics';
type ViewMode = 'cards' | 'rows' | 'horizontal';

interface IngredientPickerState {
  isOpen: boolean;
  simulationIndex: number;
  ingredientType: IngredientType;
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const FONT_SIZES = {
  title: '28px',
  normal: '14px',
  small: '12px',
  tiny: '10px',
};

// Distinct color palette for each ingredient type
const INGREDIENT_COLORS = {
  policy: {
    icon: colors.secondary[600],
    bg: colors.secondary[50],
    border: colors.secondary[200],
    accent: colors.secondary[500],
  },
  population: {
    icon: colors.primary[600],
    bg: colors.primary[50],
    border: colors.primary[200],
    accent: colors.primary[500],
  },
  dynamics: {
    // Muted gray-green for dynamics (distinct from teal and slate)
    icon: colors.gray[500],
    bg: colors.gray[50],
    border: colors.gray[200],
    accent: colors.gray[400],
  },
};

// Sample populations
const SAMPLE_POPULATIONS = {
  household: {
    label: 'Sample household',
    type: 'household' as const,
    household: {
      id: 'sample-household',
      countryId: 'us' as const,
      householdData: { people: { person1: { age: { 2025: 40 } } } },
    },
    geography: null,
  },
  nationwide: {
    label: 'Sample nationwide',
    type: 'geography' as const,
    household: null,
    geography: {
      id: 'us-nationwide',
      countryId: 'us' as const,
      scope: 'national' as const,
      geographyId: 'us',
      name: 'United States',
    },
  },
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
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

  simulationsContainerHorizontal: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.xl,
    position: 'relative' as const,
    zIndex: 1,
  },

  simulationCard: {
    background: colors.white,
    borderRadius: spacing.radius.lg,
    border: `2px solid ${colors.border.light}`,
    padding: spacing.xl,
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    display: 'grid',
    gridRow: 'span 4', // span all 4 rows (header + 3 panels)
    gridTemplateRows: 'subgrid',
    gap: spacing.sm,
  },

  simulationCardHorizontal: {
    background: colors.white,
    borderRadius: spacing.radius.lg,
    border: `2px solid ${colors.border.light}`,
    padding: spacing.xl,
    width: '100%',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
  },

  simulationCardActive: {
    borderColor: colors.primary[400],
    boxShadow: `0 0 0 4px ${colors.primary[50]}, 0 8px 32px ${colors.shadow.medium}`,
  },

  simulationHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },

  simulationTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: FONT_SIZES.normal,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
  },

  // Ingredient section (bubble/card container, not clickable)
  ingredientSection: {
    padding: spacing.md,
    borderRadius: spacing.radius.lg,
    border: `1px solid`,
    background: 'white',
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

  // Perforated "Create custom" chip (expands to fill grid cell)
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

  addSimulationCardHorizontal: {
    background: colors.white,
    borderRadius: spacing.radius.lg,
    border: `2px dashed ${colors.border.medium}`,
    padding: spacing.xl,
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '120px',
  },

  reportMetaCard: {
    background: colors.white,
    borderRadius: spacing.radius.lg,
    border: `1px solid ${colors.border.light}`,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },

  inheritedBadge: {
    fontSize: FONT_SIZES.tiny,
    color: colors.gray[500],
    fontStyle: 'italic',
    marginLeft: spacing.xs,
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface OptionChipSquareProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  colorConfig: typeof INGREDIENT_COLORS.policy;
}

function OptionChipSquare({
  icon,
  label,
  description,
  isSelected,
  onClick,
  colorConfig,
}: OptionChipSquareProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      style={{
        ...styles.chipSquare,
        borderColor: isSelected ? colorConfig.accent : colors.border.light,
        background: isSelected ? colorConfig.bg : (isHovered ? colors.gray[50] : colors.white),
        ...(isSelected
          ? {
              ...styles.chipSquareSelected,
              boxShadow: `0 0 0 2px ${colorConfig.bg}`,
            }
          : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Box
        style={{
          width: 28,
          height: 28,
          borderRadius: spacing.radius.sm,
          background: isSelected ? colorConfig.border : colors.gray[100],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Text
        ta="center"
        fw={600}
        c={isSelected ? colorConfig.icon : colors.gray[700]}
        style={{ fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
      >
        {label}
      </Text>
      {description && (
        <Text
          ta="center"
          c="dimmed"
          style={{ fontSize: FONT_SIZES.tiny, lineHeight: 1.2 }}
        >
          {description}
        </Text>
      )}
    </Box>
  );
}

interface OptionChipRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  colorConfig: typeof INGREDIENT_COLORS.policy;
}

function OptionChipRow({
  icon,
  label,
  description,
  isSelected,
  onClick,
  colorConfig,
}: OptionChipRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      style={{
        ...styles.chipRow,
        borderColor: isSelected ? colorConfig.accent : colors.border.light,
        background: isSelected ? colorConfig.bg : (isHovered ? colors.gray[50] : colors.white),
        ...(isSelected ? styles.chipRowSelected : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Box
        style={{
          ...styles.chipRowIcon,
          background: isSelected ? colorConfig.border : colors.gray[100],
        }}
      >
        {icon}
      </Box>
      <Stack gap={2} style={{ flex: 1 }}>
        <Text
          fw={600}
          c={isSelected ? colorConfig.icon : colors.gray[700]}
          style={{ fontSize: FONT_SIZES.normal }}
        >
          {label}
        </Text>
        {description && (
          <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
            {description}
          </Text>
        )}
      </Stack>
      {isSelected && (
        <IconCheck size={18} color={colorConfig.accent} stroke={2.5} />
      )}
    </Box>
  );
}

interface CreateCustomChipProps {
  label: string;
  onClick: () => void;
  variant: 'square' | 'row';
  colorConfig: typeof INGREDIENT_COLORS.policy;
}

function CreateCustomChip({ label, onClick, variant, colorConfig }: CreateCustomChipProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (variant === 'square') {
    return (
      <Box
        style={{
          ...styles.chipCustomSquare,
          borderColor: isHovered ? colorConfig.accent : colors.border.medium,
          background: isHovered ? colorConfig.bg : colors.gray[50],
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <IconPlus
          size={20}
          color={isHovered ? colorConfig.icon : colors.gray[400]}
        />
        <Text
          ta="center"
          fw={600}
          c={isHovered ? colorConfig.icon : colors.gray[500]}
          style={{ fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
        >
          {label}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        ...styles.chipCustomRow,
        borderColor: isHovered ? colorConfig.accent : colors.border.medium,
        background: isHovered ? colorConfig.bg : colors.gray[50],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Box
        style={{
          ...styles.chipRowIcon,
          background: isHovered ? colorConfig.border : colors.gray[100],
        }}
      >
        <IconPlus size={20} color={isHovered ? colorConfig.icon : colors.gray[400]} />
      </Box>
      <Text
        fw={600}
        c={isHovered ? colorConfig.icon : colors.gray[500]}
        style={{ fontSize: FONT_SIZES.normal }}
      >
        {label}
      </Text>
    </Box>
  );
}

interface SavedPolicy {
  id: string;
  label: string;
  paramCount: number;
}

interface BrowseMoreChipProps {
  label: string;
  description?: string;
  onClick: () => void;
  variant: 'square' | 'row';
  colorConfig: typeof INGREDIENT_COLORS.policy;
}

function BrowseMoreChip({ label, description, onClick, variant, colorConfig }: BrowseMoreChipProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (variant === 'square') {
    return (
      <Box
        style={{
          ...styles.chipCustomSquare,
          borderColor: isHovered ? colorConfig.accent : colors.border.medium,
          background: isHovered ? colorConfig.bg : colors.gray[50],
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <IconSearch
          size={20}
          color={isHovered ? colorConfig.icon : colors.gray[400]}
        />
        <Text
          ta="center"
          fw={600}
          c={isHovered ? colorConfig.icon : colors.gray[500]}
          style={{ fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
        >
          {label}
        </Text>
        {description && (
          <Text
            ta="center"
            c={isHovered ? colorConfig.icon : colors.gray[400]}
            style={{ fontSize: FONT_SIZES.tiny, lineHeight: 1.2 }}
          >
            {description}
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box
      style={{
        ...styles.chipCustomRow,
        borderColor: isHovered ? colorConfig.accent : colors.border.medium,
        background: isHovered ? colorConfig.bg : colors.gray[50],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Box
        style={{
          ...styles.chipRowIcon,
          background: isHovered ? colorConfig.border : colors.gray[100],
        }}
      >
        <IconSearch size={20} color={isHovered ? colorConfig.icon : colors.gray[400]} />
      </Box>
      <Stack gap={2} style={{ flex: 1 }}>
        <Text
          fw={600}
          c={isHovered ? colorConfig.icon : colors.gray[500]}
          style={{ fontSize: FONT_SIZES.normal }}
        >
          {label}
        </Text>
        {description && (
          <Text
            c={isHovered ? colorConfig.icon : colors.gray[400]}
            style={{ fontSize: FONT_SIZES.small }}
          >
            {description}
          </Text>
        )}
      </Stack>
    </Box>
  );
}

interface IngredientSectionProps {
  type: IngredientType;
  currentId?: string;
  onQuickSelectPolicy?: (type: 'current-law') => void;
  onSelectSavedPolicy?: (id: string, label: string, paramCount: number) => void;
  onQuickSelectPopulation?: (type: 'household' | 'nationwide') => void;
  onCreateCustom: () => void;
  onBrowseMore?: () => void;
  isInherited?: boolean;
  inheritedPopulationType?: 'household' | 'nationwide' | null;
  savedPolicies?: SavedPolicy[];
  viewMode: ViewMode;
}

function IngredientSection({
  type,
  currentId,
  onQuickSelectPolicy,
  onSelectSavedPolicy,
  onQuickSelectPopulation,
  onCreateCustom,
  onBrowseMore,
  isInherited,
  inheritedPopulationType,
  savedPolicies = [],
  viewMode,
}: IngredientSectionProps) {
  const colorConfig = INGREDIENT_COLORS[type];
  const IconComponent = {
    policy: IconScale,
    population: IconUsers,
    dynamics: IconChartLine,
  }[type];

  const typeLabels = {
    policy: 'Policy',
    population: 'Population',
    dynamics: 'Dynamics',
  };

  const useRowLayout = viewMode === 'rows' || viewMode === 'horizontal';
  const chipVariant = useRowLayout ? 'row' : 'square';
  const iconSize = useRowLayout ? 20 : 16;

  const ChipComponent = useRowLayout ? OptionChipRow : OptionChipSquare;

  return (
    <Box
      style={{
        ...styles.ingredientSection,
        borderColor: colors.border.light,
        background: colors.white,
      }}
    >
      {/* Section header */}
      <Box style={styles.ingredientSectionHeader}>
        <Box
          style={{
            ...styles.ingredientSectionIcon,
            background: colorConfig.bg,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <IconComponent size={16} color={colorConfig.icon} stroke={2} />
        </Box>
        <Text fw={600} c={colorConfig.icon} style={{ fontSize: FONT_SIZES.normal, userSelect: 'none' }}>
          {typeLabels[type]}
        </Text>
        {isInherited && (
          <Text style={styles.inheritedBadge}>(inherited from baseline)</Text>
        )}
      </Box>

      {/* Chips container */}
      {isInherited && inheritedPopulationType ? (
        <Box style={useRowLayout ? styles.chipRowContainer : styles.chipGridSquare}>
          <Box
            style={{
              ...(useRowLayout ? styles.chipRow : styles.chipSquare),
              opacity: 0.6,
              cursor: 'not-allowed',
              background: colors.gray[100],
              borderColor: colors.gray[200],
            }}
          >
            {useRowLayout ? (
              <>
                <Box
                  style={{
                    ...styles.chipRowIcon,
                    background: colors.gray[200],
                  }}
                >
                  {inheritedPopulationType === 'household' ? (
                    <IconHome size={20} color={colors.gray[500]} />
                  ) : (
                    <IconWorld size={20} color={colors.gray[500]} />
                  )}
                </Box>
                <Stack gap={2} style={{ flex: 1 }}>
                  <Text fw={600} c={colors.gray[500]} style={{ fontSize: FONT_SIZES.normal }}>
                    {inheritedPopulationType === 'household' ? 'Household' : 'Nationwide'}
                  </Text>
                  <Text c={colors.gray[400]} style={{ fontSize: FONT_SIZES.small }}>
                    Inherited from baseline
                  </Text>
                </Stack>
              </>
            ) : (
              <>
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: spacing.radius.sm,
                    background: colors.gray[200],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {inheritedPopulationType === 'household' ? (
                    <IconHome size={16} color={colors.gray[500]} />
                  ) : (
                    <IconWorld size={16} color={colors.gray[500]} />
                  )}
                </Box>
                <Text
                  ta="center"
                  fw={600}
                  c={colors.gray[500]}
                  style={{ fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
                >
                  {inheritedPopulationType === 'household' ? 'Household' : 'Nationwide'}
                </Text>
                <Text
                  ta="center"
                  c={colors.gray[400]}
                  style={{ fontSize: FONT_SIZES.tiny, lineHeight: 1.2 }}
                >
                  Inherited
                </Text>
              </>
            )}
          </Box>
        </Box>
      ) : (
        <Box style={useRowLayout ? styles.chipRowContainer : styles.chipGridSquare}>
          {type === 'policy' && onQuickSelectPolicy && (
            <>
              {/* Current law - always first */}
              <ChipComponent
                icon={<IconScale size={iconSize} color={currentId === 'current-law' ? colorConfig.icon : colors.gray[500]} />}
                label="Current law"
                description="No changes"
                isSelected={currentId === 'current-law'}
                onClick={() => onQuickSelectPolicy('current-law')}
                colorConfig={colorConfig}
              />
              {/* Saved policies - up to 3 shown (total 4 with Current law) */}
              {savedPolicies.slice(0, 3).map((policy) => (
                <ChipComponent
                  key={policy.id}
                  icon={<IconFileDescription size={iconSize} color={currentId === policy.id ? colorConfig.icon : colors.gray[500]} />}
                  label={policy.label}
                  description={`${policy.paramCount} param${policy.paramCount !== 1 ? 's' : ''}`}
                  isSelected={currentId === policy.id}
                  onClick={() => onSelectSavedPolicy?.(policy.id, policy.label, policy.paramCount)}
                  colorConfig={colorConfig}
                />
              ))}
              {/* Browse more - always shown for searching/browsing all policies */}
              {onBrowseMore && (
                <BrowseMoreChip
                  label="Browse more"
                  description={savedPolicies.length > 3 ? `${savedPolicies.length - 3} more` : 'Search all'}
                  onClick={onBrowseMore}
                  variant={chipVariant}
                  colorConfig={colorConfig}
                />
              )}
              {/* Create custom - always last */}
              <CreateCustomChip
                label="Create custom"
                onClick={onCreateCustom}
                variant={chipVariant}
                colorConfig={colorConfig}
              />
            </>
          )}

          {type === 'population' && onQuickSelectPopulation && (
            <>
              <ChipComponent
                icon={<IconHome size={iconSize} color={currentId === 'sample-household' ? colorConfig.icon : colors.gray[500]} />}
                label="Household"
                description="Single family"
                isSelected={currentId === 'sample-household'}
                onClick={() => onQuickSelectPopulation('household')}
                colorConfig={colorConfig}
              />
              <ChipComponent
                icon={<IconWorld size={iconSize} color={currentId === 'us-nationwide' ? colorConfig.icon : colors.gray[500]} />}
                label="Nationwide"
                description="Economy-wide"
                isSelected={currentId === 'us-nationwide'}
                onClick={() => onQuickSelectPopulation('nationwide')}
                colorConfig={colorConfig}
              />
              {/* Browse more - always shown for searching/browsing all populations */}
              {onBrowseMore && (
                <BrowseMoreChip
                  label="Browse more"
                  description="Search all"
                  onClick={onBrowseMore}
                  variant={chipVariant}
                  colorConfig={colorConfig}
                />
              )}
              <CreateCustomChip
                label="Create custom"
                onClick={onCreateCustom}
                variant={chipVariant}
                colorConfig={colorConfig}
              />
            </>
          )}

          {type === 'dynamics' && (
            <Box
              style={{
                padding: spacing.md,
                background: colors.white,
                borderRadius: spacing.radius.md,
                border: `1px dashed ${colorConfig.border}`,
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Group gap={spacing.sm}>
                <IconSparkles size={18} color={colorConfig.accent} />
                <Text c={colorConfig.icon} style={{ fontSize: FONT_SIZES.normal }}>
                  Dynamics coming soon
                </Text>
              </Group>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

interface SimulationBlockProps {
  simulation: SimulationStateProps;
  index: number;
  onLabelChange: (label: string) => void;
  onQuickSelectPolicy: (policyType: 'current-law') => void;
  onSelectSavedPolicy: (id: string, label: string, paramCount: number) => void;
  onQuickSelectPopulation: (populationType: 'household' | 'nationwide') => void;
  onCreateCustomPolicy: () => void;
  onBrowseMorePolicies: () => void;
  onCreateCustomPopulation: () => void;
  onBrowseMorePopulations: () => void;
  onRemove?: () => void;
  canRemove: boolean;
  isRequired?: boolean;
  populationInherited?: boolean;
  inheritedPopulation?: PopulationStateProps | null;
  savedPolicies: SavedPolicy[];
  viewMode: ViewMode;
}

function SimulationBlock({
  simulation,
  index,
  onLabelChange,
  onQuickSelectPolicy,
  onSelectSavedPolicy,
  onQuickSelectPopulation,
  onCreateCustomPolicy,
  onBrowseMorePolicies,
  onCreateCustomPopulation,
  onBrowseMorePopulations,
  onRemove,
  canRemove,
  isRequired,
  populationInherited,
  inheritedPopulation,
  savedPolicies,
  viewMode,
}: SimulationBlockProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState(simulation.label || '');

  const isPolicyConfigured = !!simulation.policy.id;
  const effectivePopulation = populationInherited && inheritedPopulation
    ? inheritedPopulation
    : simulation.population;
  const isPopulationConfigured = !!(
    effectivePopulation?.household?.id || effectivePopulation?.geography?.id
  );
  const isFullyConfigured = isPolicyConfigured && isPopulationConfigured;

  const handleLabelSubmit = () => {
    onLabelChange(labelInput || (index === 0 ? 'Baseline simulation' : 'Reform simulation'));
    setIsEditingLabel(false);
  };

  const defaultLabel = index === 0 ? 'Baseline simulation' : 'Reform simulation';
  const isHorizontal = viewMode === 'horizontal';
  const cardStyle = isHorizontal ? styles.simulationCardHorizontal : styles.simulationCard;

  const currentPolicyId = simulation.policy.id;
  const currentPopulationId = effectivePopulation?.household?.id || effectivePopulation?.geography?.id;

  // Determine inherited population type for display
  const inheritedPopulationType = populationInherited && inheritedPopulation
    ? (inheritedPopulation.household?.id ? 'household' : inheritedPopulation.geography?.id ? 'nationwide' : null)
    : null;

  return (
    <Paper
      style={{
        ...cardStyle,
        ...(isFullyConfigured ? styles.simulationCardActive : {}),
      }}
    >
      {/* Status indicator */}
      <Box
        style={{
          position: 'absolute',
          top: -1,
          left: 20,
          right: 20,
          height: 4,
          borderRadius: '0 0 4px 4px',
          background: isFullyConfigured
            ? `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[500]})`
            : colors.gray[200],
        }}
      />

      {/* Header */}
      <Box style={styles.simulationHeader}>
        <Group gap={spacing.sm}>
          {isEditingLabel ? (
            <TextInput
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onBlur={handleLabelSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleLabelSubmit()}
              size="sm"
              autoFocus
              styles={{
                input: {
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: FONT_SIZES.normal,
                },
              }}
            />
          ) : (
            <Group gap={spacing.xs}>
              <Text style={styles.simulationTitle}>
                {simulation.label || defaultLabel}
              </Text>
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={() => {
                  setLabelInput(simulation.label || defaultLabel);
                  setIsEditingLabel(true);
                }}
              >
                <IconPencil size={12} />
              </ActionIcon>
            </Group>
          )}
        </Group>

        <Group gap={spacing.xs}>
          {isRequired && (
            <Text c="dimmed" fs="italic" style={{ fontSize: FONT_SIZES.small }}>
              Required
            </Text>
          )}
          {isFullyConfigured && (
            <Tooltip label="Fully configured">
              <Box
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: colors.success,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconCheck size={12} color="white" stroke={3} />
              </Box>
            </Tooltip>
          )}
          {canRemove && (
            <ActionIcon size="sm" variant="subtle" color="red" onClick={onRemove}>
              <IconTrash size={14} />
            </ActionIcon>
          )}
        </Group>
      </Box>

      {/* Panels - direct children for subgrid alignment */}
      <IngredientSection
        type="policy"
        currentId={currentPolicyId}
        onQuickSelectPolicy={onQuickSelectPolicy}
        onSelectSavedPolicy={onSelectSavedPolicy}
        onCreateCustom={onCreateCustomPolicy}
        onBrowseMore={onBrowseMorePolicies}
        savedPolicies={savedPolicies}
        viewMode={viewMode}
      />

      <IngredientSection
        type="population"
        currentId={currentPopulationId}
        onQuickSelectPopulation={onQuickSelectPopulation}
        onCreateCustom={onCreateCustomPopulation}
        onBrowseMore={onBrowseMorePopulations}
        isInherited={populationInherited}
        inheritedPopulationType={inheritedPopulationType}
        viewMode={viewMode}
      />

      <IngredientSection
        type="dynamics"
        onCreateCustom={() => {}}
        viewMode={viewMode}
      />
    </Paper>
  );
}

interface AddSimulationCardProps {
  onClick: () => void;
  disabled?: boolean;
  viewMode: ViewMode;
}

function AddSimulationCard({ onClick, disabled, viewMode }: AddSimulationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isHorizontal = viewMode === 'horizontal';
  const cardStyle = isHorizontal ? styles.addSimulationCardHorizontal : styles.addSimulationCard;

  return (
    <Box
      style={{
        ...cardStyle,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderColor: isHovered && !disabled ? colors.primary[400] : colors.border.medium,
        background: isHovered && !disabled ? colors.primary[50] : colors.white,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={disabled ? undefined : onClick}
    >
      <Box
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: isHovered && !disabled ? colors.primary[100] : colors.gray[100],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        <IconPlus
          size={28}
          color={isHovered && !disabled ? colors.primary[600] : colors.gray[400]}
        />
      </Box>
      <Text
        fw={600}
        c={isHovered && !disabled ? colors.primary[700] : colors.gray[500]}
        style={{ fontSize: FONT_SIZES.normal }}
      >
        Add reform simulation
      </Text>
      <Text
        c="dimmed"
        ta="center"
        style={{ fontSize: FONT_SIZES.small, maxWidth: 200 }}
      >
        Compare policy changes against your baseline
      </Text>
    </Box>
  );
}

// ============================================================================
// INGREDIENT PICKER MODAL
// ============================================================================

interface IngredientPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: IngredientType;
  onSelect: (item: PolicyStateProps | PopulationStateProps | null) => void;
  onCreateNew: () => void;
}

function IngredientPickerModal({
  isOpen,
  onClose,
  type,
  onSelect,
  onCreateNew,
}: IngredientPickerModalProps) {
  const userId = MOCK_USER_ID.toString();
  const { data: policies } = useUserPolicies(userId);
  const { data: households } = useUserHouseholds(userId);
  const colorConfig = INGREDIENT_COLORS[type];

  const getTitle = () => {
    switch (type) {
      case 'policy': return 'Select policy';
      case 'population': return 'Select population';
      case 'dynamics': return 'Configure dynamics';
    }
  };

  const getIcon = () => {
    const iconProps = { size: 20, color: colorConfig.icon };
    switch (type) {
      case 'policy': return <IconScale {...iconProps} />;
      case 'population': return <IconUsers {...iconProps} />;
      case 'dynamics': return <IconChartLine {...iconProps} />;
    }
  };

  const handleSelectPolicy = (policyId: string, label: string, paramCount: number) => {
    onSelect({ id: policyId, label, parameters: Array(paramCount).fill({}) });
    onClose();
  };

  const handleSelectCurrentLaw = () => {
    onSelect({ id: 'current-law', label: 'Current law', parameters: [] });
    onClose();
  };

  const handleSelectHousehold = (householdId: string, label: string) => {
    onSelect({
      label,
      type: 'household',
      household: { id: householdId, countryId: 'us', householdData: { people: {} } },
      geography: null,
    });
    onClose();
  };

  const handleSelectGeography = (geoId: string, label: string, scope: 'national' | 'subnational') => {
    onSelect({
      label,
      type: 'geography',
      household: null,
      geography: { id: geoId, countryId: 'us', scope, geographyId: geoId, name: label },
    });
    onClose();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap={spacing.sm}>
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: spacing.radius.sm,
              background: colorConfig.bg,
              border: `1px solid ${colorConfig.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getIcon()}
          </Box>
          <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>{getTitle()}</Text>
        </Group>
      }
      size="lg"
      radius="lg"
      styles={{
        header: { borderBottom: `1px solid ${colors.border.light}`, paddingBottom: spacing.md },
        body: { padding: spacing.xl },
      }}
    >
      <Stack gap={spacing.lg}>
        {type === 'policy' && (
          <>
            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={handleSelectCurrentLaw}>
              <Group gap={spacing.md}>
                <Box style={{ width: 36, height: 36, borderRadius: spacing.radius.md, background: colorConfig.bg, border: `1px solid ${colorConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconScale size={18} color={colorConfig.icon} />
                </Box>
                <Stack gap={2}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>Current law</Text>
                  <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>Use existing tax and benefit rules without modifications</Text>
                </Stack>
              </Group>
            </Paper>
            <Divider label="Or select an existing policy" labelPosition="center" />
            <ScrollArea h={200}>
              <Stack gap={spacing.sm}>
                {policies?.map((p) => (
                  <Paper key={p.policy?.id} p="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => handleSelectPolicy(p.policy?.id || '', p.userPolicy?.label || 'Unnamed', p.policy?.parameters?.length || 0)}>
                    <Group justify="space-between">
                      <Stack gap={2}>
                        <Text fw={500} style={{ fontSize: FONT_SIZES.normal }}>{p.userPolicy?.label || 'Unnamed'}</Text>
                        <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>{p.policy?.parameters?.length || 0} parameters</Text>
                      </Stack>
                      <IconChevronRight size={16} color={colors.gray[400]} />
                    </Group>
                  </Paper>
                ))}
                {(!policies || policies.length === 0) && <Text c="dimmed" ta="center" py="lg">No saved policies</Text>}
              </Stack>
            </ScrollArea>
            <Divider />
            <Button variant="light" color="teal" leftSection={<IconPlus size={16} />} onClick={() => { onCreateNew(); onClose(); }}>Create new policy</Button>
          </>
        )}

        {type === 'population' && (
          <>
            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => handleSelectGeography('us-nationwide', 'Sample nationwide', 'national')}>
              <Group gap={spacing.md}>
                <Box style={{ width: 36, height: 36, borderRadius: spacing.radius.md, background: colorConfig.bg, border: `1px solid ${colorConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconWorld size={18} color={colorConfig.icon} />
                </Box>
                <Stack gap={2}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>Sample nationwide</Text>
                  <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>Economy-wide simulation</Text>
                </Stack>
              </Group>
            </Paper>
            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => handleSelectHousehold('sample-household', 'Sample household')}>
              <Group gap={spacing.md}>
                <Box style={{ width: 36, height: 36, borderRadius: spacing.radius.md, background: colorConfig.bg, border: `1px solid ${colorConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconHome size={18} color={colorConfig.icon} />
                </Box>
                <Stack gap={2}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>Sample household</Text>
                  <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>Single household simulation</Text>
                </Stack>
              </Group>
            </Paper>
            <Divider label="Or select an existing household" labelPosition="center" />
            <ScrollArea h={150}>
              <Stack gap={spacing.sm}>
                {households?.map((h) => (
                  <Paper key={h.household?.id} p="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => handleSelectHousehold(h.household?.id || '', h.userHousehold?.label || 'Unnamed')}>
                    <Group justify="space-between">
                      <Text fw={500} style={{ fontSize: FONT_SIZES.normal }}>{h.userHousehold?.label || 'Unnamed'}</Text>
                      <IconChevronRight size={16} color={colors.gray[400]} />
                    </Group>
                  </Paper>
                ))}
                {(!households || households.length === 0) && <Text c="dimmed" ta="center" py="lg">No saved households</Text>}
              </Stack>
            </ScrollArea>
            <Divider />
            <Button variant="light" color="teal" leftSection={<IconPlus size={16} />} onClick={() => { onCreateNew(); onClose(); }}>Create new household</Button>
          </>
        )}

        {type === 'dynamics' && (
          <Stack gap={spacing.lg} align="center" py="xl">
            <Box style={{ width: 64, height: 64, borderRadius: '50%', background: colorConfig.bg, border: `1px solid ${colorConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconSparkles size={28} color={colorConfig.icon} />
            </Box>
            <Stack gap={spacing.xs} align="center">
              <Text fw={600} c={colors.gray[700]}>Dynamics coming soon</Text>
              <Text c="dimmed" ta="center" maw={300} style={{ fontSize: FONT_SIZES.small }}>Dynamic behavioral responses will be available in a future update.</Text>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}

// ============================================================================
// SIMULATION CANVAS
// ============================================================================

interface SimulationCanvasProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  pickerState: IngredientPickerState;
  setPickerState: React.Dispatch<React.SetStateAction<IngredientPickerState>>;
  viewMode: ViewMode;
}

function SimulationCanvas({
  reportState,
  setReportState,
  pickerState,
  setPickerState,
  viewMode,
}: SimulationCanvasProps) {
  const countryId = useCurrentCountry();
  const userId = MOCK_USER_ID.toString();
  const { data: policies } = useUserPolicies(userId);
  const isNationwideSelected = reportState.simulations[0]?.population?.geography?.id === 'us-nationwide';

  // Transform policies data into SavedPolicy format
  const savedPolicies: SavedPolicy[] = (policies || []).map((p) => ({
    id: p.policy?.id || '',
    label: p.userPolicy?.label || 'Unnamed policy',
    paramCount: p.policy?.parameters?.length || 0,
  }));

  const handleAddSimulation = useCallback(() => {
    if (reportState.simulations.length >= 2) return;
    const newSim = initializeSimulationState();
    newSim.label = 'Reform simulation';
    newSim.population = { ...reportState.simulations[0].population };
    setReportState((prev) => ({ ...prev, simulations: [...prev.simulations, newSim] }));
  }, [reportState.simulations, setReportState]);

  const handleRemoveSimulation = useCallback((index: number) => {
    if (index === 0) return;
    setReportState((prev) => ({ ...prev, simulations: prev.simulations.filter((_, i) => i !== index) }));
  }, [setReportState]);

  const handleSimulationLabelChange = useCallback((index: number, label: string) => {
    setReportState((prev) => ({
      ...prev,
      simulations: prev.simulations.map((sim, i) => i === index ? { ...sim, label } : sim),
    }));
  }, [setReportState]);

  const handleIngredientSelect = useCallback(
    (item: PolicyStateProps | PopulationStateProps | null) => {
      const { simulationIndex, ingredientType } = pickerState;
      setReportState((prev) => {
        const newSimulations = prev.simulations.map((sim, i) => {
          if (i !== simulationIndex) return sim;
          if (ingredientType === 'policy') return { ...sim, policy: item as PolicyStateProps };
          if (ingredientType === 'population') return { ...sim, population: item as PopulationStateProps };
          return sim;
        });
        if (ingredientType === 'population' && simulationIndex === 0 && newSimulations.length > 1) {
          newSimulations[1] = { ...newSimulations[1], population: { ...(item as PopulationStateProps) } };
        }
        return { ...prev, simulations: newSimulations };
      });
    },
    [pickerState, setReportState]
  );

  const handleQuickSelectPolicy = useCallback(
    (simulationIndex: number) => {
      const policyState: PolicyStateProps = { id: 'current-law', label: 'Current law', parameters: [] };
      setReportState((prev) => ({
        ...prev,
        simulations: prev.simulations.map((sim, i) => i === simulationIndex ? { ...sim, policy: policyState } : sim),
      }));
    },
    [setReportState]
  );

  const handleSelectSavedPolicy = useCallback(
    (simulationIndex: number, policyId: string, label: string, paramCount: number) => {
      const policyState: PolicyStateProps = { id: policyId, label, parameters: Array(paramCount).fill({}) };
      setReportState((prev) => ({
        ...prev,
        simulations: prev.simulations.map((sim, i) => i === simulationIndex ? { ...sim, policy: policyState } : sim),
      }));
    },
    [setReportState]
  );

  const handleBrowseMorePolicies = useCallback(
    (simulationIndex: number) => {
      setPickerState({
        isOpen: true,
        simulationIndex,
        ingredientType: 'policy',
      });
    },
    [setPickerState]
  );

  const handleBrowseMorePopulations = useCallback(
    (simulationIndex: number) => {
      setPickerState({
        isOpen: true,
        simulationIndex,
        ingredientType: 'population',
      });
    },
    [setPickerState]
  );

  const handleQuickSelectPopulation = useCallback(
    (simulationIndex: number, populationType: 'household' | 'nationwide') => {
      const populationState = populationType === 'household' ? SAMPLE_POPULATIONS.household : SAMPLE_POPULATIONS.nationwide;
      setReportState((prev) => {
        let newSimulations = prev.simulations.map((sim, i) =>
          i === simulationIndex ? { ...sim, population: { ...populationState } } : sim
        );

        // If switching baseline from nationwide to household, check if reform should be cleared
        if (simulationIndex === 0 && populationType === 'household' && newSimulations.length > 1) {
          const reform = newSimulations[1];
          // Check if reform has only default/inherited values (no custom policy configured)
          const hasDefaultPolicy = !reform.policy.id || reform.policy.id === 'current-law';
          const hasDefaultLabel = !reform.label || reform.label === 'Reform simulation';

          // If reform is essentially default, remove it when switching to household
          if (hasDefaultPolicy && hasDefaultLabel) {
            newSimulations = [newSimulations[0]];
          } else {
            // Otherwise just update the inherited population
            newSimulations[1] = { ...newSimulations[1], population: { ...populationState } };
          }
        } else if (simulationIndex === 0 && newSimulations.length > 1) {
          // Update the reform's inherited population
          newSimulations[1] = { ...newSimulations[1], population: { ...populationState } };
        }

        return { ...prev, simulations: newSimulations };
      });
    },
    [setReportState]
  );

  const handleCreateCustom = useCallback(
    (simulationIndex: number, ingredientType: IngredientType) => {
      if (ingredientType === 'policy') {
        window.location.href = `/${countryId}/policies/create`;
      } else if (ingredientType === 'population') {
        window.location.href = `/${countryId}/households/create`;
      }
    },
    [countryId]
  );

  const isHorizontal = viewMode === 'horizontal';
  const containerStyle = isHorizontal ? styles.simulationsContainerHorizontal : styles.simulationsGrid;

  return (
    <>
      <Box style={styles.canvasContainer}>
        <Box style={styles.canvasGrid} />
        <Box style={containerStyle}>
          <SimulationBlock
            simulation={reportState.simulations[0]}
            index={0}
            onLabelChange={(label) => handleSimulationLabelChange(0, label)}
            onQuickSelectPolicy={() => handleQuickSelectPolicy(0)}
            onSelectSavedPolicy={(id, label, paramCount) => handleSelectSavedPolicy(0, id, label, paramCount)}
            onQuickSelectPopulation={(type) => handleQuickSelectPopulation(0, type)}
            onCreateCustomPolicy={() => handleCreateCustom(0, 'policy')}
            onBrowseMorePolicies={() => handleBrowseMorePolicies(0)}
            onCreateCustomPopulation={() => handleCreateCustom(0, 'population')}
            onBrowseMorePopulations={() => handleBrowseMorePopulations(0)}
            canRemove={false}
            savedPolicies={savedPolicies}
            viewMode={viewMode}
          />

          {reportState.simulations.length > 1 ? (
            <SimulationBlock
              simulation={reportState.simulations[1]}
              index={1}
              onLabelChange={(label) => handleSimulationLabelChange(1, label)}
              onQuickSelectPolicy={() => handleQuickSelectPolicy(1)}
              onSelectSavedPolicy={(id, label, paramCount) => handleSelectSavedPolicy(1, id, label, paramCount)}
              onQuickSelectPopulation={(type) => handleQuickSelectPopulation(1, type)}
              onCreateCustomPolicy={() => handleCreateCustom(1, 'policy')}
              onBrowseMorePolicies={() => handleBrowseMorePolicies(1)}
              onCreateCustomPopulation={() => handleCreateCustom(1, 'population')}
              onBrowseMorePopulations={() => handleBrowseMorePopulations(1)}
              onRemove={() => handleRemoveSimulation(1)}
              canRemove={!isNationwideSelected}
              isRequired={isNationwideSelected}
              populationInherited={true}
              inheritedPopulation={reportState.simulations[0].population}
              savedPolicies={savedPolicies}
              viewMode={viewMode}
            />
          ) : (
            <AddSimulationCard onClick={handleAddSimulation} disabled={false} viewMode={viewMode} />
          )}
        </Box>
      </Box>

      <IngredientPickerModal
        isOpen={pickerState.isOpen}
        onClose={() => setPickerState((prev) => ({ ...prev, isOpen: false }))}
        type={pickerState.ingredientType}
        onSelect={handleIngredientSelect}
        onCreateNew={() => handleCreateCustom(pickerState.simulationIndex, pickerState.ingredientType)}
      />
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ReportBuilderPage() {
  const [activeTab, setActiveTab] = useState<string | null>('cards');

  const initialSim = initializeSimulationState();
  initialSim.label = 'Baseline simulation';

  const [reportState, setReportState] = useState<ReportBuilderState>({
    label: null,
    year: CURRENT_YEAR,
    simulations: [initialSim],
  });

  const [pickerState, setPickerState] = useState<IngredientPickerState>({
    isOpen: false,
    simulationIndex: 0,
    ingredientType: 'policy',
  });

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState('');

  const isNationwideSelected = reportState.simulations[0]?.population?.geography?.id === 'us-nationwide';

  useEffect(() => {
    if (isNationwideSelected && reportState.simulations.length === 1) {
      const newSim = initializeSimulationState();
      newSim.label = 'Reform simulation';
      newSim.population = { ...reportState.simulations[0].population };
      setReportState((prev) => ({ ...prev, simulations: [...prev.simulations, newSim] }));
    }
  }, [isNationwideSelected, reportState.simulations]);

  const handleReportLabelSubmit = () => {
    setReportState((prev) => ({ ...prev, label: labelInput || 'Untitled report' }));
    setIsEditingLabel(false);
  };

  const isReportConfigured = reportState.simulations.every(
    (sim) => !!sim.policy.id && !!(sim.population.household?.id || sim.population.geography?.id)
  );

  const viewMode = (activeTab || 'cards') as ViewMode;

  return (
    <Box style={styles.pageContainer}>
      <Box style={styles.headerSection}>
        <h1 style={styles.mainTitle}>Report builder</h1>
      </Box>

      <Paper style={styles.reportMetaCard}>
        <Group justify="space-between" align="flex-start">
          <Stack gap={spacing.md}>
            <Group gap={spacing.sm}>
              <IconFileDescription size={20} color={colors.gray[500]} />
              {isEditingLabel ? (
                <TextInput
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onBlur={handleReportLabelSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleReportLabelSubmit()}
                  placeholder="Enter report name..."
                  size="sm"
                  autoFocus
                  styles={{ input: { fontWeight: typography.fontWeight.semibold, fontSize: FONT_SIZES.normal, width: 300 } }}
                />
              ) : (
                <Group gap={spacing.xs}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>{reportState.label || 'Untitled report'}</Text>
                  <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => { setLabelInput(reportState.label || ''); setIsEditingLabel(true); }}>
                    <IconPencil size={12} />
                  </ActionIcon>
                </Group>
              )}
            </Group>
            <Group gap={spacing.md}>
              <Group gap={spacing.xs}>
                <Text c="dimmed" style={{ fontSize: FONT_SIZES.normal }}>Year:</Text>
                <Select
                  value={reportState.year}
                  onChange={(value) => setReportState((prev) => ({ ...prev, year: value || CURRENT_YEAR }))}
                  data={['2023', '2024', '2025', '2026']}
                  size="xs"
                  w={80}
                  styles={{ input: { fontSize: FONT_SIZES.normal } }}
                />
              </Group>
            </Group>
          </Stack>
          <Button variant="filled" color="teal" disabled={!isReportConfigured} leftSection={<IconCheck size={16} />}>
            Run report
          </Button>
        </Group>
      </Paper>

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="cards" leftSection={<IconLayoutColumns size={16} />}>Card view</Tabs.Tab>
          <Tabs.Tab value="rows" leftSection={<IconRowInsertBottom size={16} />}>Row view</Tabs.Tab>
          <Tabs.Tab value="horizontal" leftSection={<IconLayoutList size={16} />}>Horizontal view</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <SimulationCanvas
        reportState={reportState}
        setReportState={setReportState}
        pickerState={pickerState}
        setPickerState={setPickerState}
        viewMode={viewMode}
      />
    </Box>
  );
}
