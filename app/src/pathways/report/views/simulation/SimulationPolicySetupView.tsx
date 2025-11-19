/**
 * SimulationPolicySetupView - View for choosing how to setup policy
 * Duplicated from SimulationSetupPolicyFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { useUserPolicies } from '@/hooks/useUserPolicy';

type SetupAction = 'createNew' | 'loadExisting' | 'selectCurrentLaw';

interface SimulationPolicySetupViewProps {
  currentLawId: number;
  countryId: string;
  onSelectCurrentLaw: () => void;
  onCreateNew: () => void;
  onLoadExisting: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function SimulationPolicySetupView({
  currentLawId,
  countryId,
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
    // Only show "Load existing" if user has existing policies
    ...(hasExistingPolicies ? [{
      title: 'Load existing policy',
      description: 'Use a policy you have already created',
      onClick: handleClickExisting,
      isSelected: selectedAction === 'loadExisting',
    }] : []),
    {
      title: 'Create new policy',
      description: 'Build a new policy',
      onClick: handleClickCreateNew,
      isSelected: selectedAction === 'createNew',
    },
  ];

  const primaryAction = {
    label: 'Next ',
    onClick: handleClickSubmit,
    isDisabled: !selectedAction,
  };

  return (
    <FlowView
      title="Select policy"
      variant="buttonPanel"
      buttonPanelCards={buttonPanelCards}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
    />
  );
}
