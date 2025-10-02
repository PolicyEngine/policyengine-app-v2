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
import { policiesAPI } from '@/api/v2/policies';
import { userPoliciesAPI } from '@/api/v2/userPolicies';
import { parametersAPI } from '@/api/parameters';
import { MOCK_USER_ID } from '@/constants';
import ReportRenameModal from '@/components/report/ReportRenameModal';
import { colors, spacing, typography } from '@/designTokens';
import moment from 'moment';

export default function PolicyDetailPage() {
  const { policyId, countryId } = useParams<{ policyId: string; countryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';
  const [renameModalOpened, setRenameModalOpened] = useState(false);

  const { data: policy, isLoading: policyLoading } = useQuery({
    queryKey: ['policy', policyId],
    queryFn: () => policiesAPI.get(policyId!),
    enabled: !!policyId,
  });

  const { data: userPolicies = [] } = useQuery({
    queryKey: ['userPolicies', userId],
    queryFn: () => userPoliciesAPI.list(userId),
  });

  const { data: parameterValues = [], isLoading: parametersLoading } = useQuery({
    queryKey: ['parameterValues', policyId],
    queryFn: () => parametersAPI.getParametersForPolicy(policyId!),
    enabled: !!policyId,
  });

  const renameMutation = useMutation({
    mutationFn: async (name: string) => {
      const existing = userPolicies.find(up => up.policy_id === policyId);
      if (existing) {
        return userPoliciesAPI.update(existing.id, { custom_name: name });
      } else {
        return userPoliciesAPI.create({
          user_id: userId,
          policy_id: policyId!,
          custom_name: name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPolicies', userId] });
      setRenameModalOpened(false);
    },
  });

  if (!policyId) {
    return (
      <Container>
        <Text>Invalid policy ID</Text>
      </Container>
    );
  }

  if (policyLoading) {
    return (
      <Container py="xl">
        <Center>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (!policy) {
    return (
      <Container>
        <Text>Policy not found</Text>
      </Container>
    );
  }

  const userPolicy = userPolicies.find(up => up.policy_id === policyId);
  const displayName = userPolicy?.custom_name || policy.name || `Policy #${policy.id}`;

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
              onClick={() => navigate(`/${countryId}/policies`)}
            >
              Back to policies
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
              <Text size="sm" c="dimmed">
                Created {moment(policy.created_at).fromNow()}
              </Text>
            </Group>
          </Stack>

        <Divider />

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <div>
              <Text size="sm" fw={600} mb="xs">
                Policy ID
              </Text>
              <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                {policy.id}
              </Text>
            </div>

            <div>
              <Text size="sm" fw={600} mb="xs">
                Name
              </Text>
              <Text size="sm">{policy.name || 'Untitled policy'}</Text>
            </div>

            {policy.description && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Description
                </Text>
                <Text size="sm">{policy.description}</Text>
              </div>
            )}

            <Divider />

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

            <Divider />

            <Group gap="xs">
              <Text size="xs" c="dimmed">
                Created: {moment(policy.created_at).format('MMMM D, YYYY h:mm A')}
              </Text>
              <Text size="xs" c="dimmed">
                •
              </Text>
              <Text size="xs" c="dimmed">
                Updated: {moment(policy.updated_at).format('MMMM D, YYYY h:mm A')}
              </Text>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
    </>
  );
}