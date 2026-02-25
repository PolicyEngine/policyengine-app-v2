import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getStoreBackend } from '@/libs/storeBackend';
import { ApiReportStore, LocalStorageReportStore } from '../api/reportAssociation';
import { queryConfig } from '../libs/queryConfig';
import { reportAssociationKeys } from '../libs/queryKeys';
import { UserReport } from '../types/ingredients/UserReport';

const apiReportStore = new ApiReportStore();
const localReportStore = new LocalStorageReportStore();

export const useUserReportStore = () => {
  const backend = getStoreBackend();
  return backend === 'api' ? apiReportStore : localReportStore;
};

/**
 * Lightweight hook that fetches only the user-report associations
 *
 * Use this hook when you need:
 * - Just the list of user's reports (IDs and labels)
 * - Report counts or simple lists
 * - Navigation menus or sidebars
 *
 * For full report data with simulations and outputs, use useUserReports
 */
export const useReportAssociationsByUser = (userId: string) => {
  const store = useUserReportStore();
  const countryId = useCurrentCountry();
  const backend = getStoreBackend();
  const config = backend === 'api' ? queryConfig.api : queryConfig.localStorage;

  return useQuery({
    queryKey: reportAssociationKeys.byUser(userId, countryId),
    queryFn: () => store.findByUser(userId, countryId),
    ...config,
  });
};

export const useReportAssociation = (userId: string, reportId: string) => {
  const store = useUserReportStore();
  const backend = getStoreBackend();
  const config = backend === 'api' ? queryConfig.api : queryConfig.localStorage;

  return useQuery({
    queryKey: reportAssociationKeys.specific(userId, reportId),
    queryFn: () => store.findById(userId, reportId),
    ...config,
  });
};

export const useReportAssociationById = (userReportId: string, options?: { enabled?: boolean }) => {
  const store = useUserReportStore();
  const backend = getStoreBackend();
  const config = backend === 'api' ? queryConfig.api : queryConfig.localStorage;
  const isEnabled = options?.enabled !== false;

  return useQuery({
    queryKey: reportAssociationKeys.byUserReportId(userReportId),
    queryFn: () => store.findByUserReportId(userReportId),
    ...config,
    enabled: isEnabled,
  });
};

/**
 * Create a new report association
 *
 * Supports two modes:
 * - Without id: generates a new id (use for new reports)
 * - With id: uses the provided id (use for saving shared reports with a specific id)
 */
export const useCreateReportAssociation = () => {
  const store = useUserReportStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      userReport: Omit<UserReport, 'createdAt'> | Omit<UserReport, 'id' | 'createdAt'>
    ) => {
      // If id is provided, use createWithId for idempotent save
      if ('id' in userReport && userReport.id) {
        return store.createWithId(userReport as Omit<UserReport, 'createdAt'>);
      }
      // Otherwise, generate a new id
      return store.create(userReport as Omit<UserReport, 'id' | 'createdAt'>);
    },
    onSuccess: (newAssociation) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: reportAssociationKeys.byUser(
          newAssociation.userId.toString(),
          newAssociation.countryId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: reportAssociationKeys.byReport(newAssociation.reportId.toString()),
      });

      // Update specific query cache
      queryClient.setQueryData(
        reportAssociationKeys.specific(
          newAssociation.userId.toString(),
          newAssociation.reportId.toString()
        ),
        newAssociation
      );
    },
  });
};

export const useUpdateReportAssociation = () => {
  const store = useUserReportStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userReportId,
      userId,
      updates,
    }: {
      userReportId: string;
      userId: string;
      updates: Partial<UserReport>;
    }) => store.update(userReportId, userId, updates),

    onSuccess: (updatedAssociation) => {
      // Invalidate all related queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: reportAssociationKeys.byUser(
          updatedAssociation.userId,
          updatedAssociation.countryId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: reportAssociationKeys.byReport(updatedAssociation.reportId),
      });

      // CRITICAL: Also invalidate the byUserReportId query (this is what the UI uses!)
      queryClient.invalidateQueries({
        queryKey: reportAssociationKeys.byUserReportId(updatedAssociation.id),
      });

      // Optimistically update caches
      queryClient.setQueryData(
        reportAssociationKeys.specific(updatedAssociation.userId, updatedAssociation.reportId),
        updatedAssociation
      );

      queryClient.setQueryData(
        reportAssociationKeys.byUserReportId(updatedAssociation.id),
        updatedAssociation
      );
    },
  });
};

export const useDeleteReportAssociation = () => {
  const store = useUserReportStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userReportId,
      userId,
      countryId,
    }: {
      userReportId: string;
      userId: string;
      countryId?: string;
    }) => store.delete(userReportId, userId),
    onSuccess: (_, { userId, countryId, userReportId }) => {
      queryClient.invalidateQueries({
        queryKey: reportAssociationKeys.byUser(userId, countryId),
      });
      queryClient.invalidateQueries({
        queryKey: reportAssociationKeys.byUserReportId(userReportId),
      });
    },
  });
};
