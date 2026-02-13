/**
 * PopulationBrowseContent - Browse mode content for population modal
 *
 * Handles:
 * - National selection
 * - Region grids (states, districts, etc.)
 * - Household list
 */
import { IconChevronRight, IconHome, IconSearch } from '@tabler/icons-react';
import {
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { UKOutlineIcon, USOutlineIcon } from '@/components/icons/CountryOutlineIcons';
import { colors, spacing } from '@/designTokens';
import { RegionOption } from '@/utils/regionStrategies';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';
import { PopulationCategory } from '../../types';
import { StateDistrictSelector } from './StateDistrictSelector';
import { StatePlaceSelector } from './StatePlaceSelector';

interface HouseholdItem {
  id: string;
  label: string;
  memberCount: number;
}

interface PopulationBrowseContentProps {
  countryId: 'us' | 'uk';
  activeCategory: PopulationCategory;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredRegions: RegionOption[];
  allDistricts?: RegionOption[]; // Full list of congressional districts for StateDistrictSelector
  filteredHouseholds: HouseholdItem[];
  householdsLoading: boolean;
  getSectionTitle: () => string;
  getItemCount: () => number;
  onSelectGeography: (region: RegionOption | null) => void;
  onSelectHousehold: (household: HouseholdItem) => void;
}

export function PopulationBrowseContent({
  countryId,
  activeCategory,
  searchQuery,
  setSearchQuery,
  filteredRegions,
  allDistricts,
  filteredHouseholds,
  householdsLoading,
  getSectionTitle,
  getItemCount,
  onSelectGeography,
  onSelectHousehold,
}: PopulationBrowseContentProps) {
  const colorConfig = INGREDIENT_COLORS.population;

  const styles = {
    regionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: spacing.sm,
    },
    regionChip: {
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: spacing.radius.md,
      border: `1px solid ${colors.border.light}`,
      background: colors.white,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      fontSize: FONT_SIZES.small,
      textAlign: 'center' as const,
    },
    householdCard: {
      padding: spacing.md,
      borderRadius: spacing.radius.md,
      border: `1px solid ${colors.border.light}`,
      background: colors.white,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
  };

  // StateDistrictSelector and PlaceSelector handle their own search and header
  const showExternalSearchAndHeader =
    activeCategory !== 'national' && activeCategory !== 'districts' && activeCategory !== 'places';

  return (
    <Stack gap={spacing.lg} style={{ height: '100%' }}>
      {/* Search Bar - hidden for national and districts (StateDistrictSelector has its own) */}
      {showExternalSearchAndHeader && (
        <TextInput
          placeholder={
            activeCategory === 'my-households'
              ? 'Search households...'
              : `Search ${getSectionTitle().toLowerCase()}...`
          }
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
      )}

      {/* Section Header - hidden for national and districts */}
      {showExternalSearchAndHeader && (
        <Group justify="space-between" align="center">
          <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
            {getSectionTitle()}
          </Text>
          <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
            {getItemCount()} {getItemCount() === 1 ? 'option' : 'options'}
          </Text>
        </Group>
      )}

      {/* Content */}
      <ScrollArea style={{ flex: 1 }} offsetScrollbars>
        {activeCategory === 'national' ? (
          // National selection - single prominent option
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing['2xl'],
              gap: spacing.lg,
            }}
          >
            <Paper
              style={{
                ...styles.householdCard,
                width: '100%',
                maxWidth: 400,
                textAlign: 'center',
                padding: spacing.xl,
              }}
              onClick={() => onSelectGeography(null)}
            >
              <Stack align="center" gap={spacing.md}>
                {countryId === 'uk' ? <UKOutlineIcon size={48} /> : <USOutlineIcon size={48} />}
                <Stack gap={spacing.xs}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>
                    {countryId === 'uk' ? 'Households UK-wide' : 'Households nationwide'}
                  </Text>
                  <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                    Simulate policy effects across the entire{' '}
                    {countryId === 'uk' ? 'United Kingdom' : 'United States'}
                  </Text>
                </Stack>
                <Button color="teal" rightSection={<IconChevronRight size={16} />}>
                  Select
                </Button>
              </Stack>
            </Paper>
          </Box>
        ) : activeCategory === 'my-households' ? (
          // Households list
          householdsLoading ? (
            <Stack gap={spacing.md}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={60} radius="md" />
              ))}
            </Stack>
          ) : filteredHouseholds.length === 0 ? (
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
                <IconHome size={28} color={colors.gray[400]} />
              </Box>
              <Text fw={500} c={colors.gray[600]}>
                {searchQuery ? 'No households match your search' : 'No households yet'}
              </Text>
              <Text c="dimmed" ta="center" maw={300} style={{ fontSize: FONT_SIZES.small }}>
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Create a custom household using the button in the sidebar'}
              </Text>
            </Box>
          ) : (
            <Stack gap={spacing.sm}>
              {filteredHouseholds.map((household) => (
                <Paper
                  key={household.id}
                  style={styles.householdCard}
                  onClick={() => onSelectHousehold(household)}
                >
                  <Group justify="space-between" align="center">
                    <Group gap={spacing.md}>
                      <Box
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: spacing.radius.md,
                          background: colorConfig.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconHome size={20} color={colorConfig.icon} />
                      </Box>
                      <Stack gap={2}>
                        <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>
                          {household.label}
                        </Text>
                        <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                          {household.memberCount}{' '}
                          {household.memberCount === 1 ? 'member' : 'members'}
                        </Text>
                      </Stack>
                    </Group>
                    <IconChevronRight size={16} color={colors.gray[400]} />
                  </Group>
                </Paper>
              ))}
            </Stack>
          )
        ) : activeCategory === 'districts' && allDistricts ? (
          // Congressional districts - use StateDistrictSelector
          <StateDistrictSelector
            districts={allDistricts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectDistrict={onSelectGeography}
          />
        ) : activeCategory === 'places' ? (
          // US Cities - use StatePlaceSelector grouped by state
          <StatePlaceSelector
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectPlace={onSelectGeography}
          />
        ) : // Standard geography grid (states, countries, constituencies, local authorities)
        filteredRegions.length === 0 ? (
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
            <Text fw={500} c={colors.gray[600]}>
              No regions match your search
            </Text>
          </Box>
        ) : (
          <Box style={styles.regionGrid}>
            {filteredRegions.map((region) => (
              <UnstyledButton
                key={region.value}
                style={styles.regionChip}
                onClick={() => onSelectGeography(region)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colorConfig.border;
                  e.currentTarget.style.background = colorConfig.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border.light;
                  e.currentTarget.style.background = colors.white;
                }}
              >
                {region.label}
              </UnstyledButton>
            ))}
          </Box>
        )}
      </ScrollArea>
    </Stack>
  );
}
