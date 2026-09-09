import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useSharedReportData } from '@/hooks/useSharedReportData';
import { useUserReportById } from '@/hooks/useUserReports';
import type { ReportIngredientsInput } from '@/hooks/utils/useFetchReportIngredients';
import { RootState } from '@/store';
import type { ReportBuilderState } from '../types';
import { cloneReportBuilderState } from '../utils/cloneReportBuilderState';
import { hydrateReportBuilderState } from '../utils/hydrateReportBuilderState';

interface UseReportBuilderStateReturn {
  reportState: ReportBuilderState | null;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState | null>>;
  originalState: ReportBuilderState | null;
  isLoading: boolean;
  error: Error | null;
}

export function useReportBuilderState(
  userReportId: string,
  shareData: ReportIngredientsInput | null = null
): UseReportBuilderStateReturn {
  const countryId = useCurrentCountry();
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  const isSharedView = shareData !== null;
  const ownedData = useUserReportById(userReportId, {
    enabled: !isSharedView && !!userReportId,
  });
  const sharedDataResult = useSharedReportData(shareData, { enabled: isSharedView });
  const data = isSharedView ? sharedDataResult : ownedData;

  // Include the base report ID so replacing an association also starts a fresh draft.
  const sourceKey = JSON.stringify([
    countryId,
    isSharedView ? shareData : userReportId,
    data.userReport?.reportId,
  ]);
  const [snapshot, setSnapshot] = useState<{
    sourceKey: string;
    reportState: ReportBuilderState | null;
    originalState: ReportBuilderState;
  } | null>(null);
  const expectedAssociationId = isSharedView
    ? (shareData.userReport.id ?? shareData.userReport.reportId)
    : userReportId;
  const dataMatchesSource =
    data.userReport?.id === expectedAssociationId &&
    data.userReport?.countryId === countryId &&
    data.report?.countryId === countryId &&
    data.report?.id === data.userReport?.reportId;
  const currentSnapshot = snapshot?.sourceKey === sourceKey && dataMatchesSource ? snapshot : null;
  // Hide old state during the render of a source change, before effects run.
  const reportState = currentSnapshot?.reportState ?? null;
  const setReportState = useCallback<UseReportBuilderStateReturn['setReportState']>(
    (nextState) => {
      setSnapshot((previous) => {
        if (!previous || previous.sourceKey !== sourceKey) {
          return previous;
        }
        return {
          ...previous,
          reportState:
            typeof nextState === 'function' ? nextState(previous.reportState) : nextState,
        };
      });
    },
    [sourceKey]
  );

  useEffect(() => {
    if (
      !data.isLoading &&
      !data.error &&
      data.userReport &&
      data.report &&
      dataMatchesSource &&
      data.simulations.length > 0 &&
      reportState === null
    ) {
      const hydrated = hydrateReportBuilderState({
        userReport: data.userReport,
        report: data.report,
        simulations: data.simulations,
        policies: data.policies,
        households: data.households,
        geographies: data.geographies,
        userSimulations: data.userSimulations,
        userPolicies: data.userPolicies,
        userHouseholds: data.userHouseholds,
        currentLawId,
      });
      setSnapshot({
        sourceKey,
        reportState: hydrated,
        originalState: cloneReportBuilderState(hydrated),
      });
    }
  }, [
    data.isLoading,
    data.error,
    data.userReport,
    data.report,
    data.simulations,
    data.policies,
    data.households,
    data.geographies,
    data.userSimulations,
    data.userPolicies,
    data.userHouseholds,
    currentLawId,
    reportState,
    sourceKey,
    dataMatchesSource,
  ]);

  return {
    reportState,
    setReportState,
    originalState: currentSnapshot?.originalState ?? null,
    isLoading: data.isLoading || (!data.error && reportState === null),
    error: data.error,
  };
}
