import { RootState } from '@/store';
import { MetadataApiPayload, MetadataState } from '@/types/metadata';

// Get tax years from Redux cache (for utility functions)
export const getTaxYears = (state: RootState) => {
  return (
    state.metadata.economyOptions.time_period?.map((tp) => ({
      value: tp.name.toString(),
      label: tp.label,
    })) || []
  );
};

// Get regions from Redux cache
export const getRegions = (state: RootState) => {
  return (
    state.metadata.economyOptions.region?.map((region) => ({
      value: region.name,
      label: region.label,
    })) || []
  );
};

// // Get datasets from Redux cache
// export const getDatasets = (state: RootState) => {
//   return state.metadata.economyOptions.datasets?.map(dataset => ({
//     value: dataset.name,
//     label: dataset.label
//   })) || [];
// };

// // Get metadata status
// export const selectMetadataStatus = (state: RootState) => ({
//   loading: state.metadata.loading,
//   error: state.metadata.error,
//   hasData: state.metadata.version !== null,
// });

export function transformMetadataPayload(
  payload: MetadataApiPayload,
  country: string
): Omit<MetadataState, 'loading' | 'error' | 'lastFetched'> {
  const data = payload.result;
  return {
    currentCountry: country,
    variables: data.variables ?? {},
    parameters: data.parameters ?? {},
    entities: data.entities ?? {},
    variableModules: data.variableModules ?? {},
    economyOptions: data.economy_options ?? { region: [], time_period: [], datasets: [] },
    currentLawId: data.current_law_id ?? 0,
    basicInputs: data.basicInputs ?? [],
    modelledPolicies: data.modelled_policies ?? { core: {}, filtered: {} },
    version: data.version ?? null,
  };
}
