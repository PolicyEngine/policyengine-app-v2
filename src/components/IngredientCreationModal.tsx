import { Button, Grid, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import FormInputs, { FormInput } from "./FormInputs"; 


interface IngredientCreationModalProps {
  title: string;
  submitButtonText?: string; // Defaults to title
  activationButtonText?: string; // Defaults to title
  formInputs?: FormInput[]; // Optional array of form inputs
  submissionHandler: CallableFunction; // Function to handle form submission
}

export default function IngredientCreationModal({ title, activationButtonText, formInputs, submitButtonText, submissionHandler }: IngredientCreationModalProps) {

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
        <Grid>
          <Grid.Col span={6}><Button variant="default" onClick={close} fullWidth>Cancel</Button></Grid.Col>
          <Grid.Col span={6}><Button variant="filled" fullWidth onClick={() => submissionHandler()}>{submitButtonText || title}</Button></Grid.Col>
        </Grid>
      </Modal>
      <Button variant="default" onClick={open}>
        {activationButtonText || title}
      </Button>
    </>
  )
}