import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import type { RootState } from '@/store';
import {
  hasRequiredSimulationIngredients,
  hasUnavailableSimulationIngredients,
} from '@/utils/ingredientAvailability';
import { getModelMetadataError, getSPMSelectionError } from '@/utils/spmSelection';
import type { ReportBuilderState } from '../types';

export function useReportSPMSelectionError(reportState: ReportBuilderState) {
  const metadata = useSelector((state: RootState) => state.metadata);
  const countryId = useCurrentCountry();
  const metadataError = getModelMetadataError(countryId, metadata);
  if (metadataError) {
    return metadataError;
  }
  return reportState.simulations
    .map((simulation) => simulation.population?.household)
    .filter((household) => household !== null && household !== undefined)
    .map((household) => getSPMSelectionError(household, reportState.year, metadata))
    .find(Boolean);
}

export function useReportIngredientAvailability(reportState: ReportBuilderState) {
  const spmSelectionError = useReportSPMSelectionError(reportState);
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const userId = MOCK_USER_ID.toString();
  const { data: policies, isLoading: policiesLoading } = useUserPolicies(userId);
  const { data: households, isLoading: householdsLoading } = useUserHouseholds(userId);

  const hasUnavailableIngredients = useMemo(
    () => hasUnavailableSimulationIngredients(reportState.simulations, policies, households),
    [households, policies, reportState.simulations]
  );
  const isCheckingIngredientAvailability =
    policiesLoading ||
    householdsLoading ||
    policies === undefined ||
    households === undefined ||
    (Boolean(getModelMetadataError(countryId, metadata)) && !metadata.error);
  const hasRequiredIngredientIds = hasRequiredSimulationIngredients(reportState.simulations);
  const isReportConfigured =
    hasRequiredIngredientIds &&
    !hasUnavailableIngredients &&
    !isCheckingIngredientAvailability &&
    !spmSelectionError;

  return {
    hasUnavailableIngredients,
    spmSelectionError,
    isCheckingIngredientAvailability,
    isReportConfigured,
  };
}
