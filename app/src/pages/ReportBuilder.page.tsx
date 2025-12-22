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
import { useState, useCallback, useEffect, useMemo } from 'react';
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
  UnstyledButton,
  Skeleton,
} from '@mantine/core';
import {
  IconPlus,
  IconScale,
  IconUsers,
  IconChartLine,
  IconCheck,
  IconX,
  IconPencil,
  IconChevronRight,
  IconInfoCircle,
  IconTrash,
  IconSparkles,
  IconFileDescription,
  IconLayoutList,
  IconLayoutColumns,
  IconHome,
  IconRowInsertBottom,
  IconSearch,
  IconPlayerPlay,
  IconCircleCheck,
  IconCircleDashed,
  IconArrowRight,
  IconClock,
  IconFolder,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
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
import { CURRENT_YEAR, getParamDefinitionDate } from '@/constants';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { MOCK_USER_ID } from '@/constants';
import { RootState } from '@/store';
import {
  getHierarchicalLabels,
  buildCompactLabel,
  formatLabelParts,
} from '@/utils/parameterLabels';
import {
  USOutlineIcon,
  UKOutlineIcon,
} from '@/components/icons/CountryOutlineIcons';
import {
  getCurrentLawParameterValue,
  formatParameterValue,
} from '@/utils/policyTableHelpers';

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

// Country-specific configuration
const COUNTRY_CONFIG = {
  us: {
    nationwideTitle: 'United States',
    nationwideSubtitle: 'Nationwide',
    nationwideLabel: 'United States', // Used for geography name
    nationwideId: 'us-nationwide',
    geographyId: 'us',
  },
  uk: {
    nationwideTitle: 'United Kingdom',
    nationwideSubtitle: 'UK-wide',
    nationwideLabel: 'United Kingdom', // Used for geography name
    nationwideId: 'uk-nationwide',
    geographyId: 'uk',
  },
} as const;

// Helper to get sample populations for a country
const getSamplePopulations = (countryId: 'us' | 'uk') => {
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
        id: config.nationwideId,
        countryId,
        scope: 'national' as const,
        geographyId: config.geographyId,
        name: config.nationwideLabel,
      },
    },
  };
};

// Country-specific map icon component
function CountryMapIcon({ countryId, size, color }: { countryId: string; size: number; color: string }) {
  if (countryId === 'uk') {
    return <UKOutlineIcon size={size} color={color} />;
  }
  return <USOutlineIcon size={size} color={color} />;
}

// Default sample populations (for backwards compatibility)
const SAMPLE_POPULATIONS = getSamplePopulations('us');

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
    border: `2px solid ${colors.gray[200]}`,
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
    border: `2px solid ${colors.gray[200]}`,
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
// SUB-COMPONENTS
// ============================================================================

// Color config type that accepts any ingredient color variant
type IngredientColorConfig = {
  icon: string;
  bg: string;
  border: string;
  accent: string;
};

interface OptionChipSquareProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  colorConfig: IngredientColorConfig;
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
  colorConfig: IngredientColorConfig;
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
  colorConfig: IngredientColorConfig;
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
  colorConfig: IngredientColorConfig;
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
  countryId?: 'us' | 'uk';
  onQuickSelectPolicy?: (type: 'current-law') => void;
  onSelectSavedPolicy?: (id: string, label: string, paramCount: number) => void;
  onQuickSelectPopulation?: (type: 'household' | 'nationwide') => void;
  onDeselectPopulation?: () => void;
  onDeselectPolicy?: () => void;
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
  countryId = 'us',
  onQuickSelectPolicy,
  onSelectSavedPolicy,
  onQuickSelectPopulation,
  onDeselectPopulation,
  onDeselectPolicy,
  onCreateCustom,
  onBrowseMore,
  isInherited,
  inheritedPopulationType,
  savedPolicies = [],
  viewMode,
}: IngredientSectionProps) {
  const countryConfig = COUNTRY_CONFIG[countryId] || COUNTRY_CONFIG.us;
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
                    <CountryMapIcon countryId={countryId} size={20} color={colors.gray[500]} />
                  )}
                </Box>
                <Stack gap={2} style={{ flex: 1 }}>
                  <Text fw={600} c={colors.gray[500]} style={{ fontSize: FONT_SIZES.normal }}>
                    {inheritedPopulationType === 'household' ? 'Household' : countryConfig.nationwideTitle}
                  </Text>
                  <Text c={colors.gray[400]} style={{ fontSize: FONT_SIZES.small }}>
                    {inheritedPopulationType === 'household' ? 'Inherited from baseline' : countryConfig.nationwideSubtitle}
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
                    <CountryMapIcon countryId={countryId} size={16} color={colors.gray[500]} />
                  )}
                </Box>
                <Text
                  ta="center"
                  fw={600}
                  c={colors.gray[500]}
                  style={{ fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
                >
                  {inheritedPopulationType === 'household' ? 'Household' : countryConfig.nationwideTitle}
                </Text>
                <Text
                  ta="center"
                  c={colors.gray[400]}
                  style={{ fontSize: FONT_SIZES.tiny, lineHeight: 1.2 }}
                >
                  {inheritedPopulationType === 'household' ? 'Inherited' : countryConfig.nationwideSubtitle}
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
                onClick={() => {
                  if (currentId === 'current-law' && onDeselectPolicy) {
                    onDeselectPolicy();
                  } else {
                    onQuickSelectPolicy('current-law');
                  }
                }}
                colorConfig={colorConfig}
              />
              {/* Saved policies - up to 3 shown (total 4 with Current law) */}
              {savedPolicies.slice(0, 3).map((policy) => (
                <ChipComponent
                  key={policy.id}
                  icon={<IconFileDescription size={iconSize} color={currentId === policy.id ? colorConfig.icon : colors.gray[500]} />}
                  label={policy.label}
                  description={`${policy.paramCount} param${policy.paramCount !== 1 ? 's' : ''} changed`}
                  isSelected={currentId === policy.id}
                  onClick={() => {
                    if (currentId === policy.id && onDeselectPolicy) {
                      onDeselectPolicy();
                    } else {
                      onSelectSavedPolicy?.(policy.id, policy.label, policy.paramCount);
                    }
                  }}
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
                onClick={() => {
                  if (currentId === 'sample-household' && onDeselectPopulation) {
                    onDeselectPopulation();
                  } else {
                    onQuickSelectPopulation('household');
                  }
                }}
                colorConfig={colorConfig}
              />
              <ChipComponent
                icon={<CountryMapIcon countryId={countryId} size={iconSize} color={currentId === countryConfig.nationwideId ? colorConfig.icon : colors.gray[500]} />}
                label={countryConfig.nationwideTitle}
                description={countryConfig.nationwideSubtitle}
                isSelected={currentId === countryConfig.nationwideId}
                onClick={() => {
                  if (currentId === countryConfig.nationwideId && onDeselectPopulation) {
                    onDeselectPopulation();
                  } else {
                    onQuickSelectPopulation('nationwide');
                  }
                }}
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
  countryId: 'us' | 'uk';
  onLabelChange: (label: string) => void;
  onQuickSelectPolicy: (policyType: 'current-law') => void;
  onSelectSavedPolicy: (id: string, label: string, paramCount: number) => void;
  onQuickSelectPopulation: (populationType: 'household' | 'nationwide') => void;
  onDeselectPolicy: () => void;
  onDeselectPopulation: () => void;
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
  countryId,
  onLabelChange,
  onQuickSelectPolicy,
  onSelectSavedPolicy,
  onQuickSelectPopulation,
  onDeselectPolicy,
  onDeselectPopulation,
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
        countryId={countryId}
        onQuickSelectPolicy={onQuickSelectPolicy}
        onSelectSavedPolicy={onSelectSavedPolicy}
        onDeselectPolicy={onDeselectPolicy}
        onCreateCustom={onCreateCustomPolicy}
        onBrowseMore={onBrowseMorePolicies}
        savedPolicies={savedPolicies}
        viewMode={viewMode}
      />

      <IngredientSection
        type="population"
        currentId={currentPopulationId}
        countryId={countryId}
        onQuickSelectPopulation={onQuickSelectPopulation}
        onDeselectPopulation={onDeselectPopulation}
        onCreateCustom={onCreateCustomPopulation}
        onBrowseMore={onBrowseMorePopulations}
        isInherited={populationInherited}
        inheritedPopulationType={inheritedPopulationType}
        viewMode={viewMode}
      />

      <IngredientSection
        type="dynamics"
        countryId={countryId}
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
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const countryConfig = COUNTRY_CONFIG[countryId] || COUNTRY_CONFIG.us;
  const userId = MOCK_USER_ID.toString();
  const { data: policies } = useUserPolicies(userId);
  const { data: households } = useUserHouseholds(userId);
  const colorConfig = INGREDIENT_COLORS[type];
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const reportDate = getParamDefinitionDate();

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
      household: { id: householdId, countryId, householdData: { people: {} } },
      geography: null,
    });
    onClose();
  };

  const handleSelectGeography = (geoId: string, label: string, scope: 'national' | 'subnational') => {
    onSelect({
      label,
      type: 'geography',
      household: null,
      geography: { id: geoId, countryId, scope, geographyId: geoId, name: label },
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
      size="xl"
      radius="lg"
      styles={{
        content: { width: '80vw', maxWidth: '1200px' },
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
            <ScrollArea h={320}>
              <Stack gap={spacing.sm}>
                {policies?.map((p) => {
                  const policyId = p.policy?.id || '';
                  const policyJson = p.policy?.policy_json || {};
                  const paramEntries = Object.entries(policyJson);
                  const paramCount = paramEntries.length;
                  const isExpanded = expandedPolicyId === policyId;

                  return (
                    <Paper
                      key={policyId}
                      radius="md"
                      withBorder
                      style={{
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        borderColor: isExpanded ? colorConfig.border : undefined,
                      }}
                    >
                      {/* Main clickable row */}
                      <Box
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: spacing.sm,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onClick={() => handleSelectPolicy(policyId, p.association?.label || 'Unnamed', paramCount)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.gray[50];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* Policy info - takes remaining space */}
                        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                          <Text fw={500} style={{ fontSize: FONT_SIZES.normal }}>{p.association?.label || 'Unnamed'}</Text>
                          <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                            {paramCount} param{paramCount !== 1 ? 's' : ''} changed
                          </Text>
                        </Stack>

                        {/* Info/expand button - isolated click zone */}
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent selection
                            setExpandedPolicyId(isExpanded ? null : policyId);
                          }}
                          style={{ marginRight: spacing.sm }}
                          aria-label={isExpanded ? 'Hide parameter details' : 'Show parameter details'}
                        >
                          <IconInfoCircle size={18} />
                        </ActionIcon>

                        {/* Select indicator */}
                        <IconChevronRight size={16} color={colors.gray[400]} />
                      </Box>

                      {/* Expandable parameter details - table-like display */}
                      <Box
                        style={{
                          maxHeight: isExpanded ? '400px' : '0px',
                          opacity: isExpanded ? 1 : 0,
                          overflow: isExpanded ? 'auto' : 'hidden',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          borderTop: isExpanded ? `1px solid ${colors.gray[200]}` : 'none',
                        }}
                      >
                        <Box style={{ padding: spacing.md }}>
                          {/* Table header */}
                          <Box
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 120px 120px',
                              gap: spacing.md,
                              paddingBottom: spacing.xs,
                              borderBottom: `1px solid ${colors.gray[200]}`,
                              marginBottom: spacing.sm,
                            }}
                          >
                            <Text fw={600} c="dimmed" style={{ fontSize: FONT_SIZES.tiny, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Parameter
                            </Text>
                            <Text fw={600} c="dimmed" style={{ fontSize: FONT_SIZES.tiny, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                              Current law
                            </Text>
                            <Text fw={600} c="dimmed" style={{ fontSize: FONT_SIZES.tiny, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                              Changed to
                            </Text>
                          </Box>

                          {/* Parameter rows */}
                          <Stack gap={spacing.xs}>
                            {paramEntries.length > 0 ? (
                              paramEntries.slice(0, 15).map(([paramName, paramValues]) => {
                                // Get full hierarchical label for the parameter (no compacting)
                                const hierarchicalLabels = getHierarchicalLabels(paramName, parameters);
                                const displayLabel = hierarchicalLabels.length > 0
                                  ? formatLabelParts(hierarchicalLabels)
                                  : paramName.split('.').pop() || paramName;

                                // Get current law value
                                const currentLawValue = getCurrentLawParameterValue(paramName, parameters, reportDate);

                                // Get the changed value
                                const valueEntries = Object.entries(paramValues as Record<string, unknown>);
                                const rawValue = valueEntries.length > 0 ? valueEntries[0][1] : undefined;
                                const metadata = parameters[paramName];
                                const changedValue = rawValue !== undefined
                                  ? formatParameterValue(rawValue, metadata?.unit)
                                  : '—';

                                return (
                                  <Box
                                    key={paramName}
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: '1fr 120px 120px',
                                      gap: spacing.md,
                                      padding: `${spacing.xs} 0`,
                                      borderBottom: `1px solid ${colors.gray[100]}`,
                                    }}
                                  >
                                    {/* Parameter name with code underneath */}
                                    <Box style={{ minWidth: 0 }}>
                                      <Text
                                        fw={500}
                                        style={{
                                          fontSize: FONT_SIZES.normal,
                                          color: colors.gray[800],
                                          lineHeight: 1.4,
                                        }}
                                      >
                                        {displayLabel}
                                      </Text>
                                      <Text
                                        style={{
                                          fontSize: FONT_SIZES.small,
                                          color: colors.gray[500],
                                          fontFamily: 'monospace',
                                          wordBreak: 'break-all',
                                        }}
                                      >
                                        {paramName}
                                      </Text>
                                    </Box>

                                    {/* Current law value */}
                                    <Text
                                      style={{
                                        fontSize: FONT_SIZES.small,
                                        color: colors.gray[500],
                                        textAlign: 'right',
                                        alignSelf: 'center',
                                      }}
                                    >
                                      {currentLawValue}
                                    </Text>

                                    {/* Changed value */}
                                    <Text
                                      fw={500}
                                      style={{
                                        fontSize: FONT_SIZES.small,
                                        color: colorConfig.icon,
                                        textAlign: 'right',
                                        alignSelf: 'center',
                                      }}
                                    >
                                      {changedValue}
                                    </Text>
                                  </Box>
                                );
                              })
                            ) : (
                              <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                                No parameter details available
                              </Text>
                            )}
                            {paramEntries.length > 15 && (
                              <Text c="dimmed" style={{ fontSize: FONT_SIZES.tiny, textAlign: 'center', paddingTop: spacing.xs }}>
                                +{paramEntries.length - 15} more parameter{paramEntries.length - 15 !== 1 ? 's' : ''}
                              </Text>
                            )}
                          </Stack>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
                {(!policies || policies.length === 0) && <Text c="dimmed" ta="center" py="lg">No saved policies</Text>}
              </Stack>
            </ScrollArea>
            <Divider />
            <Button variant="light" color="teal" leftSection={<IconPlus size={16} />} onClick={() => { onCreateNew(); onClose(); }}>Create new policy</Button>
          </>
        )}

        {type === 'population' && (
          <>
            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => handleSelectGeography(countryConfig.nationwideId, countryConfig.nationwideLabel, 'national')}>
              <Group gap={spacing.md}>
                <Box style={{ width: 36, height: 36, borderRadius: spacing.radius.md, background: colorConfig.bg, border: `1px solid ${colorConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CountryMapIcon countryId={countryId} size={18} color={colorConfig.icon} />
                </Box>
                <Stack gap={2}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>{countryConfig.nationwideTitle}</Text>
                  <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>{countryConfig.nationwideSubtitle}</Text>
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
                  <Paper key={h.household?.id} p="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => handleSelectHousehold(h.household?.id || '', h.association?.label || 'Unnamed')}>
                    <Group justify="space-between">
                      <Text fw={500} style={{ fontSize: FONT_SIZES.normal }}>{h.association?.label || 'Unnamed'}</Text>
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
// POLICY BROWSE MODAL - Augmented policy selection experience
// ============================================================================

// Local storage key for recent policies
const RECENT_POLICIES_KEY = 'policyengine_recent_policies';
const MAX_RECENT_POLICIES = 5;

interface RecentPolicy {
  id: string;
  label: string;
  paramCount: number;
  timestamp: number;
}

// Helper to get recent policies from localStorage
function getRecentPolicies(): RecentPolicy[] {
  try {
    const stored = localStorage.getItem(RECENT_POLICIES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load recent policies from localStorage');
  }
  return [];
}

// Helper to save a policy to recent
function saveToRecentPolicies(policy: RecentPolicy) {
  try {
    const recent = getRecentPolicies();
    // Remove if already exists
    const filtered = recent.filter(p => p.id !== policy.id);
    // Add to front
    filtered.unshift({ ...policy, timestamp: Date.now() });
    // Keep only max items
    const trimmed = filtered.slice(0, MAX_RECENT_POLICIES);
    localStorage.setItem(RECENT_POLICIES_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save recent policy to localStorage');
  }
}

interface PolicyBrowseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (policy: PolicyStateProps) => void;
  onCreateNew: () => void;
}

function PolicyBrowseModal({
  isOpen,
  onClose,
  onSelect,
  onCreateNew,
}: PolicyBrowseModalProps) {
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const userId = MOCK_USER_ID.toString();
  const { data: policies, isLoading } = useUserPolicies(userId);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const reportDate = getParamDefinitionDate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'my-policies' | 'recent' | 'public'>('my-policies');
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const [recentPolicies, setRecentPolicies] = useState<RecentPolicy[]>([]);

  // Load recent policies on mount
  useEffect(() => {
    if (isOpen) {
      setRecentPolicies(getRecentPolicies());
      setSearchQuery('');
      setExpandedPolicyId(null);
    }
  }, [isOpen]);

  // Transform policies data
  const userPolicies = useMemo(() => {
    return (policies || []).map((p) => ({
      id: p.policy?.id || '',
      label: p.association?.label || 'Unnamed policy',
      paramCount: Object.keys(p.policy?.policy_json || {}).length,
      policyJson: p.policy?.policy_json || {},
      createdAt: p.association?.created_at,
    }));
  }, [policies]);

  // Filter policies based on search
  const filteredPolicies = useMemo(() => {
    let result = userPolicies;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => {
        // Search in policy label
        if (p.label.toLowerCase().includes(query)) return true;
        // Search in parameter display names (hierarchical labels)
        const paramDisplayNames = Object.keys(p.policyJson).map(paramName => {
          const hierarchicalLabels = getHierarchicalLabels(paramName, parameters);
          return hierarchicalLabels.length > 0
            ? formatLabelParts(hierarchicalLabels)
            : paramName.split('.').pop() || paramName;
        }).join(' ').toLowerCase();
        if (paramDisplayNames.includes(query)) return true;
        return false;
      });
    }

    return result;
  }, [userPolicies, searchQuery, parameters]);

  // Get policies for current section
  const displayedPolicies = useMemo(() => {
    if (activeSection === 'recent') {
      return recentPolicies.map(rp => {
        const fullPolicy = userPolicies.find(p => p.id === rp.id);
        return fullPolicy || { id: rp.id, label: rp.label, paramCount: rp.paramCount, policyJson: {}, createdAt: undefined };
      });
    }
    if (activeSection === 'public') {
      // TODO: Fetch public policies from API when available
      return [];
    }
    return filteredPolicies;
  }, [activeSection, recentPolicies, filteredPolicies, userPolicies]);

  // Get section title for display
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'my-policies': return 'My policies';
      case 'recent': return 'Recently used';
      case 'public': return 'User-created policies';
      default: return 'Policies';
    }
  };

  // Handle policy selection
  const handleSelectPolicy = (policyId: string, label: string, paramCount: number) => {
    // Save to recent
    saveToRecentPolicies({ id: policyId, label, paramCount, timestamp: Date.now() });
    // Call onSelect with policy state
    onSelect({ id: policyId, label, parameters: Array(paramCount).fill({}) });
    onClose();
  };

  // Handle current law selection
  const handleSelectCurrentLaw = () => {
    onSelect({ id: 'current-law', label: 'Current law', parameters: [] });
    onClose();
  };

  const colorConfig = INGREDIENT_COLORS.policy;

  // Styles for the modal
  const modalStyles = {
    sidebar: {
      width: 220,
      borderRight: `1px solid ${colors.border.light}`,
      paddingRight: spacing.lg,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: spacing.lg,
    },
    sidebarSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: spacing.xs,
    },
    sidebarLabel: {
      fontSize: FONT_SIZES.small,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray[500],
      padding: `0 ${spacing.sm}`,
      marginBottom: spacing.xs,
    },
    sidebarItem: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: spacing.radius.md,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      fontSize: FONT_SIZES.small,
      fontWeight: typography.fontWeight.medium,
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: spacing.lg,
      minWidth: 0,
    },
    searchBar: {
      position: 'relative' as const,
    },
    policyGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: spacing.md,
    },
    policyCard: {
      background: colors.white,
      border: `1px solid ${colors.border.light}`,
      borderRadius: spacing.radius.lg,
      padding: spacing.lg,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    policyCardHovered: {
      borderColor: colorConfig.border,
      boxShadow: `0 4px 12px ${colors.shadow.light}`,
      transform: 'translateY(-2px)',
    },
    policyCardSelected: {
      borderColor: colorConfig.accent,
      background: colorConfig.bg,
    },
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap={spacing.sm}>
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: spacing.radius.md,
              background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colors.white} 100%)`,
              border: `1px solid ${colorConfig.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconScale size={20} color={colorConfig.icon} />
          </Box>
          <Stack gap={0}>
            <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}>
              Select policy
            </Text>
            <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
              Choose an existing policy or create a new one
            </Text>
          </Stack>
        </Group>
      }
      size="90vw"
      radius="lg"
      styles={{
        content: {
          maxWidth: '1200px',
          height: '80vh',
          maxHeight: '700px',
        },
        header: {
          borderBottom: `1px solid ${colors.border.light}`,
          paddingBottom: spacing.md,
          paddingLeft: spacing.xl,
          paddingRight: spacing.xl,
        },
        body: {
          padding: spacing.xl,
          height: 'calc(100% - 80px)',
          display: 'flex',
        },
      }}
    >
      <Group align="stretch" gap={spacing.xl} style={{ height: '100%', width: '100%' }} wrap="nowrap">
        {/* Left Sidebar */}
        <Box style={modalStyles.sidebar}>
          {/* Quick Actions */}
          <Box style={modalStyles.sidebarSection}>
            <Text style={modalStyles.sidebarLabel}>Quick select</Text>
            <UnstyledButton
              style={{
                ...modalStyles.sidebarItem,
                background: colors.gray[50],
                border: `1px solid ${colors.border.light}`,
              }}
              onClick={handleSelectCurrentLaw}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colorConfig.bg;
                e.currentTarget.style.borderColor = colorConfig.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.gray[50];
                e.currentTarget.style.borderColor = colors.border.light;
              }}
            >
              <IconScale size={16} color={colorConfig.icon} />
              <Text style={{ fontSize: FONT_SIZES.small, fontWeight: typography.fontWeight.medium }}>
                Current law
              </Text>
            </UnstyledButton>
          </Box>

          <Divider />

          {/* Navigation Sections */}
          <Box style={modalStyles.sidebarSection}>
            <Text style={modalStyles.sidebarLabel}>Library</Text>

            {/* My Policies */}
            <UnstyledButton
              style={{
                ...modalStyles.sidebarItem,
                background: activeSection === 'my-policies' ? colorConfig.bg : 'transparent',
                color: activeSection === 'my-policies' ? colorConfig.icon : colors.gray[700],
              }}
              onClick={() => setActiveSection('my-policies')}
            >
              <IconFolder size={16} />
              <Text style={{ fontSize: FONT_SIZES.small, flex: 1 }}>My policies</Text>
              <Text fw={700} style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
                {userPolicies.length}
              </Text>
            </UnstyledButton>

            {/* Recent */}
            <UnstyledButton
              style={{
                ...modalStyles.sidebarItem,
                background: activeSection === 'recent' ? colorConfig.bg : 'transparent',
                color: activeSection === 'recent' ? colorConfig.icon : colors.gray[700],
              }}
              onClick={() => setActiveSection('recent')}
            >
              <IconClock size={16} />
              <Text style={{ fontSize: FONT_SIZES.small, flex: 1 }}>Recent</Text>
              {recentPolicies.length > 0 && (
                <Text fw={700} style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
                  {recentPolicies.length}
                </Text>
              )}
            </UnstyledButton>

            {/* User-created policies */}
            <UnstyledButton
              style={{
                ...modalStyles.sidebarItem,
                background: activeSection === 'public' ? colorConfig.bg : 'transparent',
                color: activeSection === 'public' ? colorConfig.icon : colors.gray[700],
              }}
              onClick={() => setActiveSection('public')}
            >
              <IconUsers size={16} />
              <Text style={{ fontSize: FONT_SIZES.small, flex: 1 }}>User-created policies</Text>
            </UnstyledButton>
          </Box>

          {/* Spacer */}
          <Box style={{ flex: 1 }} />

          {/* Create New Button */}
          <Button
            variant="light"
            color="teal"
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              onCreateNew();
              onClose();
            }}
            fullWidth
            style={{ marginTop: 'auto' }}
          >
            Create new policy
          </Button>
        </Box>

        {/* Main Content Area */}
        <Box style={modalStyles.mainContent}>
          {/* Search Bar */}
          <Box style={modalStyles.searchBar}>
            <TextInput
              placeholder="Search policies by name or parameter..."
              leftSection={<IconSearch size={16} color={colors.gray[400]} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
              styles={{
                input: {
                  borderRadius: spacing.radius.md,
                  border: `1px solid ${colors.border.light}`,
                  fontSize: FONT_SIZES.small,
                  '&:focus': {
                    borderColor: colorConfig.accent,
                  },
                },
              }}
            />
          </Box>

          {/* Section Header */}
          <Group justify="space-between" align="center">
            <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
              {getSectionTitle()}
            </Text>
            <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
              {displayedPolicies.length} {displayedPolicies.length === 1 ? 'policy' : 'policies'}
            </Text>
          </Group>

          {/* Policy Grid */}
          <ScrollArea style={{ flex: 1 }} offsetScrollbars>
            {isLoading ? (
              <Stack gap={spacing.md}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={100} radius="md" />
                ))}
              </Stack>
            ) : displayedPolicies.length === 0 ? (
              <Box
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: spacing['4xl'],
                  gap: spacing.md,
                }}
              >
                <Box
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: colors.gray[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconFolder size={28} color={colors.gray[400]} />
                </Box>
                <Text fw={500} c={colors.gray[600]}>
                  {searchQuery ? 'No policies match your search' : 'No policies yet'}
                </Text>
                <Text c="dimmed" ta="center" maw={300} style={{ fontSize: FONT_SIZES.small }}>
                  {searchQuery
                    ? 'Try adjusting your search terms or browse all policies'
                    : 'Create your first policy to get started'
                  }
                </Text>
                {!searchQuery && (
                  <Button
                    variant="light"
                    color="teal"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                      onCreateNew();
                      onClose();
                    }}
                    mt={spacing.sm}
                  >
                    Create policy
                  </Button>
                )}
              </Box>
            ) : (
              <Box style={modalStyles.policyGrid}>
                {displayedPolicies.map((policy) => {
                  const isExpanded = expandedPolicyId === policy.id;

                  return (
                    <Paper
                      key={policy.id}
                      style={{
                        ...modalStyles.policyCard,
                        background: colors.white,
                        ...(isExpanded ? {
                          borderColor: colorConfig.border,
                          gridColumn: 'span 2',
                        } : {}),
                      }}
                      onClick={() => !isExpanded && handleSelectPolicy(policy.id, policy.label, policy.paramCount)}
                    >
                      {/* Policy accent bar */}
                      <Box
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          background: isExpanded
                            ? `linear-gradient(90deg, ${colorConfig.accent}, ${colorConfig.icon})`
                            : colors.gray[200],
                          transition: 'all 0.2s ease',
                        }}
                      />

                      <Stack gap={spacing.md}>
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              fw={600}
                              style={{
                                fontSize: FONT_SIZES.normal,
                                color: colors.gray[900],
                                overflow: isExpanded ? 'visible' : 'hidden',
                                textOverflow: isExpanded ? 'clip' : 'ellipsis',
                                whiteSpace: isExpanded ? 'normal' : 'nowrap',
                              }}
                            >
                              {policy.label}
                            </Text>
                            <Text
                              c="dimmed"
                              style={{ fontSize: FONT_SIZES.small }}
                            >
                              {policy.paramCount} param{policy.paramCount !== 1 ? 's' : ''} changed
                            </Text>
                          </Stack>

                          {/* Info button */}
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPolicyId(isExpanded ? null : policy.id);
                            }}
                            style={{ flexShrink: 0 }}
                          >
                            {isExpanded ? <IconX size={18} /> : <IconInfoCircle size={18} />}
                          </ActionIcon>
                        </Group>

                        {/* Expanded parameter details - shown inline when info button clicked */}
                        {isExpanded && policy.policyJson && (
                          <Box
                            style={{
                              marginTop: spacing.sm,
                              padding: spacing.md,
                              background: colors.gray[50],
                              borderRadius: spacing.radius.md,
                            }}
                          >
                            {/* Table header */}
                            <Box
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 100px 100px',
                                gap: spacing.sm,
                                paddingBottom: spacing.sm,
                                borderBottom: `1px solid ${colors.gray[200]}`,
                                marginBottom: spacing.sm,
                              }}
                            >
                              <Text fw={600} style={{ fontSize: FONT_SIZES.small, color: colors.gray[600] }}>Parameter</Text>
                              <Text fw={600} style={{ fontSize: FONT_SIZES.small, color: colors.gray[600], textAlign: 'right' }}>Current</Text>
                              <Text fw={600} style={{ fontSize: FONT_SIZES.small, color: colors.gray[600], textAlign: 'right' }}>New</Text>
                            </Box>

                            <Stack gap={0}>
                              {Object.entries(policy.policyJson).slice(0, 10).map(([paramName, paramValues]) => {
                                const hierarchicalLabels = getHierarchicalLabels(paramName, parameters);
                                const displayLabel = hierarchicalLabels.length > 0
                                  ? formatLabelParts(hierarchicalLabels)
                                  : paramName.split('.').pop() || paramName;

                                const currentLawValue = getCurrentLawParameterValue(paramName, parameters, reportDate);
                                const valueEntries = Object.entries(paramValues as Record<string, unknown>);
                                const rawValue = valueEntries.length > 0 ? valueEntries[0][1] : undefined;
                                const metadata = parameters[paramName];
                                const changedValue = rawValue !== undefined
                                  ? formatParameterValue(rawValue, metadata?.unit)
                                  : '—';

                                return (
                                  <Box
                                    key={paramName}
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: '1fr 100px 100px',
                                      gap: spacing.sm,
                                      padding: `${spacing.sm} 0`,
                                      borderBottom: `1px solid ${colors.gray[100]}`,
                                    }}
                                  >
                                    <Tooltip label={paramName} multiline w={300} withArrow>
                                      <Text
                                        style={{
                                          fontSize: FONT_SIZES.small,
                                          color: colors.gray[700],
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {displayLabel}
                                      </Text>
                                    </Tooltip>
                                    <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[500], textAlign: 'right' }}>
                                      {currentLawValue}
                                    </Text>
                                    <Text fw={500} style={{ fontSize: FONT_SIZES.small, color: colorConfig.icon, textAlign: 'right' }}>
                                      {changedValue}
                                    </Text>
                                  </Box>
                                );
                              })}
                            </Stack>

                            {Object.keys(policy.policyJson).length > 10 && (
                              <Text c="dimmed" ta="center" style={{ fontSize: FONT_SIZES.small, paddingTop: spacing.sm }}>
                                +{Object.keys(policy.policyJson).length - 10} more parameters
                              </Text>
                            )}

                            {/* Select button */}
                            <Button
                              color="teal"
                              fullWidth
                              mt={spacing.md}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPolicy(policy.id, policy.label, policy.paramCount);
                              }}
                              rightSection={<IconChevronRight size={16} />}
                            >
                              Select this policy
                            </Button>
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </ScrollArea>
        </Box>

      </Group>
    </Modal>
  );
}

// ============================================================================
// SIMULATION CANVAS
// ============================================================================

// State for the policy browse modal
interface PolicyBrowseState {
  isOpen: boolean;
  simulationIndex: number;
}

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
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const countryConfig = COUNTRY_CONFIG[countryId] || COUNTRY_CONFIG.us;
  const userId = MOCK_USER_ID.toString();
  const { data: policies } = useUserPolicies(userId);
  const isNationwideSelected = reportState.simulations[0]?.population?.geography?.id === countryConfig.nationwideId;

  // State for the augmented policy browse modal
  const [policyBrowseState, setPolicyBrowseState] = useState<PolicyBrowseState>({
    isOpen: false,
    simulationIndex: 0,
  });

  // Transform policies data into SavedPolicy format
  const savedPolicies: SavedPolicy[] = (policies || []).map((p) => ({
    id: p.policy?.id || '',
    label: p.association?.label || 'Unnamed policy',
    paramCount: Object.keys(p.policy?.policy_json || {}).length,
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
      // Open the augmented policy browse modal
      setPolicyBrowseState({
        isOpen: true,
        simulationIndex,
      });
    },
    []
  );

  // Handle policy selection from the browse modal
  const handlePolicySelectFromBrowse = useCallback(
    (policy: PolicyStateProps) => {
      const { simulationIndex } = policyBrowseState;
      setReportState((prev) => ({
        ...prev,
        simulations: prev.simulations.map((sim, i) =>
          i === simulationIndex ? { ...sim, policy } : sim
        ),
      }));
    },
    [policyBrowseState, setReportState]
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
      const samplePopulations = getSamplePopulations(countryId);
      const populationState = populationType === 'household' ? samplePopulations.household : samplePopulations.nationwide;
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
    [countryId, setReportState]
  );

  const handleDeselectPolicy = useCallback(
    (simulationIndex: number) => {
      setReportState((prev) => ({
        ...prev,
        simulations: prev.simulations.map((sim, i) =>
          i === simulationIndex
            ? { ...sim, policy: initializePolicyState() }
            : sim
        ),
      }));
    },
    [setReportState]
  );

  const handleDeselectPopulation = useCallback(
    (simulationIndex: number) => {
      setReportState((prev) => {
        let newSimulations = prev.simulations.map((sim, i) =>
          i === simulationIndex
            ? { ...sim, population: initializePopulationState() }
            : sim
        );

        // If deselecting baseline population, also clear reform's inherited population
        if (simulationIndex === 0 && newSimulations.length > 1) {
          newSimulations[1] = {
            ...newSimulations[1],
            population: initializePopulationState(),
          };
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
            countryId={countryId}
            onLabelChange={(label) => handleSimulationLabelChange(0, label)}
            onQuickSelectPolicy={() => handleQuickSelectPolicy(0)}
            onSelectSavedPolicy={(id, label, paramCount) => handleSelectSavedPolicy(0, id, label, paramCount)}
            onQuickSelectPopulation={(type) => handleQuickSelectPopulation(0, type)}
            onDeselectPolicy={() => handleDeselectPolicy(0)}
            onDeselectPopulation={() => handleDeselectPopulation(0)}
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
              countryId={countryId}
              onLabelChange={(label) => handleSimulationLabelChange(1, label)}
              onQuickSelectPolicy={() => handleQuickSelectPolicy(1)}
              onSelectSavedPolicy={(id, label, paramCount) => handleSelectSavedPolicy(1, id, label, paramCount)}
              onQuickSelectPopulation={(type) => handleQuickSelectPopulation(1, type)}
              onDeselectPolicy={() => handleDeselectPolicy(1)}
              onDeselectPopulation={() => handleDeselectPopulation(1)}
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

      {/* Augmented Policy Browse Modal */}
      <PolicyBrowseModal
        isOpen={policyBrowseState.isOpen}
        onClose={() => setPolicyBrowseState((prev) => ({ ...prev, isOpen: false }))}
        onSelect={handlePolicySelectFromBrowse}
        onCreateNew={() => handleCreateCustom(policyBrowseState.simulationIndex, 'policy')}
      />
    </>
  );
}

// ============================================================================
// REPORT META PANEL - Floating Toolbar / Dock Design
// ============================================================================

interface ReportMetaPanelProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  isReportConfigured: boolean;
}

// Progress dot component
function ProgressDot({ filled, pulsing }: { filled: boolean; pulsing?: boolean }) {
  return (
    <Box
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: filled ? colors.primary[500] : colors.gray[300],
        transition: 'all 0.3s ease',
        animation: pulsing ? 'pulse 2s ease-in-out infinite' : 'none',
      }}
    />
  );
}

function ReportMetaPanel({ reportState, setReportState, isReportConfigured }: ReportMetaPanelProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState('');

  const handleLabelSubmit = () => {
    setReportState((prev) => ({ ...prev, label: labelInput || 'Untitled report' }));
    setIsEditingLabel(false);
  };

  // Calculate configuration progress
  const simulations = reportState.simulations;
  const baselinePolicyConfigured = !!simulations[0]?.policy?.id;
  const baselinePopulationConfigured = !!(simulations[0]?.population?.household?.id || simulations[0]?.population?.geography?.id);
  const hasReform = simulations.length > 1;
  const reformPolicyConfigured = hasReform && !!simulations[1]?.policy?.id;

  // Get labels for display
  const baselinePolicyLabel = simulations[0]?.policy?.label || null;
  const baselinePopulationLabel = simulations[0]?.population?.label ||
    (simulations[0]?.population?.household?.id ? 'Household' :
     simulations[0]?.population?.geography?.id ? 'Nationwide' : null);
  const reformPolicyLabel = hasReform ? (simulations[1]?.policy?.label || null) : null;

  // Progress steps
  const steps = [
    baselinePolicyConfigured,
    baselinePopulationConfigured,
    ...(hasReform ? [reformPolicyConfigured] : []),
  ];
  const completedSteps = steps.filter(Boolean).length;

  // Floating dock styles - matches canvas container styling
  const dockStyles = {
    container: {
      marginBottom: spacing.xl,
    },
    dock: {
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: spacing.radius.xl, // Match canvasContainer
      border: `1px solid ${isReportConfigured ? colors.primary[200] : colors.border.light}`,
      boxShadow: isReportConfigured
        ? `0 8px 32px rgba(44, 122, 123, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)`
        : `0 4px 24px ${colors.shadow.light}`, // Match canvasContainer shadow
      padding: `${spacing.md} ${spacing.xl}`,
      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      overflow: 'hidden',
    },
    compactRow: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      width: '100%',
    },
    expandedContent: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTop: `1px solid ${colors.gray[200]}`,
    },
    divider: {
      width: '1px',
      height: '24px',
      background: colors.gray[200],
      margin: `0 ${spacing.xs}`,
    },
    runButton: {
      background: isReportConfigured
        ? `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`
        : colors.gray[200],
      color: isReportConfigured ? 'white' : colors.gray[500],
      border: 'none',
      borderRadius: spacing.radius.lg, // Match other buttons
      padding: `${spacing.sm} ${spacing.lg}`,
      fontFamily: typography.fontFamily.primary,
      fontWeight: 600,
      fontSize: FONT_SIZES.normal,
      cursor: isReportConfigured ? 'pointer' : 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
      transition: 'all 0.3s ease',
      boxShadow: isReportConfigured
        ? `0 4px 12px rgba(44, 122, 123, 0.3)`
        : 'none',
    },
    configRow: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      padding: `${spacing.xs} 0`,
    },
    configChip: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
      padding: `${spacing.xs} ${spacing.sm}`,
      background: colors.gray[50],
      borderRadius: spacing.radius.md,
      fontFamily: typography.fontFamily.primary,
      fontSize: FONT_SIZES.small,
    },
  };

  return (
    <Box style={dockStyles.container}>
      <Box style={dockStyles.dock}>
        {/* Compact row - always visible */}
        <Box style={dockStyles.compactRow}>
          {/* Document icon */}
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: spacing.radius.md,
              background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconFileDescription size={18} color={colors.primary[600]} />
          </Box>

          {/* Title with pencil icon - flexible width */}
          <Box style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            {isEditingLabel ? (
              <TextInput
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onBlur={handleLabelSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleLabelSubmit()}
                placeholder="Report name..."
                size="xs"
                autoFocus
                style={{ flex: 1 }}
                styles={{
                  input: {
                    fontFamily: typography.fontFamily.primary,
                    fontWeight: 600,
                    fontSize: FONT_SIZES.normal,
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                  }
                }}
              />
            ) : (
              <>
                <Text
                  fw={600}
                  style={{
                    fontFamily: typography.fontFamily.primary,
                    fontSize: FONT_SIZES.normal,
                    color: colors.gray[800],
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {reportState.label || 'Untitled report'}
                </Text>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    setLabelInput(reportState.label || '');
                    setIsEditingLabel(true);
                  }}
                  aria-label="Edit report name"
                  style={{ flexShrink: 0 }}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </>
            )}
          </Box>

          {/* Divider */}
          <Box style={{ ...dockStyles.divider, flexShrink: 0 }} />

          {/* Year selector - fixed width, no checkmark */}
          <Select
            aria-label="Report year"
            value={reportState.year}
            onChange={(value) => setReportState((prev) => ({ ...prev, year: value || CURRENT_YEAR }))}
            data={['2023', '2024', '2025', '2026']}
            size="xs"
            w={60}
            variant="unstyled"
            rightSection={null}
            withCheckIcon={false}
            styles={{
              input: {
                fontFamily: typography.fontFamily.primary,
                fontSize: FONT_SIZES.normal,
                fontWeight: 500,
                color: colors.gray[600],
                cursor: 'pointer',
                padding: 0,
                minHeight: 'auto',
              }
            }}
          />

          {/* Divider */}
          <Box style={{ ...dockStyles.divider, flexShrink: 0 }} />

          {/* Progress dots - fixed width */}
          <Group gap={6} style={{ flexShrink: 0 }}>
            {steps.map((completed, i) => (
              <ProgressDot
                key={i}
                filled={completed}
                pulsing={!completed && i === completedSteps}
              />
            ))}
          </Group>

          {/* Divider */}
          <Box style={dockStyles.divider} />

          {/* Run button */}
          <Box
            component="button"
            style={dockStyles.runButton}
            onClick={() => isReportConfigured && console.log('Run report')}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (isReportConfigured) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 6px 16px rgba(44, 122, 123, 0.4)`;
              }
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = isReportConfigured
                ? `0 4px 12px rgba(44, 122, 123, 0.3)`
                : 'none';
            }}
          >
            <IconPlayerPlay size={16} />
            <span>Run</span>
          </Box>
        </Box>

        {/* Expanded content - visible on hover */}
        <Box style={dockStyles.expandedContent}>
          <Stack gap={spacing.sm}>
            {/* Baseline row */}
            <Box style={dockStyles.configRow}>
              <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small, width: 60 }}>Baseline</Text>
              <Box style={dockStyles.configChip}>
                {baselinePolicyConfigured ? (
                  <>
                    <IconScale size={12} color={colors.secondary[500]} />
                    <Text style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small, color: colors.secondary[600] }}>{baselinePolicyLabel}</Text>
                  </>
                ) : (
                  <>
                    <IconCircleDashed size={12} color={colors.gray[400]} />
                    <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small }}>Select policy</Text>
                  </>
                )}
              </Box>
              <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small }}>+</Text>
              <Box style={dockStyles.configChip}>
                {baselinePopulationConfigured ? (
                  <>
                    <IconUsers size={12} color={colors.primary[500]} />
                    <Text style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small, color: colors.primary[600] }}>{baselinePopulationLabel}</Text>
                  </>
                ) : (
                  <>
                    <IconCircleDashed size={12} color={colors.gray[400]} />
                    <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small }}>Select population</Text>
                  </>
                )}
              </Box>
            </Box>

            {/* Reform row (if applicable) */}
            {hasReform && (
              <Box style={dockStyles.configRow}>
                <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small, width: 60 }}>Reform</Text>
                <Box style={dockStyles.configChip}>
                  {reformPolicyConfigured ? (
                    <>
                      <IconScale size={12} color={colors.secondary[500]} />
                      <Text style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small, color: colors.secondary[600] }}>{reformPolicyLabel}</Text>
                    </>
                  ) : (
                    <>
                      <IconCircleDashed size={12} color={colors.gray[400]} />
                      <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small }}>Select policy</Text>
                    </>
                  )}
                </Box>
                <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.tiny }}>(inherits population)</Text>
              </Box>
            )}

            {/* Ready message */}
            {isReportConfigured && (
              <Group gap={spacing.xs} justify="center" mt={spacing.xs}>
                <IconCircleCheck size={14} color={colors.success} />
                <Text style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small, color: colors.success }}>
                  Ready to run your analysis
                </Text>
              </Group>
            )}
          </Stack>
        </Box>
      </Box>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </Box>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ReportBuilderPage() {
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const countryConfig = COUNTRY_CONFIG[countryId] || COUNTRY_CONFIG.us;
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

  const isNationwideSelected = reportState.simulations[0]?.population?.geography?.id === countryConfig.nationwideId;

  useEffect(() => {
    if (isNationwideSelected && reportState.simulations.length === 1) {
      const newSim = initializeSimulationState();
      newSim.label = 'Reform simulation';
      newSim.population = { ...reportState.simulations[0].population };
      setReportState((prev) => ({ ...prev, simulations: [...prev.simulations, newSim] }));
    }
  }, [isNationwideSelected, reportState.simulations]);

  const isReportConfigured = reportState.simulations.every(
    (sim) => !!sim.policy.id && !!(sim.population.household?.id || sim.population.geography?.id)
  );

  const viewMode = (activeTab || 'cards') as ViewMode;

  return (
    <Box style={styles.pageContainer}>
      <Box style={styles.headerSection}>
        <h1 style={styles.mainTitle}>Report builder</h1>
      </Box>

      <ReportMetaPanel
        reportState={reportState}
        setReportState={setReportState}
        isReportConfigured={isReportConfigured}
      />

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
