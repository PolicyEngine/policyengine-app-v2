import { Box, Radio, Select, Stack } from '@mantine/core';
import { filterUSStates } from '@/utils/regionFilters';

interface RegionOption {
  name: string;
  label: string;
}

interface USGeographicScopeFormProps {
  scope: 'national' | 'state' | 'household';
  selectedState: string;
  regionOptions: RegionOption[];
  onScopeChange: (scope: 'national' | 'state' | 'household') => void;
  onStateChange: (state: string) => void;
}

export default function USGeographicScopeForm({
  scope,
  selectedState,
  regionOptions,
  onScopeChange,
  onStateChange,
}: USGeographicScopeFormProps) {
  const usStates = filterUSStates(regionOptions);

  return (
    <Stack>
      <Radio
        value="national"
        label="National"
        checked={scope === 'national'}
        onChange={() => onScopeChange('national')}
      />

      <Box>
        <Radio
          value="state"
          label="State"
          checked={scope === 'state'}
          onChange={() => onScopeChange('state')}
        />

        {scope === 'state' && (
          <Box ml={24} mt="xs">
            <Select
              label="Select State"
              placeholder="Pick a state"
              data={usStates}
              value={selectedState}
              onChange={(val) => onStateChange(val || '')}
              searchable
            />
          </Box>
        )}
      </Box>

      <Radio
        value="household"
        label="Household"
        checked={scope === 'household'}
        onChange={() => onScopeChange('household')}
      />
    </Stack>
  );
}
