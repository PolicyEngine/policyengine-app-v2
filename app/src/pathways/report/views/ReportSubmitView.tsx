import IngredientSubmissionView, { SummaryBoxItem } from '@/components/IngredientSubmissionView';
import { ReportStateProps } from '@/types/pathwayState';

interface ReportSubmitViewProps {
  reportState: ReportStateProps;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function ReportSubmitView({
  reportState,
  onSubmit,
  isSubmitting,
}: ReportSubmitViewProps) {
  console.log('[ReportSubmitView] ========== COMPONENT RENDER ==========');

  const simulation1 = reportState.simulations[0];
  const simulation2 = reportState.simulations[1];

  // Create summary boxes based on the simulations
  const summaryBoxes: SummaryBoxItem[] = [
    {
      title: 'Baseline simulation',
      description:
        simulation1?.label || (simulation1?.id ? `Simulation #${simulation1.id}` : 'No simulation'),
      isFulfilled: !!simulation1?.id,
      badge: simulation1?.id
        ? `Policy #${simulation1.policy.id} • Population #${simulation1.population.household?.id || simulation1.population.geography?.id}`
        : undefined,
    },
    {
      title: 'Comparison simulation',
      description:
        simulation2?.label || (simulation2?.id ? `Simulation #${simulation2.id}` : 'No simulation'),
      isFulfilled: !!simulation2?.id,
      isDisabled: !simulation2?.id,
      badge: simulation2?.id
        ? `Policy #${simulation2.policy.id} • Population #${simulation2.population.household?.id || simulation2.population.geography?.id}`
        : undefined,
    },
  ];

  return (
    <IngredientSubmissionView
      title="Review Report Configuration"
      subtitle="Review your selected simulations before generating the report."
      summaryBoxes={summaryBoxes}
      submitButtonText="Generate Report"
      submissionHandler={onSubmit}
      submitButtonLoading={isSubmitting}
    />
  );
}
