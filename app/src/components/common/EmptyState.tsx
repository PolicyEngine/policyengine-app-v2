import { Box, Stack, Text } from '@mantine/core';

interface EmptyStateProps {
  ingredient: string; // e.g., "Policy"
  // onAction: () => void;
}

export default function EmptyState({ ingredient }: EmptyStateProps) {
  return (
    <Stack align="center" justify="center" p="xl">
      <Box
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(79, 209, 197, 0.1) 0%, rgba(79, 209, 197, 0.05) 100%)',
          border: '1px solid rgba(79, 209, 197, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Text size="xl" style={{ color: '#4FD1C5' }}>
          ?
        </Text>
      </Box>
      <Text size="lg" style={{ color: 'rgba(13, 43, 42, 0.5)' }}>
        No {ingredient.toLowerCase()} found.
      </Text>
    </Stack>
  );
}
