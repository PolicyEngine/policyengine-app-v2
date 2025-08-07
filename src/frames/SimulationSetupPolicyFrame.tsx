import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import NewExistingIngredientSelector from '@/components/NewExistingIngredientSelector';
import { FlowComponentProps } from '@/types/flow';

export default function SimulationSetupPolicyFrame({ onNavigate, onReturn }: FlowComponentProps) {
  const policy = useSelector((state: any) => state.policy);

  function onClickCreateNew() {
    onNavigate('createNew');
  }

  function onClickExisting() {
    onNavigate('loadExisting');
  }

  return (
    <NewExistingIngredientSelector
      ingredientName="policy"
      onClickCreateNew={onClickCreateNew}
      onClickExisting={onClickExisting}
    />
  );
}
