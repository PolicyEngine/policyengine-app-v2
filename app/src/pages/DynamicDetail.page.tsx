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
import { apiClient } from '@/api/apiClient';
import { userDynamicsAPI } from '@/api/v2/userDynamics';
import { MOCK_USER_ID } from '@/constants';
import ReportRenameModal from '@/components/report/ReportRenameModal';
import moment from 'moment';

interface Dynamic {
  id: string;
  name: string;
  description?: string;
  type?: string;
  parameters?: any;
  created_at: string;
  updated_at: string;
}

export default function DynamicDetailPage() {
  const { dynamicId, countryId } = useParams<{ dynamicId: string; countryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';
  const [renameModalOpened, setRenameModalOpened] = useState(false);

  const { data: dynamic, isLoading: dynamicLoading } = useQuery({
    queryKey: ['dynamic', dynamicId],
    queryFn: () => apiClient.get<Dynamic>(`/dynamics/${dynamicId}`),
    enabled: !!dynamicId,
  });

  const { data: userDynamics = [] } = useQuery({
    queryKey: ['userDynamics', userId],
    queryFn: () => userDynamicsAPI.list(userId),
  });

  const renameMutation = useMutation({
    mutationFn: async (name: string) => {
      const existing = userDynamics.find(ud => ud.dynamic_id === dynamicId);
      if (existing) {
        return userDynamicsAPI.update(existing.id, { custom_name: name });
      } else {
        return userDynamicsAPI.create({
          user_id: userId,
          dynamic_id: dynamicId!,
          custom_name: name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userDynamics', userId] });
      setRenameModalOpened(false);
    },
  });

  if (!dynamicId) {
    return (
      <Container>
        <Text>Invalid dynamic ID</Text>
      </Container>
    );
  }

  if (dynamicLoading) {
    return (
      <Container py="xl">
        <Center>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (!dynamic) {
    return (
      <Container>
        <Text>Dynamic not found</Text>
      </Container>
    );
  }

  const userDyn = userDynamics.find(ud => ud.dynamic_id === dynamicId);
  const displayName = userDyn?.custom_name || dynamic.name;

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
              onClick={() => navigate(`/${countryId}/dynamics`)}
            >
              Back to dynamics
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
              {dynamic.type && <Badge variant="light">{dynamic.type}</Badge>}
              <Text size="sm" c="dimmed">
                Created {moment(dynamic.created_at).fromNow()}
              </Text>
            </Group>
          </Stack>

        <Divider />

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <div>
              <Text size="sm" fw={600} mb="xs">
                Dynamic ID
              </Text>
              <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                {dynamic.id}
              </Text>
            </div>

            <div>
              <Text size="sm" fw={600} mb="xs">
                Name
              </Text>
              <Text size="sm">{dynamic.name}</Text>
            </div>

            {dynamic.description && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Description
                </Text>
                <Text size="sm">{dynamic.description}</Text>
              </div>
            )}

            {dynamic.type && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Type
                </Text>
                <Text size="sm">{dynamic.type}</Text>
              </div>
            )}

            {dynamic.parameters && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Parameters
                </Text>
                <Paper p="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                  <Text size="xs" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(dynamic.parameters, null, 2)}
                  </Text>
                </Paper>
              </div>
            )}

            <Divider />

            <Group gap="xs">
              <Text size="xs" c="dimmed">
                Created: {moment(dynamic.created_at).format('MMMM D, YYYY h:mm A')}
              </Text>
              <Text size="xs" c="dimmed">
                •
              </Text>
              <Text size="xs" c="dimmed">
                Updated: {moment(dynamic.updated_at).format('MMMM D, YYYY h:mm A')}
              </Text>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
    </>
  );
}