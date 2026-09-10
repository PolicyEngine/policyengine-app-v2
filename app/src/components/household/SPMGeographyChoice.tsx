import { useId } from 'react';
import { Input, Label, Stack, Text } from '@/components/ui';
import type { Household } from '@/models/Household';
import { getModelMetadataError, type SPMModelMetadata } from '@/utils/spmSelection';

interface Props {
  household: Household;
  year: string;
  metadata?: SPMModelMetadata;
  onChange: (household: Household) => void;
  disabled?: boolean;
  isReadOnly?: boolean;
}

export default function SPMGeographyChoice({
  household,
  year,
  metadata,
  onChange,
  disabled,
  isReadOnly,
}: Props) {
  const id = useId();
  const metadataError = getModelMetadataError(household.countryId, metadata);
  if (metadataError) {
    return (
      <Text size="sm" role="status">
        {metadataError}
      </Text>
    );
  }
  if (household.countryId !== 'us' || (!metadata?.spm?.available && !household.spm)) {
    return null;
  }

  const selection = household.spm;
  const unavailable = metadata?.spm?.available !== true;
  return (
    <Stack gap="sm">
      <Label htmlFor={id}>Supplemental Poverty Measure geography</Label>
      <Text size="sm" c="dimmed">
        Choose national poverty thresholds or local thresholds for your county. A state alone does
        not identify a local SPM area. This choice affects poverty measures and related benefit
        calculations.
      </Text>
      <select
        id={id}
        className="tw:w-full tw:rounded-md tw:border tw:border-input tw:bg-background tw:p-sm"
        value={selection?.geography_kind ?? ''}
        disabled={disabled || isReadOnly || unavailable}
        onChange={(event) => {
          const kind = event.target.value;
          if (kind === 'national' || kind === 'county') {
            const { geography_id: _area, ...settings } = selection ?? {};
            onChange(household.withSPM({ ...settings, geography_kind: kind }));
          }
        }}
      >
        <option value="" disabled>
          Choose SPM geography
        </option>
        <option value="national">National thresholds</option>
        <option value="county">Local thresholds by county</option>
        {selection?.geography_kind === 'metro' && (
          <option value="metro">SPM area: {selection.geography_id}</option>
        )}
      </select>
      {unavailable && (
        <Text size="sm" role="alert">
          These SPM settings require a certified model release.
        </Text>
      )}
      {selection?.geography_kind === 'county' &&
        household.getGroups('households').map((group) => {
          const county = household.getGroupVariableAtYear(
            'households',
            group.key,
            'county_fips',
            year
          );
          const countyId = `${id}-${group.key}`;
          return (
            <Stack key={group.key} gap="xs">
              <Label htmlFor={countyId}>County FIPS code ({group.key})</Label>
              <Input
                id={countyId}
                value={county === undefined || county === null ? '' : String(county)}
                inputMode="numeric"
                maxLength={5}
                placeholder="Five digits, including leading zeros"
                disabled={disabled || isReadOnly || unavailable}
                onChange={(event) =>
                  onChange(
                    household.setGroupVariableAtYear(
                      'households',
                      group.key,
                      'county_fips',
                      year,
                      event.target.value
                    )
                  )
                }
              />
            </Stack>
          );
        })}
    </Stack>
  );
}
