import NewExistingIngredientSelector from '@/components/NewExistingIngredientSelector';
import { FlowComponentProps } from '@/types/flow';

export default function SimulationSetupPolicyFrame({ onNavigate }: FlowComponentProps) {
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
