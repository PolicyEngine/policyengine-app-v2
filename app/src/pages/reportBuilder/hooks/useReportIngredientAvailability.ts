import { useMemo } from 'react';
import { MOCK_USER_ID } from '@/constants';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import {
  hasRequiredSimulationIngredients,
  hasUnavailableSimulationIngredients,
} from '@/utils/ingredientAvailability';
import type { ReportBuilderState } from '../types';

export function useReportIngredientAvailability(reportState: ReportBuilderState) {
  const userId = MOCK_USER_ID.toString();
  const { data: policies, isLoading: policiesLoading } = useUserPolicies(userId);
  const { data: households, isLoading: householdsLoading } = useUserHouseholds(userId);

  const hasUnavailableIngredients = useMemo(
    () => hasUnavailableSimulationIngredients(reportState.simulations, policies, households),
    [households, policies, reportState.simulations]
  );
  const isCheckingIngredientAvailability =
    policiesLoading || householdsLoading || policies === undefined || households === undefined;
  const hasRequiredIngredientIds = hasRequiredSimulationIngredients(reportState.simulations);
  const isReportConfigured =
    hasRequiredIngredientIds && !hasUnavailableIngredients && !isCheckingIngredientAvailability;

  return {
    hasUnavailableIngredients,
    isCheckingIngredientAvailability,
    isReportConfigured,
  };
}
