import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FlowView from '@/components/common/FlowView';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import { createPolicyAtPosition } from '@/reducers/policyReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

type SetupAction = 'createNew' | 'loadExisting' | 'selectCurrentLaw';

export default function SimulationSetupPolicyFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const country = useCurrentCountry();
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);

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

  function handleSubmitCurrentLaw() {
    // Create current law policy at the current position
    dispatch(
      createPolicyAtPosition({
        position: currentPosition,
        policy: {
          id: currentLawId.toString(),
          label: 'Current law',
          parameters: [], // Empty parameters = current law
          isCreated: true, // Already exists (it's the baseline)
          countryId: country,
        },
      })
    );
  }

  function handleClickSubmit() {
    if (selectedAction === 'selectCurrentLaw') {
      handleSubmitCurrentLaw();
      onNavigate(selectedAction);
    } else if (selectedAction) {
      onNavigate(selectedAction);
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
