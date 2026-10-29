import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useFlagshipReportStore } from '@/hooks/useFlagshipStores';
import { markDraftRun } from '@/libs/draftReform';
import {
  flagshipReportQueryKeys,
  runFlagshipReport,
  RunReportBaseline,
  RunReportProvision,
} from '@/libs/flagship/runReport';
import { RootState } from '@/store';

/**
 * Runs the flagship report pipeline for a set of provisions and
 * navigates to the report page, exposing pending/error state for the
 * triggering button. A run answers the report's link, or null when it
 * did not start.
 */
export function useRunFlagshipReport() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const queryClient = useQueryClient();
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  const reportStore = useFlagshipReportStore();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Warm the report's chart bundle while the user is reviewing the reform.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import('@/pages/flagship/Report.page').catch(() => {
        // Navigation retries the normal import if preloading fails.
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, []);

  const run = async (
    title: string,
    sourceNote: string,
    provisions: RunReportProvision[],
    reformId?: string | null,
    year?: number,
    {
      fromDraft = false,
      region,
      windowYears,
      baseline,
      savedReportId,
    }: {
      /** A run from the draft hands the draft over: its report clears it. */
      fromDraft?: boolean;
      /** A state or congressional district ("state/ca"); the whole country when unset. */
      region?: string;
      /** Years of budget to score alongside the report, e.g. 10. */
      windowYears?: number;
      /** A saved reform to compare with; current law when unset. */
      baseline?: RunReportBaseline;
      /** A saved report to move onto this run, instead of saving a new one. */
      savedReportId?: string;
    } = {}
  ): Promise<string | null> => {
    if (isRunning) {
      return null;
    }
    if (!currentLawId) {
      setError('Model metadata is still loading — try again in a moment.');
      return null;
    }
    setIsRunning(true);
    setError(null);
    try {
      const userReportId = await runFlagshipReport({
        countryId,
        title,
        sourceNote,
        provisions,
        currentLawId: Number(currentLawId),
        parameters,
        reformId,
        year,
        region,
        windowYears,
        baseline,
        // With accounts, the run's record goes through the API (the account,
        // or this browser's unauthenticated user); otherwise this browser's.
        accountReportStore: reportStore.isAccount ? reportStore.store : null,
        savedReportId,
      });
      if (fromDraft) {
        markDraftRun(userReportId);
      }
      // Your reforms lists the new report at once, not when its cache goes stale.
      void queryClient.invalidateQueries({ queryKey: flagshipReportQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: flagshipReportQueryKeys.statuses });
      if (savedReportId) {
        // The saved report now points at this run: its page, which may be
        // the one open, reads the record again. It keeps its link, so the
        // page may stay mounted, and its next run must not wait on this one.
        void queryClient.invalidateQueries({ queryKey: ['shared-report'] });
        void queryClient.invalidateQueries({ queryKey: ['flagship-report-record'] });
        setIsRunning(false);
      }
      nav.push(`/${countryId}/report/${userReportId}`);
      return userReportId;
    } catch {
      setError('Could not start the report. Try again.');
      setIsRunning(false);
      return null;
    }
  };

  return { run, isRunning, error };
}
