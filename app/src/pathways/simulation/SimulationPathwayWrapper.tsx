/**
 * SimulationPathwayWrapper - Pathway orchestrator for simulation creation
 *
 * TODO: Complete implementation - currently placeholder
 * Will manage all state for simulation, policy, and population using local state.
 * Will reuse all shared views and utilities from the report pathway.
 */

import { Stack, Title, Text, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import StandardLayout from '@/components/StandardLayout';

interface SimulationPathwayWrapperProps {
  onComplete?: () => void;
}

export default function SimulationPathwayWrapper({ onComplete }: SimulationPathwayWrapperProps) {
  const countryId = useCurrentCountry();
  const navigate = useNavigate();

  return (
    <StandardLayout>
      <Stack gap="xl" p="xl" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Title order={1}>🚧 New Simulation Pathway (V2)</Title>

        <Text size="lg">
          This is a placeholder for the new simulation pathway that will reuse all the shared
          components and utilities from the report pathway.
        </Text>

        <Stack gap="md">
          <Title order={2}>Architecture Overview:</Title>
          <Text>✅ Validation utilities created (isHouseholdAssociationReady, etc.)</Text>
          <Text>✅ SimulationViewMode enum exists</Text>
          <Text>✅ All shared views are available</Text>
          <Text>✅ Callback factories ready to use</Text>
          <Text>✅ State initialization utilities ready</Text>
          <Text>🚧 View props need to be made truly optional for standalone use</Text>
          <Text>🚧 Wire up all the views in the switch statement</Text>
        </Stack>

        <Button onClick={() => navigate(`/${countryId}/simulations`)}>
          Back to Simulations
        </Button>
      </Stack>
    </StandardLayout>
  );
}
