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
import { datasetsAPI } from '@/api/v2/datasets';
import { userDatasetsAPI } from '@/api/v2/userDatasets';
import { MOCK_USER_ID } from '@/constants';
import ReportRenameModal from '@/components/report/ReportRenameModal';
import moment from 'moment';

export default function DatasetDetailPage() {
  const { datasetId, countryId } = useParams<{ datasetId: string; countryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';
  const [renameModalOpened, setRenameModalOpened] = useState(false);

  const { data: dataset, isLoading: datasetLoading } = useQuery({
    queryKey: ['dataset', datasetId],
    queryFn: () => datasetsAPI.getDataset(datasetId!),
    enabled: !!datasetId,
  });

  const { data: userDatasets = [] } = useQuery({
    queryKey: ['userDatasets'],
    queryFn: () => userDatasetsAPI.listUserDatasets(),
  });

  const renameMutation = useMutation({
    mutationFn: async (name: string) => {
      const existing = userDatasets.find(ud => ud.dataset_id === datasetId);
      if (existing) {
        return userDatasetsAPI.updateUserDataset(existing.id, { custom_name: name });
      } else {
        return userDatasetsAPI.createUserDataset({
          user_id: userId,
          dataset_id: datasetId!,
          custom_name: name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userDatasets'] });
      setRenameModalOpened(false);
    },
  });

  if (!datasetId) {
    return (
      <Container>
        <Text>Invalid dataset ID</Text>
      </Container>
    );
  }

  if (datasetLoading) {
    return (
      <Container py="xl">
        <Center>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (!dataset) {
    return (
      <Container>
        <Text>Dataset not found</Text>
      </Container>
    );
  }

  const userDataset = userDatasets.find(ud => ud.dataset_id === datasetId);
  const displayName = userDataset?.custom_name || dataset.name || dataset.id;

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
              onClick={() => navigate(`/${countryId}/datasets`)}
            >
              Back to datasets
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
              <Badge variant="light" color="blue">
                {dataset.type}
              </Badge>
              <Text size="sm" c="dimmed">
                Created {moment(dataset.created_at).fromNow()}
              </Text>
            </Group>
          </Stack>

        <Divider />

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <div>
              <Text size="sm" fw={600} mb="xs">
                Dataset ID
              </Text>
              <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                {dataset.id}
              </Text>
            </div>

            {dataset.description && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Description
                </Text>
                <Text size="sm">{dataset.description}</Text>
              </div>
            )}

            <div>
              <Text size="sm" fw={600} mb="xs">
                Type
              </Text>
              <Text size="sm">{dataset.type}</Text>
            </div>

            {dataset.source && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Source
                </Text>
                <Text size="sm">{dataset.source}</Text>
              </div>
            )}

            <Divider />

            <Group gap="xs">
              <Text size="xs" c="dimmed">
                Created: {moment(dataset.created_at).format('MMMM D, YYYY h:mm A')}
              </Text>
              <Text size="xs" c="dimmed">
                •
              </Text>
              <Text size="xs" c="dimmed">
                Updated: {moment(dataset.updated_at).format('MMMM D, YYYY h:mm A')}
              </Text>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
    </>
  );
}
