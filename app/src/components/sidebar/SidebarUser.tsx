import { Avatar, Group, Text } from '@mantine/core';

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
        bg="#F2F4F7"
        c="#344054"
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
        c="#101828"
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
