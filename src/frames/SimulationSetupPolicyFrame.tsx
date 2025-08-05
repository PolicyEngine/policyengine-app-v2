import NewExistingIngredientSelector from "@/components/NewExistingIngredientSelector";
import { FlowComponentProps } from "@/types/flow";
import { useSelector } from "react-redux";

export default function SimulationSetupPolicyFrame({ onNavigate, onReturn }: FlowComponentProps) {

  const policy = useSelector((state: any) => state.policy);

  // TODO: This causes bad setState() call; determine how to fix
  if (policy && policy.isCreated) {
    onNavigate('policyCreated');
    return null; // Prevent rendering if policy is already created
  }

  function onClickCreateNew() {
    onNavigate('createNew');
  }

  return (
    <NewExistingIngredientSelector ingredientName="policy" onClickCreateNew={onClickCreateNew} />
  );
}