import NewExistingIngredientSelector from "@/components/NewExistingIngredientSelector";
import { FlowComponentProps } from "@/types/flow";
import { useSelector } from "react-redux";
import { useEffect } from "react";

export default function SimulationSetupPolicyFrame({ onNavigate, onReturn }: FlowComponentProps) {

  const policy = useSelector((state: any) => state.policy);

  function onClickCreateNew() {
    onNavigate('createNew');
  }

  function onClickExisting() {
    onNavigate('loadExisting');
  }

  return (
    <NewExistingIngredientSelector ingredientName="policy" onClickCreateNew={onClickCreateNew} onClickExisting={onClickExisting} />
  );
}