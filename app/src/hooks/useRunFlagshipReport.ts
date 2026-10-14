import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useFlagshipReportStore } from '@/hooks/useFlagshipStores';
import { markDraftRun } from '@/libs/draftReform';
import {
  runFlagshipReport,
  RunReportBaseline,
  RunReportProvision,
} from '@/libs/flagship/runReport';
import { RootState } from '@/store';

/**
 * Runs the flagship report pipeline for a set of provisions and
 * navigates to the report page, exposing pending/error state for the
 * triggering button.
 */
export function useRunFlagshipReport() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  const reportStore = useFlagshipReportStore();
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
    }: {
      /** A run from the draft hands the draft over: its report clears it. */
      fromDraft?: boolean;
      /** A state or congressional district ("state/ca"); the whole country when unset. */
      region?: string;
      /** Years of budget to score alongside the report, e.g. 10. */
      windowYears?: number;
      /** A saved reform to compare with; current law when unset. */
      baseline?: RunReportBaseline;
    } = {}
  ) => {
    if (isRunning) {
      return;
    }
    if (!currentLawId) {
      setError('Model metadata is still loading — try again in a moment.');
      return;
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
        reformId,
        year,
        region,
        windowYears,
        baseline,
        // With accounts, the run's record goes through the API (the account,
        // or this browser's unauthenticated user); otherwise this browser's.
        accountReportStore: reportStore.isAccount ? reportStore.store : null,
      });
      if (fromDraft) {
        markDraftRun(userReportId);
      }
      nav.push(`/${countryId}/report/${userReportId}`);
    } catch {
      setError('Could not start the report. Try again.');
      setIsRunning(false);
    }
  };

  return { run, isRunning, error };
}
