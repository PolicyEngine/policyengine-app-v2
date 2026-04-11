import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSharedReportData } from '@/hooks/useSharedReportData';
import { useUserReportById } from '@/hooks/useUserReports';
import type { ReportIngredientsInput } from '@/hooks/utils/useFetchReportIngredients';
import { RootState } from '@/store';
import type { ReportBuilderState } from '../types';
import { hydrateReportBuilderState } from '../utils/hydrateReportBuilderState';

interface UseReportBuilderStateReturn {
  reportState: ReportBuilderState | null;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState | null>>;
  originalState: ReportBuilderState | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseReportBuilderStateOptions {
  shareData?: ReportIngredientsInput | null;
}

export function useReportBuilderState(
  userReportId: string,
  options?: UseReportBuilderStateOptions
): UseReportBuilderStateReturn {
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  const shareData = options?.shareData ?? null;
  const isSharedSource = shareData !== null;
  const sourceKey = isSharedSource
    ? `${shareData.userReport.countryId}:${shareData.userReport.id ?? shareData.userReport.reportId}`
    : userReportId;
  const ownedData = useUserReportById(userReportId, { enabled: !isSharedSource });
  const sharedData = useSharedReportData(shareData, { enabled: isSharedSource });
  const data = isSharedSource ? sharedData : ownedData;

  const [reportState, setReportState] = useState<ReportBuilderState | null>(null);
  const originalStateRef = useRef<ReportBuilderState | null>(null);
  const hydratedSourceKeyRef = useRef<string | null>(null);

  const hydratedState = useMemo(() => {
    if (!data.userReport || !data.report || data.simulations.length === 0) {
      return null;
    }

    return hydrateReportBuilderState({
      userReport: data.userReport,
      report: data.report,
      simulations: data.simulations,
      policies: data.policies,
      households: data.households,
      geographies: data.geographies,
      userSimulations: data.userSimulations,
      userPolicies: data.userPolicies,
      userHouseholds: data.userHouseholds,
      userGeographies: data.userGeographies,
      currentLawId,
    });
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
    data.userGeographies,
    currentLawId,
  ]);

  const resolvedReportState =
    hydratedSourceKeyRef.current === sourceKey && reportState ? reportState : hydratedState;
  const resolvedOriginalState =
    hydratedSourceKeyRef.current === sourceKey ? originalStateRef.current : hydratedState;

  useEffect(() => {
    if (hydratedSourceKeyRef.current !== sourceKey) {
      setReportState(null);
      originalStateRef.current = null;
    }
  }, [sourceKey]);

  useEffect(() => {
    if (
      hydratedState &&
      hydratedSourceKeyRef.current !== sourceKey &&
      reportState === null &&
      !data.isLoading &&
      !data.error
    ) {
      setReportState(hydratedState);
      originalStateRef.current = hydratedState;
      hydratedSourceKeyRef.current = sourceKey;
    }
  }, [data.error, data.isLoading, hydratedState, reportState, sourceKey]);

  return {
    reportState: resolvedReportState,
    setReportState,
    originalState: resolvedOriginalState,
    isLoading: data.isLoading,
    error: data.error,
  };
}
