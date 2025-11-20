/**
 * DefaultBaselineOption - Option card for selecting default baseline simulation
 *
 * This is a standalone component that renders an option for "Current law + Nationwide population"
 * as a quick-select for the baseline simulation in a report.
 *
 * It checks if the user already has a matching simulation and reuses that ID if found.
 */

import { useState } from 'react';
import { Card, Group, Loader, Stack, Text } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { MOCK_USER_ID } from '@/constants';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import { useCreateGeographicAssociation } from '@/hooks/useUserGeographic';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import { SimulationStateProps, PolicyStateProps, PopulationStateProps } from '@/types/pathwayState';
import { SimulationAdapter } from '@/adapters';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationCreationPayload } from '@/types/payloads';
import {
  isDefaultBaselineSimulation,
  getDefaultBaselineLabel,
  countryNames
} from '@/utils/isDefaultBaselineSimulation';
import { spacing } from '@/designTokens';

interface DefaultBaselineOptionProps {
  countryId: string;
  currentLawId: number;
  onSelect: (simulationState: SimulationStateProps, simulationId: string) => void;
}

export default function DefaultBaselineOption({
  countryId,
  currentLawId,
  onSelect,
}: DefaultBaselineOptionProps) {
  const userId = MOCK_USER_ID.toString();
  const { data: userSimulations } = useUserSimulations(userId);
  const { mutateAsync: createGeographicAssociation } = useCreateGeographicAssociation();
  const simulationLabel = getDefaultBaselineLabel(countryId);
  const { createSimulation } = useCreateSimulation(simulationLabel);
  const [isCreating, setIsCreating] = useState(false);

  // Find existing default baseline simulation for this country
  const existingBaseline = userSimulations?.find((sim) =>
    isDefaultBaselineSimulation(sim, countryId, currentLawId)
  );

  // Get the simulation ID from the nested structure
  const existingSimulationId = existingBaseline?.userSimulation?.simulationId;

  const handleClick = async () => {
    if (isCreating) return; // Prevent double-click

    setIsCreating(true);
    const countryName = countryNames[countryId] || countryId.toUpperCase();

    // If exact simulation already exists, reuse it
    if (existingBaseline && existingSimulationId) {
      console.log('[DefaultBaselineOption] Reusing existing simulation:', existingSimulationId);

      // Build the simulation state from existing data
      const policy: PolicyStateProps = {
        id: currentLawId.toString(),
        label: 'Current law',
        parameters: [],
      };

      const population: PopulationStateProps = {
        label: `${countryName} nationwide`,
        type: 'geography',
        household: null,
        geography: {
          id: existingBaseline.geography?.geographyId || countryId,
          countryId: countryId as any,
          scope: 'national',
          geographyId: countryId,
          name: 'National',
        },
      };

      const simulationState: SimulationStateProps = {
        id: existingSimulationId,
        label: simulationLabel,
        countryId,
        apiVersion: undefined,
        status: undefined,
        output: null,
        policy,
        population,
      };

      onSelect(simulationState, existingSimulationId);
      return;
    }

    // Otherwise, create new geography and simulation
    try {
      // Step 1: Create geography association
      console.log('[DefaultBaselineOption] Creating geographic association');
      const geographyResult = await createGeographicAssociation({
        id: `${userId}-${Date.now()}`,
        userId: userId,
        countryId: countryId as any,
        geographyId: countryId,
        scope: 'national',
        label: `${countryName} nationwide`,
      });
      console.log('[DefaultBaselineOption] Geography created:', geographyResult);

      // Step 2: Create simulation with the new geography
      console.log('[DefaultBaselineOption] Creating simulation');
      const simulationData: Partial<Simulation> = {
        populationId: geographyResult.geographyId,
        policyId: currentLawId.toString(),
        populationType: 'geography',
      };

      const serializedPayload: SimulationCreationPayload =
        SimulationAdapter.toCreationPayload(simulationData);

      createSimulation(serializedPayload, {
        onSuccess: (data) => {
          console.log('[DefaultBaselineOption] Simulation created:', data);
          const simulationId = data.result.simulation_id;

          // Build the simulation state with the created IDs
          const policy: PolicyStateProps = {
            id: currentLawId.toString(),
            label: 'Current law',
            parameters: [],
          };

          const population: PopulationStateProps = {
            label: `${countryName} nationwide`,
            type: 'geography',
            household: null,
            geography: {
              id: geographyResult.geographyId,
              countryId: countryId as any,
              scope: 'national',
              geographyId: countryId,
              name: 'National',
            },
          };

          const simulationState: SimulationStateProps = {
            id: simulationId,
            label: simulationLabel,
            countryId,
            apiVersion: undefined,
            status: undefined,
            output: null,
            policy,
            population,
          };

          onSelect(simulationState, simulationId);
        },
        onError: (error) => {
          console.error('[DefaultBaselineOption] Failed to create simulation:', error);
          setIsCreating(false);
        },
      });
    } catch (error) {
      console.error('[DefaultBaselineOption] Failed to create geographic association:', error);
      setIsCreating(false);
    }
  };

  const hasExisting = !!(existingBaseline && existingSimulationId);
  const loadingText = hasExisting ? 'Applying simulation...' : 'Creating simulation...';

  return (
    <Card
      withBorder
      component="button"
      onClick={handleClick}
      variant={isCreating ? 'buttonPanel--active' : 'buttonPanel--inactive'}
      disabled={isCreating}
      style={{
        cursor: isCreating ? 'not-allowed' : 'pointer',
        opacity: isCreating ? 0.6 : 1,
      }}
    >
      <Group justify="space-between" align="center">
        <Stack gap={spacing.xs} style={{ flex: 1 }}>
          <Text fw={700}>
            {isCreating ? (
              <>
                <Loader size="xs" mr="xs" style={{ verticalAlign: 'middle' }} />
                {loadingText}
              </>
            ) : (
              simulationLabel
            )}
          </Text>
          <Text size="sm" c="dimmed">
            Use current law with all households nationwide as baseline
          </Text>
        </Stack>
        <IconChevronRight
          size={20}
          style={{
            color: 'var(--mantine-color-gray-6)',
            marginTop: '2px',
            flexShrink: 0,
          }}
        />
      </Group>
    </Card>
  );
}
