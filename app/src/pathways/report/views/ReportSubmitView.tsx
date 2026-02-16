import IngredientSubmissionView, { SummaryBoxItem } from '@/components/IngredientSubmissionView';
import { ReportStateProps } from '@/types/pathwayState';

interface ReportSubmitViewProps {
  reportState: ReportStateProps;
  onSubmit: () => void;
  isSubmitting: boolean;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function ReportSubmitView({
  reportState,
  onSubmit,
  isSubmitting,
  onBack,
  onCancel,
}: ReportSubmitViewProps) {
  const simulation1 = reportState.simulations[0];
  const simulation2 = reportState.simulations[1];

  // Helper to get badge text for a simulation
  const getSimulationBadge = (simulation: typeof simulation1) => {
    if (!simulation) {
      return undefined;
    }

    // Get policy label - use label if available, otherwise fall back to ID
    const policyLabel = simulation.policy.label || `Policy #${simulation.policy.id}`;

    // Get population label - use label if available, otherwise fall back to ID
    const populationLabel =
      simulation.population.label ||
      (simulation.population.household?.id ? `Household #${simulation.population.household.id}` : null) ||
      (simulation.population.geography?.regionCode ? `Households in ${simulation.population.geography.regionCode}` : null) ||
      'No population';

    return `${policyLabel} • ${populationLabel}`;
  };

  // Check if simulation is configured (has either ID or configured ingredients)
  const isSimulation1Configured =
    !!simulation1?.id ||
    (!!simulation1?.policy?.id &&
      !!(simulation1?.population?.household?.id || simulation1?.population?.geography?.regionCode));
  const isSimulation2Configured =
    !!simulation2?.id ||
    (!!simulation2?.policy?.id &&
      !!(simulation2?.population?.household?.id || simulation2?.population?.geography?.regionCode));

  // Create summary boxes based on the simulations
  const summaryBoxes: SummaryBoxItem[] = [
    {
      title: 'Baseline simulation',
      description:
        simulation1?.label || (simulation1?.id ? `Simulation #${simulation1.id}` : 'No simulation'),
      isFulfilled: isSimulation1Configured,
      badge: isSimulation1Configured ? getSimulationBadge(simulation1) : undefined,
    },
    {
      title: 'Comparison simulation',
      description:
        simulation2?.label || (simulation2?.id ? `Simulation #${simulation2.id}` : 'No simulation'),
      isFulfilled: isSimulation2Configured,
      isDisabled: !isSimulation2Configured,
      badge: isSimulation2Configured ? getSimulationBadge(simulation2) : undefined,
    },
  ];

  return (
    <IngredientSubmissionView
      title="Review report configuration"
      subtitle="Review your selected simulations before generating the report."
      summaryBoxes={summaryBoxes}
      submitButtonText="Create report"
      submissionHandler={onSubmit}
      submitButtonLoading={isSubmitting}
      onBack={onBack}
      onCancel={onCancel}
    />
  );
}
