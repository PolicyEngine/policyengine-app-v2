import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dismissTypeChange } from '@/api/v2Me';
import { isV2ApiError } from '@/api/v2UserClient';
import { useCountryContext } from '@/contexts/CountryContext';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import type { LatestUserTypeChange, MeItem } from '@/types/v2User';
import { meQueryKey, useMe } from './useMe';

/**
 * The signed-in user's latest type change, from `/v2/me`, until they
 * dismiss it; null otherwise, and while `/v2/me` is not read.
 */
export function useLatestTypeChange(): LatestUserTypeChange | null {
  return useMe().data?.latest_type_change ?? null;
}

/**
 * Dismisses a type change. Once the API answers, `/v2/me`'s cached user no
 * longer names it. When the API has no such change (404: dismissed
 * elsewhere), `/v2/me` is read again.
 */
export function useDismissTypeChange() {
  const { subject } = useAuthStatus();
  const countryId = useCountryContext();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (typeChangeId: string) => dismissTypeChange(client, typeChangeId),
    onSuccess: async (_result, typeChangeId) => {
      const queryKey = meQueryKey(subject, countryId);
      // A read that started before the dismissal would bring the change back.
      await queryClient.cancelQueries({ queryKey, exact: true });
      queryClient.setQueryData<MeItem>(queryKey, (me) =>
        me && me.latest_type_change?.id === typeChangeId ? { ...me, latest_type_change: null } : me
      );
    },
    onError: (error) => {
      if (isV2ApiError(error, 404)) {
        void queryClient.invalidateQueries({ queryKey: meQueryKey(subject, countryId) });
      }
    },
  });
}
