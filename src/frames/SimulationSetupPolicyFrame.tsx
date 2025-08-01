import NewExistingIngredientSelector from "@/components/NewExistingIngredientSelector";
import { FlowComponentProps } from "@/types/flow";

export default function SimulationSetupPolicyFrame({ onNavigate, onReturn }: FlowComponentProps) {

  function onClickCreateNew() {
    onNavigate('createNew');
  }

  return (
    <NewExistingIngredientSelector ingredientName="policy" onClickCreateNew={onClickCreateNew} />
  );
}