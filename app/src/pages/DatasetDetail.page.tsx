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
import AddToLibraryButton from '@/components/common/AddToLibraryButton';
import { timeAgo, formatDateTime } from '@/utils/datetime';

export default function DatasetDetailPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
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
    queryKey: ['userDatasets', userId],
    queryFn: () => userDatasetsAPI.listUserDatasets(userId),
  });

  const renameMutation = useMutation({
    mutationFn: async (name: string) => {
      const existing = userDatasets.find(ud => ud.dataset_id === datasetId);
      if (existing) {
        return userDatasetsAPI.updateUserDataset(userId, datasetId!, { custom_name: name });
      } else {
        return userDatasetsAPI.createUserDataset(userId, {
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
        <Text>Invalid population ID</Text>
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
        <Text>Population not found</Text>
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
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </Group>

          <Stack gap="md">
            <Group gap="sm" justify="space-between">
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
              <AddToLibraryButton
                resourceType="dataset"
                resourceId={datasetId}
                userId={userId}
                isInLibrary={!!userDataset}
                userResourceId={userDataset?.id}
              />
            </Group>
            <Group gap="xs">
              <Badge variant="light" color="blue">
                {dataset.type}
              </Badge>
              <Text size="sm" c="dimmed">
                Created {timeAgo(dataset.created_at)}
              </Text>
            </Group>
          </Stack>

        <Divider />

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <div>
              <Text size="sm" fw={600} mb="xs">
                Population ID
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
                Created: {formatDateTime(dataset.created_at)}
              </Text>
              <Text size="xs" c="dimmed">
                •
              </Text>
              <Text size="xs" c="dimmed">
                Updated: {formatDateTime(dataset.updated_at)}
              </Text>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
    </>
  );
}
