import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useUserReportById } from '@/hooks/useUserReports';
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

export function useReportBuilderState(userReportId: string): UseReportBuilderStateReturn {
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  const data = useUserReportById(userReportId);

  const [reportState, setReportState] = useState<ReportBuilderState | null>(null);
  const originalStateRef = useRef<ReportBuilderState | null>(null);

  useEffect(() => {
    if (
      !data.isLoading &&
      !data.error &&
      data.userReport &&
      data.report &&
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
        userGeographies: data.userGeographies,
        currentLawId,
      });
      setReportState(hydrated);
      originalStateRef.current = hydrated;
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
    data.userGeographies,
    currentLawId,
    reportState,
  ]);

  return {
    reportState,
    setReportState,
    originalState: originalStateRef.current,
    isLoading: data.isLoading,
    error: data.error,
  };
}
