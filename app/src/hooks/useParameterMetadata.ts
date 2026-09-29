import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { MetadataState } from '@/types/metadata';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

export interface ParameterMetadataState {
  parameters: ParameterMetadataCollection;
  isReady: boolean;
}

/** Return parameter metadata only after the requested country's fetch has completed. */
export function getParameterMetadataState(
  metadata: MetadataState,
  countryId: string
): ParameterMetadataState {
  return {
    parameters: metadata.parameters,
    isReady:
      metadata.currentCountry === countryId &&
      metadata.loading === false &&
      metadata.error === null &&
      metadata.version !== null,
  };
}

/** Subscribe to the parameter metadata required to parse policies for one country. */
export function useParameterMetadata(countryId: string): ParameterMetadataState {
  const metadata = useSelector((state: RootState) => state.metadata);
  return getParameterMetadataState(metadata, countryId);
}
