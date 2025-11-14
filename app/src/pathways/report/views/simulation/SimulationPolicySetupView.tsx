/**
 * SimulationPolicySetupView - View for choosing how to setup policy
 * Duplicated from SimulationSetupPolicyFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import FlowView from '@/components/common/FlowView';

type SetupAction = 'createNew' | 'loadExisting' | 'selectCurrentLaw';

interface SimulationPolicySetupViewProps {
  currentLawId: number;
  countryId: string;
  onSelectCurrentLaw: () => void;
  onCreateNew: () => void;
  onLoadExisting: () => void;
}

export default function SimulationPolicySetupView({
  currentLawId,
  countryId,
  onSelectCurrentLaw,
  onCreateNew,
  onLoadExisting,
}: SimulationPolicySetupViewProps) {
  const [selectedAction, setSelectedAction] = useState<SetupAction | null>(null);

  function handleClickCreateNew() {
    setSelectedAction('createNew');
  }

  function handleClickExisting() {
    setSelectedAction('loadExisting');
  }

  function handleClickCurrentLaw() {
    setSelectedAction('selectCurrentLaw');
  }

  function handleClickSubmit() {
    if (selectedAction === 'selectCurrentLaw') {
      onSelectCurrentLaw();
    } else if (selectedAction === 'createNew') {
      onCreateNew();
    } else if (selectedAction === 'loadExisting') {
      onLoadExisting();
    }
  }

  const buttonPanelCards = [
    {
      title: 'Current Law',
      description: 'Use the baseline tax-benefit system with no reforms',
      onClick: handleClickCurrentLaw,
      isSelected: selectedAction === 'selectCurrentLaw',
    },
    {
      title: 'Load Existing Policy',
      description: 'Use a policy you have already created',
      onClick: handleClickExisting,
      isSelected: selectedAction === 'loadExisting',
    },
    {
      title: 'Create New Policy',
      description: 'Build a new policy',
      onClick: handleClickCreateNew,
      isSelected: selectedAction === 'createNew',
    },
  ];

  const primaryAction = {
    label: 'Next',
    onClick: handleClickSubmit,
    isDisabled: !selectedAction,
  };

  return (
    <FlowView
      title="Select Policy"
      variant="buttonPanel"
      buttonPanelCards={buttonPanelCards}
      primaryAction={primaryAction}
    />
  );
}
