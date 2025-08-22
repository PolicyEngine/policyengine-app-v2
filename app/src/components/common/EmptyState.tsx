import { Stack, Text } from '@mantine/core';

interface EmptyStateProps {
  ingredient: string; // e.g., "Policy"
  // onAction: () => void;
}

export default function EmptyState({ ingredient }: EmptyStateProps) {
  return (
    <Stack align="center" justify="center" p="xl">
      <Text size="lg" c="dimmed">
        No {ingredient} found.
        {/* <br/>Please create {ingredient} to get started. */}
      </Text>
      {/* <Button onClick={onAction}>Create {ingredient}</Button> */}
    </Stack>
  );
}
