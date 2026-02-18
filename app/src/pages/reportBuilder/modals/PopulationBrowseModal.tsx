/**
 * PopulationBrowseModal - Geography and household selection modal
 *
 * Uses BrowseModalTemplate for visual layout and delegates to sub-components:
 * - Browse mode: PopulationBrowseContent for main content
 * - Creation mode: HouseholdCreationContent + PopulationStatusHeader
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconChevronRight, IconFolder, IconHome, IconPlus, IconStar, IconUsers } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Box, Group, Paper, Stack, Text } from '@mantine/core';
import { HouseholdAdapter } from '@/adapters/HouseholdAdapter';
import { geographyUsageStore, householdUsageStore } from '@/api/usageTracking';
import { UKOutlineIcon, USOutlineIcon } from '@/components/icons/CountryOutlineIcons';
import { CURRENT_YEAR, MOCK_USER_ID } from '@/constants';
import { useCreateHousehold } from '@/hooks/useCreateHousehold';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { getBasicInputFields } from '@/libs/metadataUtils';
import { householdAssociationKeys } from '@/libs/queryKeys';
import { RootState } from '@/store';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { PopulationStateProps } from '@/types/pathwayState';
import { generateGeographyLabel } from '@/utils/geographyUtils';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';
import {
  getUKConstituencies,
  getUKCountries,
  getUKLocalAuthorities,
  getUSCongressionalDistricts,
  getUSPlaces,
  getUSStates,
  RegionOption,
} from '@/utils/regionStrategies';
import { colors, spacing } from '@/designTokens';
import { COUNTRY_CONFIG, FONT_SIZES, INGREDIENT_COLORS } from '../constants';
import { PopulationCategory } from '../types';
import { BrowseModalTemplate, CreationModeFooter } from './BrowseModalTemplate';
import {
  HouseholdCreationContent,
  PopulationBrowseContent,
  PopulationStatusHeader,
} from './population';

interface PopulationBrowseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (population: PopulationStateProps) => void;
  onCreateNew: () => void;
}

export function PopulationBrowseModal({
  isOpen,
  onClose,
  onSelect,
  onCreateNew: _onCreateNew,
}: PopulationBrowseModalProps) {
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const userId = MOCK_USER_ID.toString();
  const queryClient = useQueryClient();
  const { data: households, isLoading: householdsLoading } = useUserHouseholds(userId);
  const regionOptions = useSelector((state: RootState) => state.metadata.economyOptions.region);
  const metadata = useSelector((state: RootState) => state.metadata);
  const basicInputFields = useSelector(getBasicInputFields);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<PopulationCategory>('frequently-selected');

  // Creation mode state
  const [isCreationMode, setIsCreationMode] = useState(false);
  const [householdLabel, setHouseholdLabel] = useState('');
  const [householdDraft, setHouseholdDraft] = useState<Household | null>(null);

  // Get report year (default to current year)
  const reportYear = CURRENT_YEAR.toString();

  // Create household hook
  const { createHousehold, isPending: isCreating } = useCreateHousehold(
    householdLabel || undefined
  );

  // Get all basic non-person fields dynamically
  const basicNonPersonFields = useMemo(() => {
    return Object.entries(basicInputFields)
      .filter(([key]) => key !== 'person')
      .flatMap(([, fields]) => fields);
  }, [basicInputFields]);

  // Derive marital status and number of children from household draft
  const householdPeople = useMemo(() => {
    if (!householdDraft) {return [];}
    return Object.keys(householdDraft.householdData.people || {});
  }, [householdDraft]);

  const maritalStatus = householdPeople.includes('your partner') ? 'married' : 'single';
  const numChildren = householdPeople.filter((p) => p.includes('dependent')).length;

  // Reset state on mount
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveCategory('frequently-selected');
      setIsCreationMode(false);
      setHouseholdLabel('');
      setHouseholdDraft(null);
    }
  }, [isOpen, countryId]);

  // Get geography categories based on country
  const geographyCategories = useMemo(() => {
    if (countryId === 'uk') {
      const ukCountries = getUKCountries(regionOptions);
      const ukConstituencies = getUKConstituencies(regionOptions);
      const ukLocalAuthorities = getUKLocalAuthorities(regionOptions);
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
    // US
    const usStates = getUSStates(regionOptions);
    const usDistricts = getUSCongressionalDistricts(regionOptions);
    const usPlaces = getUSPlaces();
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
  }, [countryId, regionOptions]);

  // Get regions for active category
  const activeRegions = useMemo(() => {
    const category = geographyCategories.find((c) => c.id === activeCategory);
    return category?.regions || [];
  }, [activeCategory, geographyCategories]);

  // Transform households with usage tracking sort
  const sortedHouseholds = useMemo(() => {
    if (!households) {return [];}

    return [...households]
      .map((h) => {
        const householdIdStr = String(h.association.householdId);
        const usageTimestamp = householdUsageStore.getLastUsed(householdIdStr);
        const sortTimestamp =
          usageTimestamp || h.association.updatedAt || h.association.createdAt || '';
        return {
          id: householdIdStr,
          label: h.association.label || `Household #${householdIdStr}`,
          memberCount: h.household?.household_json?.people
            ? Object.keys(h.household.household_json.people).length
            : 0,
          sortTimestamp,
          household: h.household,
        };
      })
      .sort((a, b) => b.sortTimestamp.localeCompare(a.sortTimestamp));
  }, [households]);

  // Filter regions/households based on search
  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) {return activeRegions;}
    const query = searchQuery.toLowerCase();
    return activeRegions.filter((r) => r.label.toLowerCase().includes(query));
  }, [activeRegions, searchQuery]);

  const filteredHouseholds = useMemo(() => {
    if (!searchQuery.trim()) {return sortedHouseholds;}
    const query = searchQuery.toLowerCase();
    return sortedHouseholds.filter((h) => h.label.toLowerCase().includes(query));
  }, [sortedHouseholds, searchQuery]);

  // Handle geography selection
  const handleSelectGeography = (region: RegionOption | null) => {
    const countryConfig = COUNTRY_CONFIG[countryId];
    const geography: Geography = region
      ? {
          id: `${countryId}-${region.value}`,
          countryId,
          scope: 'subnational',
          geographyId: region.value,
        }
      : {
          id: countryConfig.nationwideId,
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

  // Handle household selection
  const handleSelectHousehold = (householdData: (typeof sortedHouseholds)[0]) => {
    const householdIdStr = String(householdData.id);
    householdUsageStore.recordUsage(householdIdStr);

    let household: Household | null = null;
    if (householdData.household) {
      household = HouseholdAdapter.fromMetadata(householdData.household);
    } else {
      household = {
        id: householdIdStr,
        countryId,
        householdData: { people: {} },
      };
    }

    const populationState: PopulationStateProps = {
      geography: null,
      household,
      label: householdData.label,
      type: 'household',
    };

    onSelect(populationState);
    onClose();
  };

  // Enter creation mode
  const handleEnterCreationMode = useCallback(() => {
    const builder = new HouseholdBuilder(countryId as 'us' | 'uk', reportYear);
    builder.addAdult('you', 30, { employment_income: 0 });
    setHouseholdDraft(builder.build());
    setHouseholdLabel('');
    setIsCreationMode(true);
  }, [countryId, reportYear]);

  // Exit creation mode (back to browse)
  const handleExitCreationMode = useCallback(() => {
    setIsCreationMode(false);
    setHouseholdDraft(null);
    setHouseholdLabel('');
  }, []);

  // Handle marital status change
  const handleMaritalStatusChange = useCallback(
    (newStatus: 'single' | 'married') => {
      if (!householdDraft) {return;}

      const builder = new HouseholdBuilder(countryId as 'us' | 'uk', reportYear);
      builder.loadHousehold(householdDraft);

      const hasPartner = householdPeople.includes('your partner');

      if (newStatus === 'married' && !hasPartner) {
        builder.addAdult('your partner', 30, { employment_income: 0 });
        builder.setMaritalStatus('you', 'your partner');
      } else if (newStatus === 'single' && hasPartner) {
        builder.removePerson('your partner');
      }

      setHouseholdDraft(builder.build());
    },
    [householdDraft, householdPeople, countryId, reportYear]
  );

  // Handle number of children change
  const handleNumChildrenChange = useCallback(
    (newCount: number) => {
      if (!householdDraft) {return;}

      const builder = new HouseholdBuilder(countryId as 'us' | 'uk', reportYear);
      builder.loadHousehold(householdDraft);

      const currentChildren = householdPeople.filter((p) => p.includes('dependent'));
      const currentChildCount = currentChildren.length;

      if (newCount !== currentChildCount) {
        currentChildren.forEach((child) => builder.removePerson(child));

        if (newCount > 0) {
          const hasPartner = householdPeople.includes('your partner');
          const parentIds = hasPartner ? ['you', 'your partner'] : ['you'];
          const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];

          for (let i = 0; i < newCount; i++) {
            const childName = `your ${ordinals[i] || `${i + 1}th`} dependent`;
            builder.addChild(childName, 10, parentIds, { employment_income: 0 });
          }
        }
      }

      setHouseholdDraft(builder.build());
    },
    [householdDraft, householdPeople, countryId, reportYear]
  );

  // Handle household creation submission
  const handleCreateHousehold = useCallback(async () => {
    if (!householdDraft || !householdLabel.trim()) {
      return;
    }

    const payload = HouseholdAdapter.toCreationPayload(householdDraft.householdData, countryId);

    try {
      const result = await createHousehold(payload);
      const householdId = result.result.household_id.toString();

      householdUsageStore.recordUsage(householdId);

      const createdHousehold: Household = {
        ...householdDraft,
        id: householdId,
      };

      const populationState = {
        geography: null,
        household: createdHousehold,
        label: householdLabel,
        type: 'household' as const,
      };

      await queryClient.refetchQueries({
        queryKey: householdAssociationKeys.byUser(userId, countryId),
      });

      onSelect(populationState);
      onClose();
    } catch (err) {
      console.error('Failed to create household:', err);
    }
  }, [
    householdDraft,
    householdLabel,
    countryId,
    createHousehold,
    onSelect,
    onClose,
    queryClient,
    userId,
  ]);

  const colorConfig = INGREDIENT_COLORS.population;

  // Get section title
  const getSectionTitle = () => {
    if (activeCategory === 'my-households') {return 'My households';}
    const category = geographyCategories.find((c) => c.id === activeCategory);
    return category?.label || 'Regions';
  };

  // Get item count for display
  const getItemCount = () => {
    if (activeCategory === 'my-households') {return filteredHouseholds.length;}
    return filteredRegions.length;
  };

  // ========== Sidebar Sections ==========

  const countryConfig = COUNTRY_CONFIG[countryId];

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
            isActive: activeCategory === 'frequently-selected' && !isCreationMode,
            onClick: () => {
              setActiveCategory('frequently-selected');
              setIsCreationMode(false);
            },
          },
          ...geographyCategories.map((category) => ({
            id: category.id,
            label: category.label,
            icon: <IconFolder size={16} />,
            badge: category.count,
            isActive: activeCategory === category.id && !isCreationMode,
            onClick: () => {
              setActiveCategory(category.id);
              setIsCreationMode(false);
            },
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
            isActive: activeCategory === 'my-households' && !isCreationMode,
            onClick: () => {
              setActiveCategory('my-households');
              setIsCreationMode(false);
            },
          },
          {
            id: 'create-new',
            label: 'Create new household',
            icon: <IconPlus size={16} />,
            isActive: isCreationMode,
            onClick: handleEnterCreationMode,
          },
        ],
      },
    ],
    [activeCategory, isCreationMode, geographyCategories, sortedHouseholds.length, handleEnterCreationMode]
  );

  // ========== Main Content Rendering ==========

  const renderMainContent = () => {
    if (isCreationMode) {
      return (
        <HouseholdCreationContent
          householdDraft={householdDraft}
          metadata={metadata}
          reportYear={reportYear}
          maritalStatus={maritalStatus}
          numChildren={numChildren}
          basicPersonFields={basicInputFields.person || []}
          basicNonPersonFields={basicNonPersonFields}
          isCreating={isCreating}
          onChange={setHouseholdDraft}
          onMaritalStatusChange={handleMaritalStatusChange}
          onNumChildrenChange={handleNumChildrenChange}
        />
      );
    }

    if (activeCategory === 'frequently-selected') {
      return (
        <Stack gap={spacing.lg} style={{ height: '100%' }}>
          <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
            Frequently selected
          </Text>
          <Paper
            style={{
              background: colors.white,
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.lg,
              padding: spacing.lg,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              maxWidth: 340,
            }}
            onClick={() => handleSelectGeography(null)}
          >
            <Group justify="space-between" align="center" wrap="nowrap">
              <Group gap={spacing.md} wrap="nowrap">
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
                  {countryId === 'uk' ? <UKOutlineIcon size={20} /> : <USOutlineIcon size={20} />}
                </Box>
                <Stack gap={2}>
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
          </Paper>
        </Stack>
      );
    }

    // Get all congressional districts for StateDistrictSelector (US only)
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
  };

  return (
    <BrowseModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      headerIcon={<IconUsers size={20} color={colorConfig.icon} />}
      headerTitle={isCreationMode ? 'Create household' : 'Household(s)'}
      headerSubtitle={
        isCreationMode
          ? 'Configure your household composition and details'
          : 'Choose a geographic region or create a household'
      }
      colorConfig={colorConfig}
      sidebarSections={browseSidebarSections}
      renderMainContent={renderMainContent}
      statusHeader={
        isCreationMode ? (
          <PopulationStatusHeader
            householdLabel={householdLabel}
            setHouseholdLabel={setHouseholdLabel}
            memberCount={householdPeople.length}
          />
        ) : undefined
      }
      footer={
        isCreationMode ? (
          <CreationModeFooter
            onBack={handleExitCreationMode}
            onSubmit={handleCreateHousehold}
            isLoading={isCreating}
            submitDisabled={!householdLabel.trim() || !householdDraft}
            submitLabel="Create household"
          />
        ) : undefined
      }
    />
  );
}
