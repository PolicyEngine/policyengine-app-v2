/**
 * PopulationBrowseContent - Browse mode content for population modal
 *
 * Handles:
 * - National selection
 * - Region grids (states, districts, etc.)
 * - Household list
 */
import { IconChevronRight, IconHome, IconSearch } from '@tabler/icons-react';
import { Group } from '@/components/ui/Group';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
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
  disabled?: boolean;
  statusMessage?: string;
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
  countryId: _countryId,
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
      borderRadius: spacing.radius.container,
      border: `1px solid ${colors.border.light}`,
      background: colors.white,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      fontSize: FONT_SIZES.small,
      textAlign: 'center' as const,
    },
    householdCard: {
      padding: spacing.md,
      borderRadius: spacing.radius.container,
      border: `1px solid ${colors.border.light}`,
      background: colors.white,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
  };

  // StateDistrictSelector and PlaceSelector handle their own search and header
  const showExternalSearchAndHeader = activeCategory !== 'districts' && activeCategory !== 'places';

  return (
    <Stack gap="lg" style={{ height: '100%' }}>
      {/* Search Bar - hidden for national and districts (StateDistrictSelector has its own) */}
      {showExternalSearchAndHeader && (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <IconSearch size={16} color={colors.gray[400]} />
          </div>
          <Input
            placeholder={
              activeCategory === 'my-households'
                ? 'Search households...'
                : `Search ${getSectionTitle().toLowerCase()}...`
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              borderRadius: spacing.radius.container,
              border: `1px solid ${colors.border.light}`,
              fontSize: FONT_SIZES.small,
              paddingLeft: 34,
            }}
          />
        </div>
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
      <ScrollArea style={{ flex: 1 }}>
        {activeCategory === 'my-households' ? (
          // Households list
          householdsLoading ? (
            <Stack gap="md">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="tw:h-[60px] tw:rounded-md" />
              ))}
            </Stack>
          ) : filteredHouseholds.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing['4xl'],
                gap: spacing.md,
              }}
            >
              <div
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
              </div>
              <Text fw={500} c={colors.gray[600]}>
                {searchQuery ? 'No households match your search' : 'No households yet'}
              </Text>
              <Text
                c="dimmed"
                style={{ textAlign: 'center', maxWidth: 300, fontSize: FONT_SIZES.small }}
              >
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Create a custom household using the button in the sidebar'}
              </Text>
            </div>
          ) : (
            <Stack gap="sm">
              {filteredHouseholds.map((household) => (
                <div
                  key={household.id}
                  style={{
                    ...styles.householdCard,
                    cursor: household.disabled ? 'not-allowed' : 'pointer',
                    opacity: household.disabled ? 0.6 : 1,
                  }}
                  role={household.disabled ? undefined : 'button'}
                  tabIndex={household.disabled ? -1 : 0}
                  aria-disabled={household.disabled || undefined}
                  onClick={() => {
                    if (!household.disabled) {
                      onSelectHousehold(household);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (!household.disabled && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSelectHousehold(household);
                    }
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Group gap="md">
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: spacing.radius.container,
                          background: colorConfig.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconHome size={20} color={colorConfig.icon} />
                      </div>
                      <Stack style={{ gap: 2 }}>
                        <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>
                          {household.label}
                        </Text>
                        {household.statusMessage ? (
                          <Text c={colors.error} style={{ fontSize: FONT_SIZES.small }}>
                            {household.statusMessage}
                          </Text>
                        ) : (
                          <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                            {household.memberCount}{' '}
                            {household.memberCount === 1 ? 'member' : 'members'}
                          </Text>
                        )}
                      </Stack>
                    </Group>
                    {!household.disabled && <IconChevronRight size={16} color={colors.gray[400]} />}
                  </Group>
                </div>
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
          <div
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
          </div>
        ) : (
          <div style={styles.regionGrid}>
            {filteredRegions.map((region) => (
              <button
                type="button"
                key={region.value}
                style={{ all: 'unset', ...styles.regionChip }}
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
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </Stack>
  );
}
