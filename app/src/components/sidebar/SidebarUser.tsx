import { Avatar, Group, Text } from '@mantine/core';
import { colors } from '../../designTokens';

interface SidebarUserProps {
  name: string;
  initials: string;
}

export default function SidebarUser({ name, initials }: SidebarUserProps) {
  return (
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
  );
}
