import { useState, useEffect } from 'react';
import { Modal, Stack, TextInput, Select, Button, Group, Text } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simulationsAPI } from '@/api/v2/simulations';
import { datasetsAPI } from '@/api/v2/datasets';
import { modelVersionsAPI } from '@/api/v2/modelVersions';
import { userPoliciesAPI } from '@/api/v2/userPolicies';
import { usePolicies } from '@/hooks/usePolicies';
import { useCurrentModel } from '@/hooks/useCurrentModel';
import { notifications } from '@mantine/notifications';
import { MOCK_USER_ID } from '@/constants';

interface CreateSimulationModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function CreateSimulationModal({ opened, onClose }: CreateSimulationModalProps) {
  const queryClient = useQueryClient();
  const { modelId } = useCurrentModel();
  const [name, setName] = useState('');
  const [policyId, setPolicyId] = useState<string>('');
  const [datasetId, setDatasetId] = useState<string>('');
  const [modelVersionId, setModelVersionId] = useState<string>('');

  // Fetch options
  const { data: policies, isLoading: policiesLoading } = usePolicies();

  const { data: datasets, isLoading: datasetsLoading } = useQuery({
    queryKey: ['datasets', modelId],
    queryFn: async () => {
      const allDatasets = await datasetsAPI.listDatasets({ limit: 100 });
      return allDatasets.filter(d => d.model_id === modelId);
    },
  });

  const { data: modelVersions, isLoading: modelsLoading } = useQuery({
    queryKey: ['modelVersions', modelId],
    queryFn: async () => {
      const allVersions = await modelVersionsAPI.list();
      return allVersions.filter(mv => mv.model_id === modelId);
    },
  });

  // Auto-select the first (latest) model version for the current model
  useEffect(() => {
    if (modelVersions && modelVersions.length > 0 && !modelVersionId) {
      setModelVersionId(modelVersions[0].id);
    }
  }, [modelVersions, modelVersionId]);

  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';
  const { data: userPolicies = [] } = useQuery({
    queryKey: ['userPolicies', userId],
    queryFn: () => userPoliciesAPI.list(userId),
  });


  // Create simulation mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      // Get model_id from the selected model version
      const selectedModelVersion = modelVersions?.find(mv => mv.id === modelVersionId);
      return simulationsAPI.create({
        name,
        policy_id: policyId,
        dataset_id: datasetId,
        model_id: selectedModelVersion?.model_id,
        model_version_id: modelVersionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      notifications.show({
        title: 'Simulation created',
        message: 'Your simulation is being processed',
        color: 'green',
      });
      handleClose();
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to create simulation',
        color: 'red',
      });
    },
  });

  const handleClose = () => {
    setName('');
    setPolicyId('');
    setDatasetId('');
    setModelVersionId('');
    onClose();
  };

  const handleSubmit = () => {
    createMutation.mutate();
  };

  const canSubmit = policyId && datasetId && modelVersionId;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create simulation"
      size="md"
      centered
    >
      <Stack gap="md">
        <TextInput
          label="Name (optional)"
          placeholder="Enter simulation name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />

        <Select
          label="Policy"
          placeholder="Select policy"
          value={policyId}
          onChange={(value) => setPolicyId(value || '')}
          data={
            policies?.map((p) => {
              const userPolicy = userPolicies.find(up => up.policy_id === p.id);
              const displayName = userPolicy?.custom_name || p.name || `Policy #${p.id}`;
              return {
                value: p.id,
                label: displayName,
              };
            }) || []
          }
          searchable
          required
          disabled={policiesLoading}
        />

        <Select
          label="Dataset"
          placeholder="Select dataset"
          value={datasetId}
          onChange={(value) => setDatasetId(value || '')}
          data={
            datasets?.map((d) => ({
              value: d.id,
              label: d.name || d.description || d.id.slice(0, 8),
            })) || []
          }
          searchable
          required
          disabled={datasetsLoading}
        />

        <Select
          label="Model version"
          placeholder="Select model version"
          value={modelVersionId}
          onChange={(value) => setModelVersionId(value || '')}
          data={
            modelVersions?.map((m) => ({
              value: m.id,
              label: `${m.model_id} (${m.version})`,
            })) || []
          }
          searchable
          required
          disabled={modelsLoading}
        />

        <Text size="xs" c="dimmed">
          The simulation will be queued for processing and results will be available once complete.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={createMutation.isPending}
          >
            Create simulation
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
