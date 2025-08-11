import NewExistingIngredientSelector from '@/components/NewExistingIngredientSelector';
import { FlowComponentProps } from '@/types/flow';

export default function SimulationSetupPopulationFrame({ onNavigate }: FlowComponentProps) {
  function onClickCreateNew() {
    onNavigate('createNew');
  }

  function onClickExisting() {
    onNavigate('loadExisting');
  }

  return (
    <NewExistingIngredientSelector
      ingredientName="population"
      onClickCreateNew={onClickCreateNew}
      onClickExisting={onClickExisting}
    />
  );
}
