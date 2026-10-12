import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useAssociationBackend } from '@/libs/auth/useAssociationBackend';
import {
  ApiReportStore,
  LocalStorageReportStore,
  type UserReportStore,
} from '../api/reportAssociation';
import { queryConfig } from '../libs/queryConfig';
import { reportAssociationKeys } from '../libs/queryKeys';
import { UserReport } from '../types/ingredients/UserReport';

// Created on first use rather than at import, so modules (and test mocks)
// that load this hook do not construct storage eagerly.
let localReportStore: LocalStorageReportStore | null = null;
const getLocalReportStore = () => (localReportStore ??= new LocalStorageReportStore());

type ReportAssociationStoreSelection = {
  store: UserReportStore;
  config: typeof queryConfig.api | typeof queryConfig.localStorage;
  /** False while the session is being restored; queries wait. */
  ready: boolean;
};

export const useReportAssociationStoreForMode = (): ReportAssociationStoreSelection => {
  const backend = useAssociationBackend();
  return useMemo(
    () =>
      backend.mode === 'api'
        ? {
            store: new ApiReportStore(backend, getLocalReportStore()),
            config: queryConfig.api,
            ready: true,
          }
        : { store: getLocalReportStore(), config: queryConfig.localStorage, ready: backend.ready },
    [backend]
  );
};

export const useUserReportStore = () => {
  return useReportAssociationStoreForMode().store;
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
  const { store, config, ready } = useReportAssociationStoreForMode();
  const countryId = useCurrentCountry();

  return useQuery({
    queryKey: reportAssociationKeys.byUser(userId, countryId),
    queryFn: () => store.findByUser(userId, countryId),
    ...config,
    enabled: ready,
  });
};

export const useReportAssociation = (userId: string, reportId: string) => {
  const { store, config, ready } = useReportAssociationStoreForMode();

  return useQuery({
    queryKey: reportAssociationKeys.specific(userId, reportId),
    queryFn: () => store.findById(userId, reportId),
    ...config,
    enabled: ready,
  });
};

export const useReportAssociationById = (userReportId: string, options?: { enabled?: boolean }) => {
  const { store, config, ready } = useReportAssociationStoreForMode();
  const isEnabled = options?.enabled !== false;

  return useQuery({
    queryKey: reportAssociationKeys.byUserReportId(userReportId),
    queryFn: () => store.findByUserReportId(userReportId),
    ...config,
    enabled: ready && isEnabled,
  });
};

/**
 * Create a new report association
 *
 * Supports two modes:
 * - Without id: generates a new id (use for new reports)
 * - With id: in localStorage, saves under the provided id (shared-report
 *   saves); account storage always assigns its own id
 */
export const useCreateReportAssociation = () => {
  const store = useUserReportStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      userReport: Omit<UserReport, 'createdAt'> | Omit<UserReport, 'id' | 'createdAt'>
    ) => {
      // If id is provided and the store keeps caller IDs, save under it (idempotent)
      if ('id' in userReport && userReport.id && store.createWithId) {
        return store.createWithId(userReport as Omit<UserReport, 'createdAt'>);
      }
      // Otherwise the store assigns the id
      const { id: _id, ...fields } = userReport as Partial<UserReport>;
      return store.create(fields as Omit<UserReport, 'id' | 'createdAt'>);
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
      updates,
    }: {
      userReportId: string;
      updates: Partial<UserReport>;
    }) => store.update(userReportId, updates),

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

// Not yet implemented, but keeping for future use
/*
export const useDeleteReportAssociation = () => {
  const store = useUserReportStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reportId }: { userId: string; reportId: string; countryId?: string }) =>
      store.delete(userId, reportId),
    onSuccess: (_, { userId, reportId, countryId }) => {
      queryClient.invalidateQueries({ queryKey: reportAssociationKeys.byUser(userId, countryId) });
      queryClient.invalidateQueries({ queryKey: reportAssociationKeys.byReport(reportId) });

      queryClient.setQueryData(
        reportAssociationKeys.specific(userId, reportId),
        null
      );
    },
  });
};
*/
