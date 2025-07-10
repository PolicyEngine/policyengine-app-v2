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

  function submissionHandler() {
    // Handle the form submission logic here
    console.log("Form submitted");
  }


  return (
    <IngredientCreationModal
      title="Create policy"
      formInputs={formInputs}
      submissionHandler={submissionHandler}
    />
  );
}