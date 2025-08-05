import NewExistingIngredientSelector from "@/components/NewExistingIngredientSelector";
import { FlowComponentProps } from "@/types/flow";
import { useSelector } from "react-redux";
import { useEffect } from "react";

export default function SimulationSetupPolicyFrame({ onNavigate, onReturn }: FlowComponentProps) {

  const policy = useSelector((state: any) => state.policy);

  // Navigate away if policy is already created - use useEffect to avoid setState during render
  useEffect(() => {
    if (policy && policy.isCreated) {
      onNavigate('policyCreated');
    }
  }, [policy, onNavigate]);

  // Don't render the selector if policy is already created
  if (policy && policy.isCreated) {
    return null;
  }

  function onClickCreateNew() {
    onNavigate('createNew');
  }

  return (
    <NewExistingIngredientSelector ingredientName="policy" onClickCreateNew={onClickCreateNew} />
  );
}