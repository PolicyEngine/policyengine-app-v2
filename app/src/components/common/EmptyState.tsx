import { Stack, Text } from '@/components/ui';

interface EmptyStateProps {
  ingredient: string; // e.g., "Policy"
  // onAction: () => void;
}

export default function EmptyState({ ingredient }: EmptyStateProps) {
  return (
    <Stack className="tw:items-center tw:justify-center tw:p-xl">
      <Text size="lg" style={{ color: '#868e96' }}>
        No {ingredient.toLowerCase()} found.
      </Text>
    </Stack>
  );
}
