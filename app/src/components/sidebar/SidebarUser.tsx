import { Avatar, Group, Text, UnstyledButton } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { MOCK_USER_ID } from '@/constants';

interface SidebarUserProps {
  name: string;
  initials: string;
}

export default function SidebarUser({ name, initials }: SidebarUserProps) {
  const navigate = useNavigate();
  const countryId = useCurrentCountry();
  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  const handleClick = () => {
    navigate(`/${countryId}/user/${userId}`);
  };

  return (
    <UnstyledButton
      onClick={handleClick}
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
        <Text
          size="sm"
          c={colors.gray[900]}
          fw={500}
          style={{
            fontSize: 14,
            lineHeight: '20px',
          }}
        >
          {name}
        </Text>
      </Group>
    </UnstyledButton>
  );
}
