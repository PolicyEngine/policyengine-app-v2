/**
 * PopulationScopeView - View for selecting population geographic scope
 * Duplicated from SelectGeographicScopeFrame
 * Props-based instead of Redux-based
 *
 * NOTE: This is a simplified version for Phase 3. Full implementation with
 * all geographic options will be added in later phases.
 */

import { useState } from 'react';
import { Stack } from '@mantine/core';
import PathwayView from '@/components/common/PathwayView';
import { countryIds } from '@/libs/countries';
import { Geography } from '@/types/ingredients/Geography';
import {
  ScopeType,
  UK_REGION_TYPES,
  UKScopeType,
  US_REGION_TYPES,
  USScopeType,
} from '@/types/regionTypes';
import {
  createGeographyFromScope,
  getUKConstituencies,
  getUKCountries,
  getUKLocalAuthorities,
  getUSCongressionalDistricts,
  getUSStates,
} from '@/utils/regionStrategies';
import UKGeographicOptions from '../../components/geographicOptions/UKGeographicOptions';
import USGeographicOptions from '../../components/geographicOptions/USGeographicOptions';

interface PopulationScopeViewProps {
  countryId: (typeof countryIds)[number];
  regionData: any[];
  onScopeSelected: (
    geography: Geography | null,
    scopeType: ScopeType,
    regionLabel?: string
  ) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function PopulationScopeView({
  countryId,
  regionData,
  onScopeSelected,
  onBack,
  onCancel,
}: PopulationScopeViewProps) {
  const [scope, setScope] = useState<ScopeType>(US_REGION_TYPES.NATIONAL);
  const [selectedRegion, setSelectedRegion] = useState('');

  // Get region options based on country
  const usStates = countryId === 'us' ? getUSStates(regionData) : [];
  const usDistricts = countryId === 'us' ? getUSCongressionalDistricts(regionData) : [];
  const ukCountries = countryId === 'uk' ? getUKCountries(regionData) : [];
  const ukConstituencies = countryId === 'uk' ? getUKConstituencies(regionData) : [];
  const ukLocalAuthorities = countryId === 'uk' ? getUKLocalAuthorities(regionData) : [];

  const handleScopeChange = (value: ScopeType) => {
    setScope(value);
    setSelectedRegion(''); // Clear selection when scope changes
  };

  /**
   * Get the display label for the selected region
   */
  function getRegionLabel(): string {
    // National scope uses country name
    if (scope === US_REGION_TYPES.NATIONAL) {
      return countryId === 'us' ? 'US' : 'UK';
    }

    // For subnational scopes, find the region in the appropriate list
    if (!selectedRegion) {
      return '';
    }

    // Check all region option lists for the selected value
    const allOptions = [
      ...usStates,
      ...usDistricts,
      ...ukCountries,
      ...ukConstituencies,
      ...ukLocalAuthorities,
    ];
    const matchedRegion = allOptions.find((r) => r.value === selectedRegion);
    return matchedRegion?.label || '';
  }

  function submissionHandler() {
    // Validate that if a regional scope is selected, a region must be chosen
    const needsRegion = [
      US_REGION_TYPES.STATE,
      US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
      UK_REGION_TYPES.COUNTRY,
      UK_REGION_TYPES.CONSTITUENCY,
      UK_REGION_TYPES.LOCAL_AUTHORITY,
    ].includes(scope as any);
    if (needsRegion && !selectedRegion) {
      console.warn(`${scope} selected but no region chosen`);
      return;
    }

    // Create geography from scope selection
    const geography = createGeographyFromScope(scope, countryId, selectedRegion);

    // Get the region label for display
    const regionLabel = getRegionLabel();

    onScopeSelected(geography as Geography | null, scope, regionLabel);
  }

  const formInputs = (
    <Stack>
      {countryId === 'uk' ? (
        <UKGeographicOptions
          scope={scope as UKScopeType}
          selectedRegion={selectedRegion}
          countryOptions={ukCountries}
          constituencyOptions={ukConstituencies}
          localAuthorityOptions={ukLocalAuthorities}
          onScopeChange={(newScope) => handleScopeChange(newScope)}
          onRegionChange={setSelectedRegion}
        />
      ) : (
        <USGeographicOptions
          scope={scope as USScopeType}
          selectedRegion={selectedRegion}
          stateOptions={usStates}
          districtOptions={usDistricts}
          onScopeChange={(newScope) => handleScopeChange(newScope)}
          onRegionChange={setSelectedRegion}
        />
      )}
    </Stack>
  );

  const primaryAction = {
    label: 'Select scope',
    onClick: submissionHandler,
  };

  return (
    <PathwayView
      title="Select household scope"
      content={formInputs}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
    />
  );
}
