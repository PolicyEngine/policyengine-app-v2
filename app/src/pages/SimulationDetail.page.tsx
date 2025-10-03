import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Paper,
  Divider,
  Badge,
  Loader,
  Center,
  ActionIcon,
} from '@mantine/core';
import { IconChevronLeft, IconPencil } from '@tabler/icons-react';
import { simulationsAPI } from '@/api/v2/simulations';
import { userSimulationsAPI } from '@/api/v2/userSimulations';
import { MOCK_USER_ID } from '@/constants';
import ReportRenameModal from '@/components/report/ReportRenameModal';
import moment from 'moment';

export default function SimulationDetailPage() {
  const { simulationId, countryId } = useParams<{ simulationId: string; countryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';
  const [renameModalOpened, setRenameModalOpened] = useState(false);

  const { data: simulation, isLoading: simulationLoading } = useQuery({
    queryKey: ['simulation', simulationId],
    queryFn: () => simulationsAPI.get(simulationId!),
    enabled: !!simulationId,
  });

  const { data: userSimulations = [] } = useQuery({
    queryKey: ['userSimulations', userId],
    queryFn: () => userSimulationsAPI.list(userId),
  });

  const renameMutation = useMutation({
    mutationFn: async (name: string) => {
      const existing = userSimulations.find(us => us.simulation_id === simulationId);
      if (existing) {
        return userSimulationsAPI.update(existing.id, { custom_name: name });
      } else {
        return userSimulationsAPI.create({
          user_id: userId,
          simulation_id: simulationId!,
          custom_name: name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSimulations', userId] });
      setRenameModalOpened(false);
    },
  });

  if (!simulationId) {
    return (
      <Container>
        <Text>Invalid simulation ID</Text>
      </Container>
    );
  }

  if (simulationLoading) {
    return (
      <Container py="xl">
        <Center>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (!simulation) {
    return (
      <Container>
        <Text>Simulation not found</Text>
      </Container>
    );
  }

  const userSim = userSimulations.find(us => us.simulation_id === simulationId);
  const displayName = userSim?.custom_name || simulation.name || simulation.id;

  return (
    <>
      <ReportRenameModal
        opened={renameModalOpened}
        onClose={() => setRenameModalOpened(false)}
        onSubmit={renameMutation.mutate}
        currentName={displayName}
        isLoading={renameMutation.isPending}
      />
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconChevronLeft size={16} />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </Group>

          <Stack gap="md">
            <Group gap="sm">
              <Title order={2}>{displayName}</Title>
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => setRenameModalOpened(true)}
              >
                <IconPencil size={18} />
              </ActionIcon>
            </Group>
            <Group gap="xs">
              <Badge variant="light" color={simulation.has_result ? 'green' : 'gray'}>
                {simulation.has_result ? 'Ready' : 'Not ready'}
              </Badge>
              <Text size="sm" c="dimmed">
                Created {moment(simulation.created_at).fromNow()}
              </Text>
            </Group>
          </Stack>

        <Divider />

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <div>
              <Text size="sm" fw={600} mb="xs">
                Simulation ID
              </Text>
              <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                {simulation.id}
              </Text>
            </div>

            {simulation.label && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Label
                </Text>
                <Text size="sm">{simulation.label}</Text>
              </div>
            )}

            <div>
              <Text size="sm" fw={600} mb="xs">
                Model
              </Text>
              <Text size="sm">{simulation.model || 'N/A'}</Text>
            </div>

            {simulation.model_version_id && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Model version
                </Text>
                <Text size="sm" style={{ fontFamily: 'monospace' }}>
                  {simulation.model_version_id}
                </Text>
              </div>
            )}

            {simulation.dataset_id && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Dataset
                </Text>
                <Text size="sm">{simulation.dataset_id}</Text>
              </div>
            )}

            <div>
              <Text size="sm" fw={600} mb="xs">
                Status
              </Text>
              <Badge color={simulation.has_result ? 'green' : 'gray'}>
                {simulation.has_result ? 'Has results' : 'No results'}
              </Badge>
            </div>

            <Divider />

            <Group gap="xs">
              <Text size="xs" c="dimmed">
                Created: {moment(simulation.created_at).format('MMMM D, YYYY h:mm A')}
              </Text>
              <Text size="xs" c="dimmed">
                •
              </Text>
              <Text size="xs" c="dimmed">
                Updated: {moment(simulation.updated_at).format('MMMM D, YYYY h:mm A')}
              </Text>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
    </>
  );
}