import { TextInput } from "@mantine/core";

type InputType = "text" | "number" | "select" | "checkbox" | "radio";

export interface FormInput {
  label: string;
  inputType: InputType;
  options?: string[]; // For select or radio inputs
  placeholder?: string; // For text or number inputs
  required?: boolean; // Whether the input is required
  defaultValue?: string | number | boolean; // Default value for the input
}

export default function FormInputs({ formInputs }: { formInputs: FormInput[] }) {

  const formInputsElements = formInputs.map((input, index) => {
    switch (input.inputType) {
      case "text":
        return (
          <TextInput
            key={index}
            label={input.label}
            placeholder={input.placeholder}
            defaultValue={input.defaultValue as string}
            required={input.required}
          />
        );
      case "number":
      case "select":
      case "checkbox":
      case "radio":
      default:
        return null;
    }
  });

  return (
    <div>
      {formInputsElements}
    </div>
  );
}