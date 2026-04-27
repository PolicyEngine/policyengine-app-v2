import { useMutation } from '@tanstack/react-query';
import { createSimulation } from '@/api/simulation';
import { createHouseholdSimulation } from '@/api/v2/simulations';
import { assertSupportedSimulationCapabilityMode } from '@/config/simulationCapability';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getV2Id, isUuid } from '@/libs/migration/idMapping';
import { SimulationCreationPayload } from '@/types/payloads';
import { useCreateSimulationAssociation } from './useUserSimulationAssociations';

type StandaloneSimulationCreateInput =
  | SimulationCreationPayload
  | {
      payload: SimulationCreationPayload;
      populationId: string;
      populationType: SimulationCreationPayload['population_type'];
      policyId: string;
    };

function normalizeCreateInput(input: StandaloneSimulationCreateInput): {
  payload: SimulationCreationPayload;
  populationId: string;
  populationType: SimulationCreationPayload['population_type'];
  policyId: string;
} {
  if ('payload' in input) {
    return input;
  }

  return {
    payload: input,
    populationId: input.population_id,
    populationType: input.population_type,
    policyId: String(input.policy_id),
  };
}

function resolveV2SimulationBaseId(
  entityType: 'Policy' | 'Household',
  rawId: string
): string | null {
  return isUuid(rawId) ? rawId : getV2Id(entityType, rawId);
}

export function useCreateSimulation(simulationLabel?: string) {
  const country = useCurrentCountry();
  // const user = MOCK_USER_ID; // TODO: Replace with actual user context or auth hook in future
  const createAssociation = useCreateSimulationAssociation();

  const mutation = useMutation({
    mutationFn: async (input: StandaloneSimulationCreateInput) => {
      const { payload, populationId, populationType, policyId } = normalizeCreateInput(input);

      if (populationType === 'household') {
        const mode = assertSupportedSimulationCapabilityMode(
          'standalone_household_create',
          ['v1_only', 'mixed', 'v2_enabled'],
          'useCreateSimulation'
        );

        if (mode !== 'v1_only') {
          assertSupportedSimulationCapabilityMode(
            'associations',
            ['mixed', 'v2_enabled'],
            'useCreateSimulation'
          );

          const v2HouseholdId = resolveV2SimulationBaseId('Household', populationId);
          if (!v2HouseholdId) {
            throw new Error(
              `[SimulationCapability] Missing mapped v2 household id for standalone household simulation create: ${populationId}`
            );
          }

          const v2PolicyId = resolveV2SimulationBaseId('Policy', policyId);
          if (!v2PolicyId) {
            throw new Error(
              `[SimulationCapability] Missing mapped v2 policy id for standalone household simulation create: ${policyId}`
            );
          }

          const response = await createHouseholdSimulation({
            household_id: v2HouseholdId,
            policy_id: v2PolicyId,
          });

          return {
            result: {
              simulation_id: response.id,
            },
          };
        }
      } else {
        assertSupportedSimulationCapabilityMode(
          'standalone_economy_create',
          ['v1_only', 'phase4_only'],
          'useCreateSimulation'
        );
      }

      return createSimulation(country, payload);
    },
    onSuccess: async (data) => {
      try {
        // Create association with current user (or anonymous for session storage)
        const userId = MOCK_USER_ID; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID

        await createAssociation.mutateAsync({
          userId,
          simulationId: data.result.simulation_id, // This is from the API response structure; may be modified in API v2
          countryId: country,
          label: simulationLabel,
          isCreated: true,
        });
      } catch (error) {
        console.error('Simulation created but association failed:', error);
      }
    },
  });

  return {
    createSimulation: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
