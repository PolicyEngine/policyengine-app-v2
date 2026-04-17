/**
 * PopulationBrowseModal - Geography and household selection modal
 *
 * Browse-only counterpart to HouseholdCreationModal.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconChevronRight,
  IconFolder,
  IconHome,
  IconPlus,
  IconStar,
  IconUsers,
} from '@tabler/icons-react';
import { geographyUsageStore, householdUsageStore } from '@/api/usageTracking';
import { UKOutlineIcon, USOutlineIcon } from '@/components/icons/CountryOutlineIcons';
import { Group } from '@/components/ui/Group';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { MOCK_USER_ID } from '@/constants';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRegions } from '@/hooks/useRegions';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { Geography } from '@/types/ingredients/Geography';
import { PopulationStateProps } from '@/types/pathwayState';
import { generateGeographyLabel } from '@/utils/geographyUtils';
import {
  getUKConstituencies,
  getUKCountries,
  getUKLocalAuthorities,
  getUSCongressionalDistricts,
  getUSPlaces,
  getUSStates,
  RegionOption,
} from '@/utils/regionStrategies';
import { COUNTRY_CONFIG, FONT_SIZES, INGREDIENT_COLORS } from '../constants';
import { PopulationCategory } from '../types';
import { BrowseModalTemplate } from './BrowseModalTemplate';
import { PopulationBrowseContent } from './population';

interface PopulationBrowseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (population: PopulationStateProps) => void;
  reportYear: string;
  onCreateNew: () => void;
}

export function PopulationBrowseModal({
  isOpen,
  onClose,
  onSelect,
  reportYear: _reportYear,
  onCreateNew,
}: PopulationBrowseModalProps) {
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const userId = MOCK_USER_ID.toString();
  const { data: households, isLoading: householdsLoading } = useUserHouseholds(userId);
  const { data: regions = [] } = useRegions(countryId);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<PopulationCategory>('frequently-selected');

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveCategory('frequently-selected');
    }
  }, [isOpen, countryId]);

  const geographyCategories = useMemo(() => {
    if (countryId === 'uk') {
      const ukCountries = getUKCountries(regions);
      const ukConstituencies = getUKConstituencies(regions);
      const ukLocalAuthorities = getUKLocalAuthorities(regions);
      return [
        {
          id: 'countries' as const,
          label: 'Countries',
          count: ukCountries.length,
          regions: ukCountries,
        },
        {
          id: 'constituencies' as const,
          label: 'Constituencies',
          count: ukConstituencies.length,
          regions: ukConstituencies,
        },
        {
          id: 'local-authorities' as const,
          label: 'Local authorities',
          count: ukLocalAuthorities.length,
          regions: ukLocalAuthorities,
        },
      ];
    }
    const usStates = getUSStates(regions);
    const usDistricts = getUSCongressionalDistricts(regions);
    const usPlaces = getUSPlaces(regions);
    return [
      {
        id: 'states' as const,
        label: 'States and territories',
        count: usStates.length,
        regions: usStates,
      },
      {
        id: 'districts' as const,
        label: 'Congressional districts',
        count: usDistricts.length,
        regions: usDistricts,
      },
      {
        id: 'places' as const,
        label: 'Cities',
        count: usPlaces.length,
        regions: usPlaces,
      },
    ];
  }, [countryId, regions]);

  const activeRegions = useMemo(() => {
    const category = geographyCategories.find((c) => c.id === activeCategory);
    return category?.regions || [];
  }, [activeCategory, geographyCategories]);

  const sortedHouseholds = useMemo(() => {
    if (!households) {
      return [];
    }

    return [...households]
      .map((h) => {
        const householdIdStr = String(h.association.householdId);
        const usageTimestamp = householdUsageStore.getLastUsed(householdIdStr);
        const sortTimestamp =
          usageTimestamp || h.association.updatedAt || h.association.createdAt || '';
        const isSelectable = Boolean(h.household);
        return {
          id: householdIdStr,
          label: h.association.label || `Household #${householdIdStr}`,
          memberCount: h.household?.personCount ?? 0,
          sortTimestamp,
          household: h.household,
          isSelectable,
          statusMessage: isSelectable
            ? undefined
            : h.error
              ? 'Failed to load'
              : h.isLoading
                ? 'Loading...'
                : 'Failed to load',
        };
      })
      .sort((a, b) => b.sortTimestamp.localeCompare(a.sortTimestamp));
  }, [households]);

  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) {
      return activeRegions;
    }
    const query = searchQuery.toLowerCase();
    return activeRegions.filter((r) => r.label.toLowerCase().includes(query));
  }, [activeRegions, searchQuery]);

  const filteredHouseholds = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedHouseholds;
    }
    const query = searchQuery.toLowerCase();
    return sortedHouseholds.filter((h) => h.label.toLowerCase().includes(query));
  }, [sortedHouseholds, searchQuery]);

  const handleSelectGeography = (region: RegionOption | null) => {
    const countryConfig = COUNTRY_CONFIG[countryId];
    const geography: Geography = region
      ? {
          id: `${countryId}-${region.value}`,
          countryId,
          scope: 'subnational',
          geographyId: region.value,
          name: region.label,
        }
      : {
          id: countryConfig.geographyId,
          countryId,
          scope: 'national',
          geographyId: countryConfig.geographyId,
        };

    geographyUsageStore.recordUsage(geography.geographyId);

    const label = generateGeographyLabel(geography);
    onSelect({
      geography,
      household: null,
      label,
      type: 'geography',
    });
    onClose();
  };

  const handleSelectHousehold = (householdData: (typeof sortedHouseholds)[0]) => {
    if (!householdData.household) {
      return;
    }

    const householdIdStr = String(householdData.id);
    householdUsageStore.recordUsage(householdIdStr);

    const household = householdData.household.toAppInput();

    onSelect({
      geography: null,
      household,
      label: householdData.label,
      type: 'household',
    });
    onClose();
  };

  const getSectionTitle = () => {
    if (activeCategory === 'my-households') {
      return 'My households';
    }
    const category = geographyCategories.find((c) => c.id === activeCategory);
    return category?.label || 'Regions';
  };

  const getItemCount = () => {
    if (activeCategory === 'my-households') {
      return filteredHouseholds.length;
    }
    return filteredRegions.length;
  };

  const countryConfig = COUNTRY_CONFIG[countryId];
  const colorConfig = INGREDIENT_COLORS.population;

  const browseSidebarSections = useMemo(
    () => [
      {
        id: 'geographies',
        label: 'Geographies',
        items: [
          {
            id: 'frequently-selected',
            label: 'Frequently selected',
            icon: <IconStar size={16} />,
            isActive: activeCategory === 'frequently-selected',
            onClick: () => setActiveCategory('frequently-selected'),
          },
          ...geographyCategories.map((category) => ({
            id: category.id,
            label: category.label,
            icon: <IconFolder size={16} />,
            badge: category.count,
            isActive: activeCategory === category.id,
            onClick: () => setActiveCategory(category.id),
          })),
        ],
      },
      {
        id: 'households',
        label: 'Households',
        items: [
          {
            id: 'my-households',
            label: 'My households',
            icon: <IconHome size={16} />,
            badge: sortedHouseholds.length,
            isActive: activeCategory === 'my-households',
            onClick: () => setActiveCategory('my-households'),
          },
          {
            id: 'create-new',
            label: 'Create new household',
            icon: <IconPlus size={16} />,
            onClick: () => {
              onClose();
              onCreateNew();
            },
          },
        ],
      },
    ],
    [activeCategory, geographyCategories, onClose, onCreateNew, sortedHouseholds.length]
  );

  const renderMainContent = useCallback(() => {
    if (activeCategory === 'frequently-selected') {
      return (
        <Stack gap="lg" style={{ height: '100%' }}>
          <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
            Frequently selected
          </Text>
          <div
            role="button"
            tabIndex={0}
            style={{
              background: colors.white,
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.feature,
              padding: spacing.lg,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              maxWidth: 340,
            }}
            onClick={() => handleSelectGeography(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectGeography(null);
              }
            }}
          >
            <Group justify="space-between" align="center" wrap="nowrap">
              <Group gap="md" wrap="nowrap">
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
                  {countryId === 'uk' ? <UKOutlineIcon size={20} /> : <USOutlineIcon size={20} />}
                </div>
                <Stack style={{ gap: 2 }}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}>
                    {countryConfig.nationwideTitle}
                  </Text>
                  <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                    {countryConfig.nationwideSubtitle}
                  </Text>
                </Stack>
              </Group>
              <IconChevronRight size={16} color={colors.gray[400]} />
            </Group>
          </div>
        </Stack>
      );
    }

    const allDistricts =
      countryId === 'us'
        ? geographyCategories.find((c) => c.id === 'districts')?.regions
        : undefined;

    return (
      <PopulationBrowseContent
        countryId={countryId}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredRegions={filteredRegions}
        allDistricts={allDistricts}
        filteredHouseholds={filteredHouseholds.map((h) => ({
          id: h.id,
          label: h.label,
          memberCount: h.memberCount,
          disabled: !h.isSelectable,
          statusMessage: h.statusMessage,
        }))}
        householdsLoading={householdsLoading}
        getSectionTitle={getSectionTitle}
        getItemCount={getItemCount}
        onSelectGeography={handleSelectGeography}
        onSelectHousehold={(household) => {
          const fullHousehold = sortedHouseholds.find((h) => h.id === household.id);
          if (fullHousehold) {
            handleSelectHousehold(fullHousehold);
          }
        }}
      />
    );
  }, [
    activeCategory,
    colorConfig.bg,
    countryConfig.nationwideSubtitle,
    countryConfig.nationwideTitle,
    countryId,
    filteredHouseholds,
    filteredRegions,
    geographyCategories,
    householdsLoading,
    searchQuery,
    sortedHouseholds,
  ]);

  return (
    <BrowseModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      headerIcon={<IconUsers size={20} color={colorConfig.icon} />}
      headerTitle="Household(s)"
      headerSubtitle="Choose a geographic region or create a household"
      colorConfig={colorConfig}
      sidebarSections={browseSidebarSections}
      renderMainContent={renderMainContent}
    />
  );
}
