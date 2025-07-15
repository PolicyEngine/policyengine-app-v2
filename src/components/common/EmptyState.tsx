// components/common/EmptyState.tsx

import { Stack, Text, Button } from '@mantine/core';

interface EmptyStateProps {
  ingredient: string; // e.g., "Policy"
  onAction: () => void;
}

export default function EmptyState({ ingredient, onAction }: EmptyStateProps) {
  return (
    <Stack align="center" justify="center" p="xl">
      <Text size="lg" c="dimmed">
        No {ingredient} found.
      </Text>
      <Button onClick={onAction}>Create {ingredient}</Button>
    </Stack>
  );
}
