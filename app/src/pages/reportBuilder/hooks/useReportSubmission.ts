/**
 * useReportSubmission - Extracted submission logic for creating a new report
 *
 * Handles:
 * - Sequential simulation creation via API
 * - Report creation with simulation IDs
 * - isReportConfigured derivation
 * - isSubmitting state
 *
 * Accepts an onSuccess callback instead of navigating directly,
 * so the consuming page controls routing.
 */
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { ReportAdapter } from '@/adapters';
import { useCreateReport } from '@/hooks/useCreateReport';
import { RootState } from '@/store';
import { Report } from '@/types/ingredients/Report';
import { trackReportStarted } from '@/utils/analytics';
import { ReportBuilderState } from '../types';
import { createReportSimulations } from '../utils/createReportSimulations';
import { useReportIngredientAvailability } from './useReportIngredientAvailability';

interface UseReportSubmissionArgs {
  reportState: ReportBuilderState;
  countryId: 'us' | 'uk';
  onSuccess: (userReportId: string) => void;
}

interface UseReportSubmissionReturn {
  handleSubmit: () => Promise<void>;
  isSubmitting: boolean;
  isReportConfigured: boolean;
}

function getJourneyProfiler(): {
  markStart?: (name: string, category?: 'user-interaction' | 'api-call' | 'render') => void;
  markEnd?: (name: string, category?: 'user-interaction' | 'api-call' | 'render') => void;
  markEvent?: (name: string, category?: 'user-interaction' | 'api-call' | 'render') => void;
} | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return null;
  }

  return (window as any).__journeyProfiler ?? null;
}

export function useReportSubmission({
  reportState,
  countryId,
  onSuccess,
}: UseReportSubmissionArgs): UseReportSubmissionReturn {
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createReport } = useCreateReport(reportState.label || undefined);
  const { isReportConfigured } = useReportIngredientAvailability(reportState);

  const handleSubmit = useCallback(async () => {
    if (!isReportConfigured || isSubmitting) {
      return;
    }

    const journeyProfiler = getJourneyProfiler();
    setIsSubmitting(true);
    trackReportStarted();
    journeyProfiler?.markStart?.('report-submit', 'user-interaction');

    try {
      journeyProfiler?.markStart?.('report-submit-simulations', 'api-call');
      const { simulationIds, simulations } = await createReportSimulations({
        simulationStates: reportState.simulations,
        countryId,
        currentLawId,
      });

      journeyProfiler?.markEnd?.('report-submit-simulations', 'api-call');

      const reportData: Partial<Report> = {
        countryId,
        year: reportState.year,
        simulationIds,
        apiVersion: null,
      };

      const serializedPayload = ReportAdapter.toCreationPayload(reportData as Report);

      journeyProfiler?.markStart?.('report-submit-create-report', 'api-call');
      await createReport(
        {
          countryId,
          payload: serializedPayload,
          simulations: {
            simulation1: simulations[0],
            simulation2: simulations[1] || null,
          },
          populations: {
            household1: reportState.simulations[0]?.population?.household || null,
            household2: reportState.simulations[1]?.population?.household || null,
            geography1: reportState.simulations[0]?.population?.geography || null,
            geography2: reportState.simulations[1]?.population?.geography || null,
          },
        },
        {
          onSuccess: (data) => {
            journeyProfiler?.markEvent?.('report-submit-success-handoff', 'render');
            onSuccess(data.userReport.id);
          },
          onError: (error) => {
            console.error('[useReportSubmission] Report creation failed:', error);
            setIsSubmitting(false);
            journeyProfiler?.markEnd?.('report-submit-create-report', 'api-call');
            journeyProfiler?.markEnd?.('report-submit', 'user-interaction');
          },
        }
      );
      journeyProfiler?.markEnd?.('report-submit-create-report', 'api-call');
      journeyProfiler?.markEnd?.('report-submit', 'user-interaction');
    } catch (error) {
      console.error('[useReportSubmission] Error running report:', error);
      setIsSubmitting(false);
      journeyProfiler?.markEnd?.('report-submit-create-report', 'api-call');
      journeyProfiler?.markEnd?.('report-submit-simulations', 'api-call');
      journeyProfiler?.markEnd?.('report-submit', 'user-interaction');
    }
  }, [
    isReportConfigured,
    isSubmitting,
    reportState,
    countryId,
    currentLawId,
    createReport,
    onSuccess,
  ]);

  return { handleSubmit, isSubmitting, isReportConfigured };
}
