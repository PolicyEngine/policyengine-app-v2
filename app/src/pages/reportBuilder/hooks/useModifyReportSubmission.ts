/**
 * useModifyReportSubmission - Submission logic for the modify report page
 *
 * Supports two modes:
 * - "Save as new report": Creates new base ingredients + new UserReport association
 * - "Replace existing report": Creates new base ingredients + updates existing UserReport
 *   to point to the new base report
 *
 * In both cases, base ingredients (Simulation, Report) are always freshly created
 * via the API — only the user association layer differs.
 */
import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { ReportAdapter } from '@/adapters';
import { createReport as createBaseReport, createReportAndAssociateWithUser } from '@/api/report';
import { MOCK_USER_ID } from '@/constants';
import { useCalcOrchestratorManager } from '@/contexts/CalcOrchestratorContext';
import { useUpdateReportAssociation } from '@/hooks/useUserReportAssociations';
import { reportAssociationKeys, reportKeys } from '@/libs/queryKeys';
import { RootState } from '@/store';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { ReportBuilderState } from '../types';
import { createReportSimulations } from '../utils/createReportSimulations';
import { useReportIngredientAvailability } from './useReportIngredientAvailability';

interface UseModifyReportSubmissionArgs {
  reportState: ReportBuilderState;
  countryId: 'us' | 'uk';
  existingUserReportId: string;
  onSuccess: (userReportId: string) => void;
}

interface UseModifyReportSubmissionReturn {
  handleSaveAsNew: (label: string) => Promise<void>;
  handleReplace: () => Promise<void>;
  isSavingNew: boolean;
  isReplacing: boolean;
  isReportSubmissionBlocked: boolean;
}

export function useModifyReportSubmission({
  reportState,
  countryId,
  existingUserReportId,
  onSuccess,
}: UseModifyReportSubmissionArgs): UseModifyReportSubmissionReturn {
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  const manager = useCalcOrchestratorManager();
  const updateReportAssociation = useUpdateReportAssociation();
  const queryClient = useQueryClient();
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const { isReportConfigured } = useReportIngredientAvailability(reportState);
  const isReportSubmissionBlocked = !isReportConfigured;

  /**
   * Shared logic: create simulations via API and build the report payload.
   * Returns the created simulation IDs, domain-model simulations, and report payload.
   */
  const createSimulationsAndReport = useCallback(async () => {
    const { simulationIds, simulations } = await createReportSimulations({
      simulationStates: reportState.simulations,
      countryId,
      currentLawId,
    });

    const reportPayload = ReportAdapter.toCreationPayload({
      countryId,
      year: reportState.year,
      simulationIds,
      apiVersion: null,
    } as Report);

    return { simulationIds, simulations, reportPayload };
  }, [reportState, countryId, currentLawId]);

  /**
   * Shared logic: start calculation after a report is created.
   * Mirrors the logic in useCreateReport.onSuccess.
   */
  const startCalculation = useCallback(
    async (report: Report, simulations: (Simulation | null)[]) => {
      const simulation1 = simulations[0];
      if (!simulation1) {
        return;
      }

      const isHouseholdReport = simulation1.populationType === 'household';

      if (isHouseholdReport) {
        const allSims = simulations.filter((s): s is Simulation => s !== null && s?.id != null);
        for (const sim of allSims) {
          manager
            .startCalculation({
              calcId: sim.id!,
              targetType: 'simulation',
              countryId: report.countryId,
              year: report.year,
              simulations: { simulation1: sim, simulation2: null },
              populations: {
                household1: reportState.simulations[0]?.population?.household || null,
                household2: null,
                geography1: null,
                geography2: null,
              },
            })
            .catch((err) => {
              console.error(
                `[useModifyReportSubmission] Calculation failed for sim ${sim.id}:`,
                err
              );
            });
        }
      } else {
        await manager.startCalculation({
          calcId: String(report.id),
          targetType: 'report',
          countryId: report.countryId,
          year: report.year,
          simulations: {
            simulation1,
            simulation2: simulations[1] || null,
          },
          populations: {
            household1: null,
            household2: null,
            geography1: reportState.simulations[0]?.population?.geography || null,
            geography2: null,
          },
        });
      }
    },
    [manager, reportState]
  );

  /**
   * Save as new report: create new base report + new UserReport association.
   * Accepts a label for the new report.
   */
  const handleSaveAsNew = useCallback(
    async (label: string) => {
      if (isSavingNew || isReplacing || isReportSubmissionBlocked) {
        return;
      }
      setIsSavingNew(true);

      try {
        const { simulations, reportPayload } = await createSimulationsAndReport();

        const result = await createReportAndAssociateWithUser({
          countryId,
          payload: reportPayload,
          userId: MOCK_USER_ID,
          label: label || undefined,
        });

        queryClient.invalidateQueries({ queryKey: reportKeys.all });
        queryClient.invalidateQueries({ queryKey: reportAssociationKeys.all });

        await startCalculation(result.report, simulations);
        onSuccess(result.userReport.id);
      } catch (error) {
        console.error('[useModifyReportSubmission] Save as new failed:', error);
        setIsSavingNew(false);
      }
    },
    [
      isSavingNew,
      isReplacing,
      isReportSubmissionBlocked,
      createSimulationsAndReport,
      countryId,
      queryClient,
      startCalculation,
      onSuccess,
    ]
  );

  /**
   * Replace existing report: create new base report, then update the
   * existing UserReport association to point to the new base report ID.
   */
  const handleReplace = useCallback(async () => {
    if (isSavingNew || isReplacing || isReportSubmissionBlocked) {
      return;
    }
    setIsReplacing(true);

    try {
      const { simulations, reportPayload } = await createSimulationsAndReport();

      const reportMetadata = await createBaseReport(countryId, reportPayload);
      const report = ReportAdapter.fromMetadata(reportMetadata);

      await updateReportAssociation.mutateAsync({
        userReportId: existingUserReportId,
        updates: { reportId: String(report.id) },
      });

      queryClient.invalidateQueries({ queryKey: reportKeys.all });
      queryClient.invalidateQueries({ queryKey: reportAssociationKeys.all });

      await startCalculation(report, simulations);
      onSuccess(existingUserReportId);
    } catch (error) {
      console.error('[useModifyReportSubmission] Replace failed:', error);
      setIsReplacing(false);
    }
  }, [
    isSavingNew,
    isReplacing,
    isReportSubmissionBlocked,
    createSimulationsAndReport,
    countryId,
    existingUserReportId,
    updateReportAssociation,
    queryClient,
    startCalculation,
    onSuccess,
  ]);

  return {
    handleSaveAsNew,
    handleReplace,
    isSavingNew,
    isReplacing,
    isReportSubmissionBlocked,
  };
}
