import { Stack, Text } from '@mantine/core';

interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
}

export default function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <Stack gap={4} px={8} py={8}>
      {title && (
        <Text
          size="xs"
          fw={500}
          px={12}
          pb={4}
          style={{
            fontSize: 12,
            lineHeight: '18px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          {title}
        </Text>
      )}
      <Stack gap={2}>{children}</Stack>
    </Stack>
  );
}
