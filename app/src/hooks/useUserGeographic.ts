import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiGeographicStore, SessionStorageGeographicStore } from '@/api/geographicAssociation';
import { queryConfig } from '@/libs/queryConfig';
import { geographicAssociationKeys } from '@/libs/queryKeys';
import { UserGeographicAssociation } from '@/types/userIngredientAssociations';

const apiGeographicStore = new ApiGeographicStore();
const sessionGeographicStore = new SessionStorageGeographicStore();

export const useUserGeographicStore = () => {
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  return isLoggedIn ? apiGeographicStore : sessionGeographicStore;
};

// This fetches only the user-geographic associations
export const useGeographicAssociationsByUser = (userId: string) => {
  const store = useUserGeographicStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: geographicAssociationKeys.byUser(userId),
    queryFn: () => store.findByUser(userId),
    ...config,
  });
};

export const useGeographicAssociation = (userId: string, geographyId: string) => {
  const store = useUserGeographicStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: geographicAssociationKeys.specific(userId, geographyId),
    queryFn: () => store.findById(userId, geographyId),
    ...config,
  });
};

export const useCreateGeographicAssociation = () => {
  const store = useUserGeographicStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (association: Omit<UserGeographicAssociation, 'createdAt'>) =>
      store.create(association),
    onSuccess: (newAssociation) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: geographicAssociationKeys.byUser(newAssociation.userId),
      });
      queryClient.invalidateQueries({
        queryKey: geographicAssociationKeys.byGeography(newAssociation.geographyIdentifier),
      });

      // Update specific query cache
      queryClient.setQueryData(
        geographicAssociationKeys.specific(
          newAssociation.userId,
          newAssociation.geographyIdentifier
        ),
        newAssociation
      );
    },
  });
};
