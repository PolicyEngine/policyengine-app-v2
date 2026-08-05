import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { runFlagshipReport, RunReportProvision } from '@/libs/flagship/runReport';
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
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (title: string, sourceNote: string, provisions: RunReportProvision[]) => {
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
      });
      nav.push(`/${countryId}/report/${userReportId}`);
    } catch {
      setError('Could not start the report. Try again.');
      setIsRunning(false);
    }
  };

  return { run, isRunning, error };
}
