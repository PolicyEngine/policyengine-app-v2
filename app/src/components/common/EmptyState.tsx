import { Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens';

interface EmptyStateProps {
  ingredient: string; // e.g., "Policy"
  // onAction: () => void;
}

export default function EmptyState({ ingredient }: EmptyStateProps) {
  return (
    <Stack className="tw:items-center tw:justify-center tw:p-xl">
      <Text size="lg" style={{ color: colors.gray[600] }}>
        No {ingredient.toLowerCase()} found.
      </Text>
    </Stack>
  );
}
