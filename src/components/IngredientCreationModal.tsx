import { Button, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import FormInputs, { FormInput } from "./FormInputs"; 


interface IngredientCreationModalProps {
  title: string;
  activationButtonText: string;
  formInputs?: FormInput[]; // Optional array of form inputs
}

export default function IngredientCreationModal({ title, activationButtonText, formInputs }: IngredientCreationModalProps) {

  const [opened, {open, close}] = useDisclosure(false);

  return (
    <>
      <Modal opened={opened} onClose={close} title={title} centered>
      {/*icon*/}
      {/*subtitle*/}
      {/*break*/}
      {/*form labels and inputs*/}
        {formInputs && <FormInputs formInputs={formInputs} />}
      {/*button panel: Cancel and Create X*/}
      </Modal>
      <Button variant="default" onClick={open}>
        {activationButtonText}
      </Button>
    </>
  )
}