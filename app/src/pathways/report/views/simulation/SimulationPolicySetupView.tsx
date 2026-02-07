/**
 * SimulationPolicySetupView - View for choosing how to setup policy
 * Duplicated from SimulationSetupPolicyFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import PathwayView from '@/components/common/PathwayView';
import { MOCK_USER_ID } from '@/constants';
import { useUserPolicies } from '@/hooks/useUserPolicy';

type SetupAction = 'createNew' | 'loadExisting' | 'selectCurrentLaw';

interface SimulationPolicySetupViewProps {
  currentLawId: null;
  countryId: string;
  onSelectCurrentLaw: () => void;
  onCreateNew: () => void;
  onLoadExisting: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function SimulationPolicySetupView({
  currentLawId: _currentLawId,
  countryId: _countryId,
  onSelectCurrentLaw,
  onCreateNew,
  onLoadExisting,
  onBack,
  onCancel,
}: SimulationPolicySetupViewProps) {
  const userId = MOCK_USER_ID.toString();
  const { data: userPolicies } = useUserPolicies(userId);
  const hasExistingPolicies = (userPolicies?.length ?? 0) > 0;

  const [selectedAction, setSelectedAction] = useState<SetupAction | null>(null);

  function handleClickCreateNew() {
    setSelectedAction('createNew');
  }

  function handleClickExisting() {
    if (hasExistingPolicies) {
      setSelectedAction('loadExisting');
    }
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
      title: 'Current law',
      description: 'Use the baseline tax-benefit system with no reforms',
      onClick: handleClickCurrentLaw,
      isSelected: selectedAction === 'selectCurrentLaw',
    },
    {
      title: 'Create new policy',
      description: 'Build a new policy',
      onClick: handleClickCreateNew,
      isSelected: selectedAction === 'createNew',
    },
    {
      title: 'Load existing policy',
      description: hasExistingPolicies
        ? 'Use a policy you have already created'
        : 'No existing policies available',
      onClick: handleClickExisting,
      isSelected: selectedAction === 'loadExisting',
      isDisabled: !hasExistingPolicies,
    },
  ];

  const primaryAction = {
    label: 'Next',
    onClick: handleClickSubmit,
    isDisabled: !selectedAction,
  };

  return (
    <PathwayView
      title="Select policy"
      variant="buttonPanel"
      buttonPanelCards={buttonPanelCards}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
    />
  );
}
