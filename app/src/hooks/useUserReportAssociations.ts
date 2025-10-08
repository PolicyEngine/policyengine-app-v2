// Import auth hook here in future; for now, mocked out below
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiReportStore, LocalStorageReportStore } from '../api/reportAssociation';
import { queryConfig } from '../libs/queryConfig';
import { reportAssociationKeys } from '../libs/queryKeys';
import { UserReport } from '../types/ingredients/UserReport';

const apiReportStore = new ApiReportStore();
const localReportStore = new LocalStorageReportStore();

export const useUserReportStore = () => {
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  return isLoggedIn ? apiReportStore : localReportStore;
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
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  // TODO: Should we determine user ID from auth context here? Or pass as arg?
  const config = isLoggedIn ? queryConfig.api : queryConfig.localStorage;

  return useQuery({
    queryKey: reportAssociationKeys.byUser(userId),
    queryFn: () => store.findByUser(userId),
    ...config,
  });
};

export const useReportAssociation = (userId: string, reportId: string) => {
  const store = useUserReportStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.localStorage;

  return useQuery({
    queryKey: reportAssociationKeys.specific(userId, reportId),
    queryFn: () => store.findById(userId, reportId),
    ...config,
  });
};

export const useCreateReportAssociation = () => {
  const store = useUserReportStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userReport: Omit<UserReport, 'id' | 'createdAt'>) => store.create(userReport),
    onSuccess: (newAssociation) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: reportAssociationKeys.byUser(newAssociation.userId.toString()),
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

// Not yet implemented, but keeping for future use
/*
export const useUpdateReportAssociation = () => {
  const store = useUserReportStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reportId, updates }: {
      userId: string;
      reportId: string;
      updates: Partial<UserReport>;
    }) => store.update(userId, reportId, updates),
    onSuccess: (updatedAssociation) => {
      queryClient.invalidateQueries({ queryKey: reportAssociationKeys.byUser(updatedAssociation.userId) });
      queryClient.invalidateQueries({ queryKey: reportAssociationKeys.byReport(updatedAssociation.reportId) });

      queryClient.setQueryData(
        reportAssociationKeys.specific(updatedAssociation.userId, updatedAssociation.reportId),
        updatedAssociation
      );
    },
  });
};
*/

// Not yet implemented, but keeping for future use
/*
export const useDeleteReportAssociation = () => {
  const store = useUserReportStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reportId }: { userId: string; reportId: string }) =>
      store.delete(userId, reportId),
    onSuccess: (_, { userId, reportId }) => {
      queryClient.invalidateQueries({ queryKey: reportAssociationKeys.byUser(userId) });
      queryClient.invalidateQueries({ queryKey: reportAssociationKeys.byReport(reportId) });

      queryClient.setQueryData(
        reportAssociationKeys.specific(userId, reportId),
        null
      );
    },
  });
};
*/
