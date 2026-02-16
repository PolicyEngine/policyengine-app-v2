/**
 * PopulationPathwayWrapper - Pathway orchestrator for standalone household creation
 *
 * Two-step flow: LABEL (name the household) → HOUSEHOLD_BUILDER (configure members).
 * Geography selection is only available through the report/simulation pathways.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StandardLayout from '@/components/StandardLayout';
import { CURRENT_YEAR } from '@/constants';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { usePathwayNavigation } from '@/hooks/usePathwayNavigation';
import { Household } from '@/types/ingredients/Household';
import { StandalonePopulationViewMode } from '@/types/pathwayModes/PopulationViewMode';
import { PopulationStateProps } from '@/types/pathwayState';
import HouseholdBuilderView from '../report/views/population/HouseholdBuilderView';
import PopulationLabelView from '../report/views/population/PopulationLabelView';

interface PopulationPathwayWrapperProps {
  onComplete?: () => void;
}

export default function PopulationPathwayWrapper({ onComplete }: PopulationPathwayWrapperProps) {
  const countryId = useCurrentCountry();
  const navigate = useNavigate();

  const [populationState, setPopulationState] = useState<PopulationStateProps>({
    type: 'household',
    label: null,
    household: null,
    geography: null,
  });

  const { currentMode, navigateToMode, goBack, canGoBack } = usePathwayNavigation(
    StandalonePopulationViewMode.LABEL
  );

  const handleUpdateLabel = (label: string) => {
    setPopulationState((prev) => ({ ...prev, label }));
  };

  const handleHouseholdSubmitSuccess = (_householdId: string, _household: Household) => {
    navigate(`/${countryId}/households`);
    onComplete?.();
  };

  let currentView: React.ReactElement;

  switch (currentMode) {
    case StandalonePopulationViewMode.LABEL:
      currentView = (
        <PopulationLabelView
          population={populationState}
          mode="standalone"
          onUpdateLabel={handleUpdateLabel}
          onNext={() => navigateToMode(StandalonePopulationViewMode.HOUSEHOLD_BUILDER)}
          onBack={() => navigate(`/${countryId}/households`)}
        />
      );
      break;

    case StandalonePopulationViewMode.HOUSEHOLD_BUILDER:
      currentView = (
        <HouseholdBuilderView
          population={populationState}
          countryId={countryId}
          onSubmitSuccess={handleHouseholdSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    default:
      currentView = <div>Unknown view mode: {currentMode}</div>;
  }

  return (
    <ReportYearProvider year={CURRENT_YEAR}>
      <StandardLayout>{currentView}</StandardLayout>
    </ReportYearProvider>
  );
}
