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
  Loader,
  Center,
  ActionIcon,
  TextInput,
} from '@mantine/core';
import { IconChevronLeft, IconPencil, IconCheck, IconX } from '@tabler/icons-react';
import { usersAPI } from '@/api/v2/users';
import moment from 'moment';

export default function UserDetailPage() {
  const { userId, countryId } = useParams<{ userId: string; countryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersAPI.getUser(userId!),
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      return usersAPI.updateUser(userId!, {
        first_name: firstName,
        last_name: lastName,
        email: email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      setEditMode(false);
    },
  });

  if (!userId) {
    return (
      <Container>
        <Text>Invalid user ID</Text>
      </Container>
    );
  }

  if (userLoading) {
    return (
      <Container py="xl">
        <Center>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container>
        <Text>User not found</Text>
      </Container>
    );
  }

  const handleEdit = () => {
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setEmail(user.email || '');
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleSave = () => {
    updateMutation.mutate();
  };

  const displayName = usersAPI.getDisplayName(user);

  return (
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
            {!editMode && (
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={handleEdit}
              >
                <IconPencil size={18} />
              </ActionIcon>
            )}
          </Group>
          <Text size="sm" c="dimmed">
            @{user.username}
          </Text>
        </Stack>

        <Divider />

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <div>
              <Text size="sm" fw={600} mb="xs">
                User ID
              </Text>
              <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                {user.id}
              </Text>
            </div>

            <div>
              <Text size="sm" fw={600} mb="xs">
                Username
              </Text>
              <Text size="sm">{user.username}</Text>
            </div>

            {editMode ? (
              <>
                <div>
                  <Text size="sm" fw={600} mb="xs">
                    First name
                  </Text>
                  <TextInput
                    value={firstName}
                    onChange={(e) => setFirstName(e.currentTarget.value)}
                    placeholder="First name"
                  />
                </div>

                <div>
                  <Text size="sm" fw={600} mb="xs">
                    Last name
                  </Text>
                  <TextInput
                    value={lastName}
                    onChange={(e) => setLastName(e.currentTarget.value)}
                    placeholder="Last name"
                  />
                </div>

                <div>
                  <Text size="sm" fw={600} mb="xs">
                    Email
                  </Text>
                  <TextInput
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    placeholder="Email"
                    type="email"
                  />
                </div>

                <Group gap="sm">
                  <Button
                    leftSection={<IconCheck size={16} />}
                    onClick={handleSave}
                    loading={updateMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    leftSection={<IconX size={16} />}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </Group>
              </>
            ) : (
              <>
                {user.first_name && (
                  <div>
                    <Text size="sm" fw={600} mb="xs">
                      First name
                    </Text>
                    <Text size="sm">{user.first_name}</Text>
                  </div>
                )}

                {user.last_name && (
                  <div>
                    <Text size="sm" fw={600} mb="xs">
                      Last name
                    </Text>
                    <Text size="sm">{user.last_name}</Text>
                  </div>
                )}

                {user.email && (
                  <div>
                    <Text size="sm" fw={600} mb="xs">
                      Email
                    </Text>
                    <Text size="sm">{user.email}</Text>
                  </div>
                )}
              </>
            )}

            <Divider />

            <Group gap="xs">
              <Text size="xs" c="dimmed">
                Created: {moment(user.created_at).format('MMMM D, YYYY h:mm A')}
              </Text>
              <Text size="xs" c="dimmed">
                •
              </Text>
              <Text size="xs" c="dimmed">
                Updated: {moment(user.updated_at).format('MMMM D, YYYY h:mm A')}
              </Text>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
