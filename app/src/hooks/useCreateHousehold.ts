import { useMutation } from '@tanstack/react-query';
import { createHousehold } from '@/api/household';
import { useCurrentUserId } from '@/libs/auth/useAssociationBackend';
import { countryIds } from '@/libs/countries';
import { reportSaveFailure } from '@/libs/saveFailureNotice';
import type { HouseholdCreationPayload } from '@/types/payloads';
import { useCreateHouseholdAssociation } from './useUserHousehold';

interface CreateHouseholdVariables {
  payload: HouseholdCreationPayload;
  label?: string;
}

export function useCreateHousehold(householdLabel?: string) {
  const userId = useCurrentUserId();
  const createAssociation = useCreateHouseholdAssociation();

  const mutation = useMutation({
    mutationFn: ({ payload }: CreateHouseholdVariables) => createHousehold(payload),
    onSuccess: async (data, { payload, label }) => {
      const resolvedLabel = label ?? householdLabel ?? payload.label;

      try {
        // File the association under the current user (the account when
        // signed in, localStorage otherwise)
        await createAssociation.mutateAsync({
          userId,
          householdId: data.result.household_id,
          countryId: payload.country_id as (typeof countryIds)[number], // Use the country from the creation payload
          label: resolvedLabel,
        });
      } catch (error) {
        console.error('Household created but association failed:', error);
        // The builder carries on with the created household; tell the user it
        // is not in their saved work (account unavailable, too large, down).
        reportSaveFailure('household', error);
      }
    },
  });

  const createHouseholdWithLabel = (
    payload: HouseholdCreationPayload,
    label?: string,
    options?: Parameters<typeof mutation.mutateAsync>[1]
  ) => mutation.mutateAsync({ payload, label }, options);

  return {
    createHousehold: (
      payload: HouseholdCreationPayload,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => createHouseholdWithLabel(payload, householdLabel, options),
    createHouseholdWithLabel,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
