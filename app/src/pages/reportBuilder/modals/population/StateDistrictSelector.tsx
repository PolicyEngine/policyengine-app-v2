/**
 * StateDistrictSelector - Congressional district selector grouped by state
 *
 * Displays states as headers with their congressional districts underneath.
 * Districts are shown as ordinal numbers (1st, 2nd, etc.) or "At-large" for
 * single-district states.
 */
import { useMemo } from 'react';
import { Box, Text, Stack, UnstyledButton, Group, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { colors, spacing } from '@/designTokens';
import { RegionOption } from '@/utils/regionStrategies';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';

// ============================================================================
// Types
// ============================================================================

interface StateDistrictSelectorProps {
  districts: RegionOption[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectDistrict: (district: RegionOption) => void;
}

interface StateGroup {
  stateName: string;
  stateAbbreviation: string;
  districts: RegionOption[];
}

// ============================================================================
// Pure utility functions
// ============================================================================

function formatOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function extractDistrictNumber(label: string): number | null {
  const match = label.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function sortDistrictsNumerically(districts: RegionOption[]): RegionOption[] {
  return [...districts].sort((a, b) => {
    const numA = extractDistrictNumber(a.label) || 0;
    const numB = extractDistrictNumber(b.label) || 0;
    return numA - numB;
  });
}

function sortGroupsAlphabetically(groups: StateGroup[]): StateGroup[] {
  return [...groups].sort((a, b) => a.stateName.localeCompare(b.stateName));
}

function groupDistrictsByState(districts: RegionOption[]): StateGroup[] {
  const groups: Map<string, StateGroup> = new Map();

  for (const district of districts) {
    const stateName = district.stateName || 'Unknown';
    const stateAbbr = district.stateAbbreviation || '';

    if (!groups.has(stateName)) {
      groups.set(stateName, {
        stateName,
        stateAbbreviation: stateAbbr,
        districts: [],
      });
    }
    groups.get(stateName)!.districts.push(district);
  }

  const sortedGroups = sortGroupsAlphabetically(Array.from(groups.values()));

  return sortedGroups.map((group) => ({
    ...group,
    districts: sortDistrictsNumerically(group.districts),
  }));
}

function buildDistrictCountLookup(groups: StateGroup[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const group of groups) {
    counts.set(group.stateName, group.districts.length);
  }
  return counts;
}

function filterGroupsByQuery(groups: StateGroup[], query: string): StateGroup[] {
  if (!query.trim()) return groups;

  const normalizedQuery = query.toLowerCase();

  return groups
    .map((group) => {
      const stateMatches = group.stateName.toLowerCase().includes(normalizedQuery);
      if (stateMatches) return group;

      const matchingDistricts = group.districts.filter((d) =>
        d.label.toLowerCase().includes(normalizedQuery)
      );

      if (matchingDistricts.length > 0) {
        return { ...group, districts: matchingDistricts };
      }

      return null;
    })
    .filter((group): group is StateGroup => group !== null);
}

function getDistrictDisplayLabel(
  district: RegionOption,
  stateName: string,
  originalCounts: Map<string, number>
): string {
  const originalCount = originalCounts.get(stateName) || 0;
  if (originalCount === 1) return 'At-large';

  const num = extractDistrictNumber(district.label);
  return num ? formatOrdinal(num) : district.label;
}

function countTotalDistricts(groups: StateGroup[]): number {
  return groups.reduce((sum, group) => sum + group.districts.length, 0);
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
  districtGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  districtChip: {
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: spacing.radius.md,
    border: `1px solid ${colors.border.light}`,
    background: colors.white,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontSize: FONT_SIZES.small,
    minWidth: 60,
    textAlign: 'center' as const,
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

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextInput
      placeholder="Search states or districts..."
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
        Congressional districts
      </Text>
      <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
        {count} {count === 1 ? 'district' : 'districts'}
      </Text>
    </Group>
  );
}

function EmptyState() {
  return (
    <Box style={styles.emptyState}>
      <Text fw={500} c={colors.gray[600]}>
        No districts match your search
      </Text>
    </Box>
  );
}

function StateHeader({ stateName, stateAbbreviation }: { stateName: string; stateAbbreviation: string }) {
  return (
    <Box style={styles.stateHeader}>
      <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[700] }}>
        {stateName}
        {stateAbbreviation && (
          <Text component="span" c="dimmed" style={{ fontSize: FONT_SIZES.small, marginLeft: spacing.xs }}>
            ({stateAbbreviation})
          </Text>
        )}
      </Text>
    </Box>
  );
}

function DistrictChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      style={styles.districtChip}
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
  originalCounts,
  onSelectDistrict,
}: {
  group: StateGroup;
  originalCounts: Map<string, number>;
  onSelectDistrict: (district: RegionOption) => void;
}) {
  return (
    <Box>
      <StateHeader stateName={group.stateName} stateAbbreviation={group.stateAbbreviation} />
      <Box style={styles.districtGrid}>
        {group.districts.map((district) => (
          <DistrictChip
            key={district.value}
            label={getDistrictDisplayLabel(district, group.stateName, originalCounts)}
            onClick={() => onSelectDistrict(district)}
          />
        ))}
      </Box>
    </Box>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function StateDistrictSelector({
  districts,
  searchQuery,
  setSearchQuery,
  onSelectDistrict,
}: StateDistrictSelectorProps) {
  const stateGroups = useMemo(() => groupDistrictsByState(districts), [districts]);

  const originalDistrictCounts = useMemo(
    () => buildDistrictCountLookup(stateGroups),
    [stateGroups]
  );

  const filteredGroups = useMemo(
    () => filterGroupsByQuery(stateGroups, searchQuery),
    [stateGroups, searchQuery]
  );

  const totalDistrictCount = countTotalDistricts(filteredGroups);

  return (
    <Stack gap={spacing.lg} style={{ height: '100%' }}>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <SectionHeader count={totalDistrictCount} />
      <Box style={{ flex: 1, overflow: 'auto' }}>
        {filteredGroups.length === 0 ? (
          <EmptyState />
        ) : (
          filteredGroups.map((group) => (
            <StateGroupSection
              key={group.stateName}
              group={group}
              originalCounts={originalDistrictCounts}
              onSelectDistrict={onSelectDistrict}
            />
          ))
        )}
      </Box>
    </Stack>
  );
}
