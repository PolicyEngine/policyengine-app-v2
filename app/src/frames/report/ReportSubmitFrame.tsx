import { useSelector } from 'react-redux';
import { ReportAdapter } from '@/adapters';
import IngredientSubmissionView, { SummaryBoxItem } from '@/components/IngredientSubmissionView';
import { useCreateReport } from '@/hooks/useCreateReport';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { selectAllSimulations } from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Report } from '@/types/ingredients/Report';
import { ReportCreationPayload } from '@/types/payloads';

export default function ReportSubmitFrame({ onNavigate, isInSubflow }: FlowComponentProps) {
  // Get report state from Redux
  const reportState = useSelector((state: RootState) => state.report);
  const simulations = useSelector((state: RootState) => selectAllSimulations(state));

  // Get the two simulations from report state
  const sim1Id = reportState.simulationIds[0];
  const sim2Id = reportState.simulationIds[1];

  const simulation1 = sim1Id
    ? simulations.find((s) => s.id === sim1Id)
    : null;
  const simulation2 = sim2Id
    ? simulations.find((s) => s.id === sim2Id)
    : null;

  console.log('Report label: ', reportState.label);
  const { createReport, isPending } = useCreateReport(reportState.label || undefined);
  const { resetIngredient } = useIngredientReset();

  function handleSubmit() {
    // Prepare the report data for creation
    const reportData: Partial<Report> = {
      countryId: reportState.countryId,
      simulationIds: [sim1Id, sim2Id].filter(Boolean) as string[],
      apiVersion: reportState.apiVersion,
    };

    const serializedReportCreationPayload: ReportCreationPayload =
      ReportAdapter.toCreationPayload(reportData as Report);

    console.log('Submitting report:', serializedReportCreationPayload);

    // The createReport hook expects countryId and payload
    createReport(
      {
        countryId: reportState.countryId,
        payload: serializedReportCreationPayload,
      },
      {
        onSuccess: () => {
          onNavigate('submit');
          if (!isInSubflow) {
            resetIngredient('report');
          }
        },
      }
    );
  }

  // Create summary boxes based on the simulations
  const summaryBoxes: SummaryBoxItem[] = [
    {
      title: 'First Simulation',
      description: simulation1?.label || `Simulation #${sim1Id}`,
      isFulfilled: !!simulation1,
      badge: simulation1 ? `Policy #${simulation1.policyId} • Population #${simulation1.populationId}` : undefined,
    },
    {
      title: 'Second Simulation',
      description: simulation2?.label || `Simulation #${sim2Id}`,
      isFulfilled: !!simulation2,
      badge: simulation2 ? `Policy #${simulation2.policyId} • Population #${simulation2.populationId}` : undefined,
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