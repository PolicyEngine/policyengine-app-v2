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
  Table,
} from '@mantine/core';
import { IconChevronLeft, IconPencil } from '@tabler/icons-react';
import { apiClient } from '@/api/apiClient';
import { userDynamicsAPI } from '@/api/v2/userDynamics';
import { parametersAPI } from '@/api/parameters';
import { MOCK_USER_ID } from '@/constants';
import ReportRenameModal from '@/components/report/ReportRenameModal';
import { colors, spacing, typography } from '@/designTokens';
import moment from 'moment';

interface Dynamic {
  id: string;
  name: string;
  description?: string;
  type?: string;
  policy_id?: string;
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

  // If dynamic has a policy_id, fetch its parameter values
  const { data: parameterValues = [], isLoading: parametersLoading } = useQuery({
    queryKey: ['parameterValues', dynamic?.policy_id],
    queryFn: () => parametersAPI.getParametersForPolicy(dynamic!.policy_id!),
    enabled: !!dynamic?.policy_id,
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

            {dynamic.policy_id && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Associated policy
                </Text>
                <Text size="sm" style={{ fontFamily: 'monospace' }}>
                  {dynamic.policy_id}
                </Text>
              </div>
            )}

            <Divider />

            {dynamic.policy_id && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Parameter values ({parameterValues.length})
                </Text>
                {parametersLoading ? (
                  <Center p="md">
                    <Loader size="sm" />
                  </Center>
                ) : parameterValues.length === 0 ? (
                  <Text size="sm" c="dimmed">No parameter values defined</Text>
                ) : (
                  <Paper withBorder style={{ border: `1px solid ${colors.border.light}`, overflow: 'hidden' }}>
                    <Table>
                      <Table.Thead style={{ backgroundColor: colors.gray[50] }}>
                        <Table.Tr>
                          <Table.Th
                            style={{
                              fontSize: typography.fontSize.xs,
                              fontWeight: typography.fontWeight.medium,
                              color: colors.text.secondary,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              padding: `${spacing.md} ${spacing.lg}`,
                            }}
                          >
                            Parameter
                          </Table.Th>
                          <Table.Th
                            style={{
                              fontSize: typography.fontSize.xs,
                              fontWeight: typography.fontWeight.medium,
                              color: colors.text.secondary,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              padding: `${spacing.md} ${spacing.lg}`,
                            }}
                          >
                            Value
                          </Table.Th>
                          <Table.Th
                            style={{
                              fontSize: typography.fontSize.xs,
                              fontWeight: typography.fontWeight.medium,
                              color: colors.text.secondary,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              padding: `${spacing.md} ${spacing.lg}`,
                            }}
                          >
                            Period
                          </Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {parameterValues.map((pv) => (
                          <Table.Tr key={pv.id}>
                            <Table.Td style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                              <Text size="sm" style={{ fontFamily: typography.fontFamily.mono, color: colors.text.primary }}>
                                {pv.parameter_id}
                              </Text>
                            </Table.Td>
                            <Table.Td style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                              <Text size="sm" fw={500} style={{ color: colors.text.primary }}>
                                {JSON.stringify(pv.value)}
                              </Text>
                            </Table.Td>
                            <Table.Td style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                              <Text size="sm" c="dimmed">
                                {pv.start_date && pv.end_date
                                  ? `${pv.start_date} to ${pv.end_date}`
                                  : pv.start_date
                                  ? `From ${pv.start_date}`
                                  : 'All time'}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                )}
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