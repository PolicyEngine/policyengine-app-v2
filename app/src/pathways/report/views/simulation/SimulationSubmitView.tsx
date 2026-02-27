/**
 * SimulationSubmitView - View for reviewing and confirming simulation configuration
 *
 * In v2, simulations are NOT pre-created via API. The v2 analysis endpoints
 * (POST /analysis/economy or /analysis/household-impact) create simulations
 * server-side when the report is submitted. This view validates the config
 * and generates a temporary local ID to mark the simulation as "configured."
 */

import IngredientSubmissionView, { SummaryBoxItem } from '@/components/IngredientSubmissionView';
import { SimulationStateProps } from '@/types/pathwayState';

interface SimulationSubmitViewProps {
  simulation: SimulationStateProps;
  onSubmitSuccess: (simulationId: string) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function SimulationSubmitView({
  simulation,
  onSubmitSuccess,
  onBack,
  onCancel,
}: SimulationSubmitViewProps) {
  function handleSubmit() {
    // Generate a temporary local ID to mark this simulation as configured.
    // The real v2 simulation ID will be assigned by the analysis endpoint
    // when the report is created (useCreateReport).
    const tempId = crypto.randomUUID();
    onSubmitSuccess(tempId);
  }

  // Create summary boxes based on the current simulation state
  const populationIdentifier =
    simulation.population.household?.id || simulation.population.geography?.regionCode;
  const populationDisplay =
    simulation.population.label ||
    (simulation.population.household?.id
      ? `Household #${simulation.population.household.id}`
      : null) ||
    (simulation.population.geography?.regionCode
      ? `Households in ${simulation.population.geography.regionCode}`
      : null) ||
    'No population';
  const summaryBoxes: SummaryBoxItem[] = [
    {
      title: 'Population added',
      description: populationDisplay,
      isFulfilled: !!populationIdentifier,
      badge: populationDisplay,
    },
    {
      title: 'Policy reform added',
      description: simulation.policy.label || `Policy #${simulation.policy.id}`,
      isFulfilled: !!simulation.policy.id,
      badge: simulation.policy.label || `Policy #${simulation.policy.id}`,
    },
  ];

  return (
    <IngredientSubmissionView
      title="Summary of selections"
      subtitle="Review your configurations and add additional criteria before running your simulation."
      summaryBoxes={summaryBoxes}
      submitButtonText="Create simulation"
      submissionHandler={handleSubmit}
      submitButtonLoading={false}
      onBack={onBack}
      onCancel={onCancel}
    />
  );
}
