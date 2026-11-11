import { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { store } from '@/store';

export const METADATA_ERROR_MESSAGE = 'Failed to fetch metadata for us: 503 Service Unavailable';

const REQUEST_ID = 'flagship-states-test';

/** Puts the store where a metadata fetch that is still in flight leaves it. */
export function seedMetadataLoading(countryId = 'us') {
  store.dispatch({
    type: fetchMetadataThunk.pending.type,
    meta: { arg: countryId, requestId: REQUEST_ID, requestStatus: 'pending' },
  });
}

/** Puts the store where a failed metadata fetch leaves it. */
export function seedMetadataError(message = METADATA_ERROR_MESSAGE, countryId = 'us') {
  seedMetadataLoading(countryId);
  store.dispatch({
    type: fetchMetadataThunk.rejected.type,
    meta: {
      arg: countryId,
      requestId: REQUEST_ID,
      requestStatus: 'rejected',
      rejectedWithValue: true,
    },
    payload: message,
    error: { message: 'Rejected' },
  });
}
