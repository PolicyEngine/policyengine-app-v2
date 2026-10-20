import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { V3_API_ROUTES } from '@/libs/flagship/v3ApiRoutes';
import { fetchMetadataThunk, metadataRequest } from '@/reducers/metadataReducer';
import type { AppDispatch, RootState } from '@/store';

export type FlagshipMetadataStatus = 'loading' | 'error' | 'ready';

/**
 * Where the model's metadata stands for the current country, for app v3
 * views that wait on it: still loading, failed, or ready. A failed fetch
 * is not tried again on its own (the loader runs once per country), so
 * `retry` asks for it again.
 */
export function useFlagshipMetadataStatus(): {
  status: FlagshipMetadataStatus;
  /** The fetch's error message, when it failed. */
  message: string | null;
  retry: () => unknown;
} {
  const countryId = useCurrentCountry();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.metadata.loading);
  const error = useSelector((state: RootState) => state.metadata.error);
  // Ready only with metadata from the routes v3 uses (see v3ApiRoutes).
  const ready = useSelector(
    (state: RootState) =>
      state.metadata.version !== null &&
      state.metadata.currentCountry === countryId &&
      (state.metadata.routes ?? 'v1') === V3_API_ROUTES
  );

  const retry = useCallback(
    () => dispatch(fetchMetadataThunk(metadataRequest(countryId, V3_API_ROUTES))),
    [dispatch, countryId]
  );

  const status: FlagshipMetadataStatus =
    !loading && error ? 'error' : ready && !loading ? 'ready' : 'loading';
  return { status, message: status === 'error' ? error : null, retry };
}
