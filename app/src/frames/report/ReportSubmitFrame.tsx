import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ReportAdapter } from '@/adapters';
import IngredientSubmissionView, { SummaryBoxItem } from '@/components/IngredientSubmissionView';
import { useCreateReport } from '@/hooks/useCreateReport';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { clearFlow } from '@/reducers/flowReducer';
import { selectGeographyAtPosition, selectHouseholdAtPosition } from '@/reducers/populationReducer';
import { selectBothSimulations } from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Report } from '@/types/ingredients/Report';
import { ReportCreationPayload } from '@/types/payloads';
import { getReportOutputPath } from '@/utils/reportRouting';

export default function ReportSubmitFrame({ isInSubflow }: FlowComponentProps) {
  console.log('[ReportSubmitFrame] ========== COMPONENT RENDER ==========');
  console.log('[ReportSubmitFrame] isInSubflow:', isInSubflow);
  // Get navigation hook
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get report state from Redux
  const reportState = useSelector((state: RootState) => state.report);
  // Use selectBothSimulations to get simulations at positions 0 and 1
  const [simulation1, simulation2] = useSelector((state: RootState) =>
    selectBothSimulations(state)
  );

  // Get population data (household or geography) for each simulation
  const household1 = useSelector((state: RootState) => selectHouseholdAtPosition(state, 0));
  const household2 = useSelector((state: RootState) => selectHouseholdAtPosition(state, 1));
  const geography1 = useSelector((state: RootState) => selectGeographyAtPosition(state, 0));
  const geography2 = useSelector((state: RootState) => selectGeographyAtPosition(state, 1));

  const { createReport, isPending } = useCreateReport(reportState.label || undefined);
  const { resetIngredient } = useIngredientReset();

  function handleSubmit() {
    console.log('[ReportSubmitFrame] ========== SUBMIT CLICKED ==========');
    console.log('[ReportSubmitFrame] Report state:', reportState);
    console.log('[ReportSubmitFrame] Simulation1:', simulation1);
    console.log('[ReportSubmitFrame] Simulation2:', simulation2);
    // TODO: This code isn't really correct. Simulations should be created in
    // the SimulationSubmitFrame, then their IDs should be passed over to the
    // simulation reducer, then used here. This will be dealt with in separate commit.
    // Get the simulation IDs from the simulations
    const sim1Id = simulation1?.id;
    const sim2Id = simulation2?.id;

    // Validation: Prevent 0-simulation reports
    // At least one simulation must be configured
    if (!sim1Id) {
      console.error('[ReportSubmitFrame] Cannot submit report: no simulations configured');
      return;
    }

    // Submit both simulations if they exist and aren't created yet
    // TODO: Add logic to create simulations if !isCreated before submitting report

    // Prepare the report data for creation
    const reportData: Partial<Report> = {
      countryId: reportState.countryId,
      year: reportState.year,
      simulationIds: [sim1Id, sim2Id].filter(Boolean) as string[],
      apiVersion: reportState.apiVersion,
    };

    const serializedReportCreationPayload: ReportCreationPayload = ReportAdapter.toCreationPayload(
      reportData as Report
    );

    // The createReport hook expects countryId, payload, and simulation metadata
    createReport(
      {
        countryId: reportState.countryId,
        payload: serializedReportCreationPayload,
        simulations: {
          simulation1,
          simulation2,
        },
        populations: {
          household1,
          household2,
          geography1,
          geography2,
        },
      },
      {
        onSuccess: (data) => {
          console.log('[ReportSubmitFrame] ========== REPORT CREATED SUCCESSFULLY ==========');
          console.log('[ReportSubmitFrame] Created report:', data.userReport);
          const outputPath = getReportOutputPath(reportState.countryId, data.userReport.id);
          console.log('[ReportSubmitFrame] Navigating to:', outputPath);
          navigate(outputPath);
          console.log('[ReportSubmitFrame] isInSubflow:', isInSubflow);
          if (!isInSubflow) {
            console.log('[ReportSubmitFrame] Calling clearFlow() and resetIngredient("report")');
            dispatch(clearFlow());
            resetIngredient('report');
          } else {
            console.log('[ReportSubmitFrame] Skipping clearFlow and resetIngredient (in subflow)');
          }
        },
      }
    );
  }

  // Create summary boxes based on the simulations
  const summaryBoxes: SummaryBoxItem[] = [
    {
      title: 'Baseline simulation',
      description:
        simulation1?.label || (simulation1?.id ? `Simulation #${simulation1.id}` : 'No simulation'),
      isFulfilled: !!simulation1,
      badge: simulation1
        ? `Policy #${simulation1.policyId} • Population #${simulation1.populationId}`
        : undefined,
    },
    {
      title: 'Comparison simulation',
      description:
        simulation2?.label || (simulation2?.id ? `Simulation #${simulation2.id}` : 'No simulation'),
      isFulfilled: !!simulation2,
      isDisabled: !simulation2,
      badge: simulation2
        ? `Policy #${simulation2.policyId} • Population #${simulation2.populationId}`
        : undefined,
    },
  ];

  return (
    <IngredientSubmissionView
      title="Review Report Configuration"
      subtitle="Review your selected simulations before generating the report."
      summaryBoxes={summaryBoxes}
      submitButtonText="Generate Report"
      submissionHandler={handleSubmit}
      submitButtonLoading={isPending}
    />
  );
}
