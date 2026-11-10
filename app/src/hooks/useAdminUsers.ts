import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changeAdminUserType,
  fetchAdminUser,
  fetchUserTypeChanges,
  searchAdminUsers,
  type SignedInUserType,
} from '@/api/v2AdminUsers';
import { useCountryContext } from '@/contexts/CountryContext';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { adminUserKeys } from '@/libs/queryKeys';
import { meQueryKey } from './useMe';

/**
 * Hooks for the admin users page. They call routes only admins may use, so
 * render them only for admins (inside `<MinimumUserType minimum="admin">`).
 */

/** How many users one page of the list or a search reads. */
export const ADMIN_USER_PAGE_SIZE = 50;

/** Signed-in users whose email contains `email` (every user when empty), newest first, a page at a time. */
export function useAdminUserSearch(email: string) {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  return useInfiniteQuery({
    queryKey: adminUserKeys.search(subject, email),
    queryFn: ({ pageParam }) =>
      searchAdminUsers(client, { email, offset: pageParam, limit: ADMIN_USER_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.offset + lastPage.items.length : undefined,
  });
}

export function useAdminUser(userId: string) {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  return useQuery({
    queryKey: adminUserKeys.user(subject, userId),
    queryFn: () => fetchAdminUser(client, userId),
  });
}

export function useUserTypeChanges(userId: string) {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  return useQuery({
    queryKey: adminUserKeys.typeChanges(subject, userId),
    queryFn: () => fetchUserTypeChanges(client, userId),
  });
}

/**
 * Changes a user's type. Afterwards it reads the admin routes again (the
 * user, the lists and the history), and `/v2/me`, since an admin can
 * change their own type.
 */
export function useChangeUserType() {
  const { subject } = useAuthStatus();
  const countryId = useCountryContext();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, userType }: { userId: string; userType: SignedInUserType }) =>
      changeAdminUserType(client, userId, userType),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminUserKeys.all(subject) }),
        queryClient.invalidateQueries({ queryKey: meQueryKey(subject, countryId) }),
      ]),
  });
}
