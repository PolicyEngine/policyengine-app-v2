import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CountryId } from '@/api/report';
import { POPULATION_PATHWAY_CONFIG } from './config';
import { PopulationState, PopulationViewKey } from './types';
import { POPULATION_VIEWS } from './views';

/**
 * PopulationPathwayWrapper manages the population creation pathway.
 *
 * This wrapper uses the pathway configuration system:
 * - POPULATION_VIEWS: Defines the individual view components
 * - POPULATION_PATHWAY_CONFIG: Defines the navigation flow between views
 *
 * The population pathway has conditional branching:
 * - After setting label, users go to either build-household OR confirm-geographic
 * - The branching is based on state.type ('household' or 'geography')
 *
 * All views use standard layout (rendered within Layout component from Router).
 */
export default function PopulationPathwayWrapper() {
  const navigate = useNavigate();
  const { countryId } = useParams<{ countryId: string }>();

  const [currentView, setCurrentView] = useState<PopulationViewKey>(
    POPULATION_PATHWAY_CONFIG.initialView
  );
  const [state, setState] = useState<PopulationState>({
    label: '',
    countryId: (countryId as CountryId) || 'us',
    geography: undefined,
    household: undefined,
    isCreated: false,
  });

  // Get current view configuration
  const view = POPULATION_VIEWS[currentView];
  const transitions = POPULATION_PATHWAY_CONFIG.transitions[currentView];

  const handleNext = () => {
    // Check if we can proceed (validation)
    if (view.canProceed && !view.canProceed(state)) {
      return;
    }

    if (transitions?.next) {
      // Handle dynamic transitions (functions)
      const nextView = typeof transitions.next === 'function' ? transitions.next(state) : transitions.next;
      setCurrentView(nextView);
    } else {
      // End of pathway - navigate back to populations page
      navigate(`/${countryId}/populations`);
    }
  };

  const handleBack = () => {
    if (transitions?.back) {
      // Handle dynamic transitions (functions)
      const backView = typeof transitions.back === 'function' ? transitions.back(state) : transitions.back;
      setCurrentView(backView);
    }
  };

  const handleStateChange = (newState: Partial<PopulationState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const handleCancel = () => {
    navigate(`/${countryId}/populations`);
  };

  const ViewComponent = view.component;

  return (
    <ViewComponent
      state={state}
      onStateChange={handleStateChange}
      onNext={handleNext}
      onBack={handleBack}
      onCancel={handleCancel}
    />
  );
}
