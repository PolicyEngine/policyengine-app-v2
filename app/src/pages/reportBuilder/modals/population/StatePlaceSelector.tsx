/**
 * StatePlaceSelector - City selector grouped by state
 *
 * Displays states as headers with their cities underneath.
 * Cities are sorted alphabetically within each state.
 * Mirrors the StateDistrictSelector pattern for consistency.
 */
import { useMemo } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { Box, Group, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { getPlaceDisplayName, getUSPlaces, RegionOption } from '@/utils/regionStrategies';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';

// ============================================================================
// Types
// ============================================================================

interface StatePlaceSelectorProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectPlace: (place: RegionOption) => void;
}

interface StateGroup {
  stateName: string;
  stateAbbreviation: string;
  places: RegionOption[];
}

// ============================================================================
// Pure utility functions
// ============================================================================

function sortPlacesAlphabetically(places: RegionOption[]): RegionOption[] {
  return [...places].sort((a, b) => a.label.localeCompare(b.label));
}

function sortGroupsAlphabetically(groups: StateGroup[]): StateGroup[] {
  return [...groups].sort((a, b) => a.stateName.localeCompare(b.stateName));
}

function groupPlacesByState(places: RegionOption[]): StateGroup[] {
  const groups = new Map<string, StateGroup>();

  for (const place of places) {
    const stateName = place.stateName || 'Unknown';
    const stateAbbr = place.stateAbbreviation || '';

    if (!groups.has(stateName)) {
      groups.set(stateName, {
        stateName,
        stateAbbreviation: stateAbbr,
        places: [],
      });
    }
    groups.get(stateName)!.places.push(place);
  }

  const sortedGroups = sortGroupsAlphabetically(Array.from(groups.values()));

  return sortedGroups.map((group) => ({
    ...group,
    places: sortPlacesAlphabetically(group.places),
  }));
}

function filterGroupsByQuery(groups: StateGroup[], query: string): StateGroup[] {
  if (!query.trim()) {
    return groups;
  }

  const normalizedQuery = query.toLowerCase();

  return groups
    .map((group) => {
      const stateMatches = group.stateName.toLowerCase().includes(normalizedQuery);
      if (stateMatches) {
        return group;
      }

      const matchingPlaces = group.places.filter((p) =>
        p.label.toLowerCase().includes(normalizedQuery)
      );

      if (matchingPlaces.length > 0) {
        return { ...group, places: matchingPlaces };
      }

      return null;
    })
    .filter((group): group is StateGroup => group !== null);
}

function countTotalPlaces(groups: StateGroup[]): number {
  return groups.reduce((sum, group) => sum + group.places.length, 0);
}

// ============================================================================
// Styles
// ============================================================================

const colorConfig = INGREDIENT_COLORS.population;

const styles = {
  stateHeader: {
    padding: `${spacing.sm} 0`,
    borderBottom: `1px solid ${colors.border.light}`,
    marginBottom: spacing.sm,
  },
  placeGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  placeChip: {
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: spacing.radius.md,
    border: `1px solid ${colors.border.light}`,
    background: colors.white,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontSize: FONT_SIZES.small,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
    gap: spacing.md,
  },
};

// ============================================================================
// Sub-components
// ============================================================================

function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TextInput
      placeholder="Search states or cities..."
      leftSection={<IconSearch size={16} color={colors.gray[400]} />}
      value={value}
      onChange={(e) => onChange(e.target.value)}
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
  );
}

function SectionHeader({ count }: { count: number }) {
  return (
    <Group justify="space-between" align="center">
      <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
        Cities
      </Text>
      <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
        {count} {count === 1 ? 'city' : 'cities'}
      </Text>
    </Group>
  );
}

function EmptyState() {
  return (
    <Box style={styles.emptyState}>
      <Text fw={500} c={colors.gray[600]}>
        No cities match your search
      </Text>
    </Box>
  );
}

function StateHeader({
  stateName,
  stateAbbreviation,
}: {
  stateName: string;
  stateAbbreviation: string;
}) {
  return (
    <Box style={styles.stateHeader}>
      <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[700] }}>
        {stateName}
        {stateAbbreviation && (
          <Text
            component="span"
            c="dimmed"
            style={{ fontSize: FONT_SIZES.small, marginLeft: spacing.xs }}
          >
            ({stateAbbreviation})
          </Text>
        )}
      </Text>
    </Box>
  );
}

function PlaceChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <UnstyledButton
      style={styles.placeChip}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colorConfig.border;
        e.currentTarget.style.background = colorConfig.bg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border.light;
        e.currentTarget.style.background = colors.white;
      }}
    >
      {label}
    </UnstyledButton>
  );
}

function StateGroupSection({
  group,
  onSelectPlace,
}: {
  group: StateGroup;
  onSelectPlace: (place: RegionOption) => void;
}) {
  return (
    <Box>
      <StateHeader stateName={group.stateName} stateAbbreviation={group.stateAbbreviation} />
      <Box style={styles.placeGrid}>
        {group.places.map((place) => (
          <PlaceChip
            key={place.value}
            label={getPlaceDisplayName(place.label)}
            onClick={() => onSelectPlace(place)}
          />
        ))}
      </Box>
    </Box>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function StatePlaceSelector({
  searchQuery,
  setSearchQuery,
  onSelectPlace,
}: StatePlaceSelectorProps) {
  // Get all US places as RegionOption array
  const allPlaces = useMemo(() => getUSPlaces(), []);

  const stateGroups = useMemo(() => groupPlacesByState(allPlaces), [allPlaces]);

  const filteredGroups = useMemo(
    () => filterGroupsByQuery(stateGroups, searchQuery),
    [stateGroups, searchQuery]
  );

  const totalPlaceCount = countTotalPlaces(filteredGroups);

  return (
    <Stack gap={spacing.lg} style={{ height: '100%' }}>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <SectionHeader count={totalPlaceCount} />
      <Box style={{ flex: 1, overflow: 'auto' }}>
        {filteredGroups.length === 0 ? (
          <EmptyState />
        ) : (
          filteredGroups.map((group) => (
            <StateGroupSection key={group.stateName} group={group} onSelectPlace={onSelectPlace} />
          ))
        )}
      </Box>
    </Stack>
  );
}
