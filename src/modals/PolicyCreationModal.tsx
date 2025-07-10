import { FormInput } from "@/components/FormInputs";
import IngredientCreationModal from "../components/IngredientCreationModal";

export default function PolicyCreationModal() {

  const formInputs: FormInput[] = [
    {
      label: "Reform title",
      inputType: "text",
      placeholder: "Policy name"
    }
  ];


  return (
    <IngredientCreationModal
      title="Create policy"
      formInputs={formInputs}
    />
  );
}