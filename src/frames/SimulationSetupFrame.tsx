import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Stack, Text } from '@mantine/core';
import {
  updateSimulationPolicyId,
  updateSimulationPopulationId,
} from '@/reducers/simulationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import FlowView, { ButtonConfig } from '@/components/common/FlowView';

export default function SimulationSetupFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const simulation = useSelector((state: RootState) => state.simulation);
  const policy = useSelector((state: RootState) => state.policy);

  const handlePolicySelect = () => {
    onNavigate('setupPolicy');
  };

  const handlePopulationSelect = () => {
    onNavigate('setupPopulation');
  };

  const handleNext = () => {
    onNavigate('next');
  };

  // Listen for policy creation and update simulation with policy ID
  useEffect(() => {
    if (policy.isCreated && policy.id && !simulation.policyId) {
      dispatch(updateSimulationPolicyId(policy.id));
    }
  }, [policy.isCreated, policy.id, simulation.policyId, dispatch]);

  // Set default population ID when policy is selected
  useEffect(() => {
    if (simulation.policyId && !simulation.populationId) {
      dispatch(updateSimulationPopulationId('default-population'));
    }
  }, [simulation.policyId, simulation.populationId, dispatch]);

  const canProceed: boolean = !!(simulation.policyId && simulation.populationId);

  const buttons: ButtonConfig[] = [
    {
      label: 'Cancel',
      variant: 'default',
      onClick: () => console.log('Cancel clicked'), // TODO: Fix when cancel buttons are fixed
    },
    {
      label: 'Next',
      variant: canProceed ? 'filled' : 'disabled',
      onClick: canProceed ? handleNext : () => null,
    },
  ];

  const content = (
    <Stack>
      {/* Temporarily add color to demonstrate disabled*/}
      <Card
        withBorder
        p="md"
        mb="xl"
        component="button"
        onClick={handlePopulationSelect}
        disabled={true} // isPopulationDisabled
        bg="gray"
      >
        <Text fw={700}>TODO: ICON</Text>
        <Text>Add population</Text>
        <Text size="sm" c="dimmed">
          Select a geographic scope or specific household
        </Text>
      </Card>
      
      {policy && policy.isCreated ? (
        <Card withBorder p="md" mb="xl" component="button" bg="lightblue">
          {/* TODO: Remove hardcoded color*/}
          <Text fw={700}>TODO: ICON</Text>
          <Text>{policy.label}</Text>
          <Text size="sm" c="dimmed">
            {policy.label}
          </Text>
        </Card>
      ) : (
        <Card withBorder p="md" mb="xl" component="button" onClick={handlePolicySelect}>
          <Text fw={700}>TODO: ICON</Text>
          <Text>Add policy</Text>
          <Text size="sm" c="dimmed">
            Select a policy to apply to the simulation
          </Text>
        </Card>
      )}
    </Stack>
  );

  return (
    <FlowView
      title="Setup Simulation"
      variant="custom"
      content={content}
      buttons={buttons}
    />
  );
}
