import { useState } from 'react';
import { Avatar, Group, Text, UnstyledButton, Menu, ActionIcon } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconChevronRight, IconLogout, IconUserPlus } from '@tabler/icons-react';
import { colors } from '../../designTokens';
import { useAuth } from '@/contexts/AuthContext';
import { usersAPI } from '@/api/v2/users';
import ConvertAnonymousModal from '@/components/auth/ConvertAnonymousModal';

interface SidebarUserProps {
  name: string;
  initials: string;
}

export default function SidebarUser({ name, initials }: SidebarUserProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: authUser, signOut } = useAuth();
  const [convertModalOpened, setConvertModalOpened] = useState(false);
  const userId = authUser?.id || 'anonymous';

  const { data: user } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => usersAPI.getUser(userId),
  });

  const updateModelMutation = useMutation({
    mutationFn: (model_id: string) => usersAPI.updateUser(userId, { current_model_id: model_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
    },
  });

  const handleClick = () => {
    navigate(`/user/${userId}`);
  };

  const currentModelName = user?.current_model_id === 'policyengine_us' ? 'United States' : 'United Kingdom';
  const displayName = authUser?.is_anonymous ? 'Anonymous user' : authUser?.email || name;

  return (
    <>
      <ConvertAnonymousModal
        opened={convertModalOpened}
        onClose={() => setConvertModalOpened(false)}
      />
      <Menu position="top-start" offset={8}>
      <Menu.Target>
        <UnstyledButton
          style={{
            width: '100%',
            borderRadius: 8,
            padding: '8px',
            transition: 'background-color 0.2s',
          }}
          styles={{
            root: {
              '&:hover': {
                backgroundColor: colors.gray[50],
              },
            },
          }}
        >
          <Group gap={12} justify="space-between">
            <Group gap={12}>
              <Avatar
                size={32}
                radius="xl"
                bg={colors.gray[100]}
                c={colors.gray[700]}
                styles={{
                  root: {
                    fontSize: 12,
                    fontWeight: 600,
                  },
                }}
              >
                {initials}
              </Avatar>
              <div>
                <Text
                  size="sm"
                  c={colors.gray[900]}
                  fw={500}
                  style={{
                    fontSize: 14,
                    lineHeight: '20px',
                  }}
                >
                  {displayName}
                </Text>
                <Text
                  size="xs"
                  c={colors.gray[500]}
                  style={{
                    fontSize: 12,
                    lineHeight: '16px',
                  }}
                >
                  {currentModelName}
                </Text>
              </div>
            </Group>
            <IconChevronRight size={16} color={colors.gray[400]} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Country model</Menu.Label>
        <Menu.Item
          onClick={() => updateModelMutation.mutate('policyengine_uk')}
          style={{
            fontWeight: user?.current_model_id === 'policyengine_uk' ? 600 : 400,
          }}
        >
          United Kingdom
        </Menu.Item>
        <Menu.Item
          onClick={() => updateModelMutation.mutate('policyengine_us')}
          style={{
            fontWeight: user?.current_model_id === 'policyengine_us' ? 600 : 400,
          }}
        >
          United States
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={handleClick}>
          View profile
        </Menu.Item>
        {authUser?.is_anonymous && (
          <Menu.Item
            leftSection={<IconUserPlus size={16} />}
            onClick={() => setConvertModalOpened(true)}
          >
            Create account
          </Menu.Item>
        )}
        <Menu.Item
          leftSection={<IconLogout size={16} />}
          onClick={() => signOut()}
          color="red"
        >
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
    </>
  );
}
