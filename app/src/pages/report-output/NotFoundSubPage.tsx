import { IconAlertCircle } from '@tabler/icons-react';
import { Stack, Text, Title } from '@/components/ui';
import { colors, spacing } from '@/designTokens';

/**
 * 404 page for invalid sub-page routes
 */
export default function NotFoundSubPage() {
  return (
    <div
      className="tw:p-xl tw:text-center"
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        backgroundColor: colors.background.primary,
      }}
    >
      <Stack className="tw:gap-lg tw:items-center">
        <IconAlertCircle size={48} color={colors.gray[400]} />
        <Stack className="tw:gap-xs tw:items-center">
          <Title order={3} className="tw:font-semibold" style={{ color: colors.text.primary }}>
            Page not found
          </Title>
          <Text className="tw:text-gray-500 tw:text-sm">
            The sub-page you're looking for doesn't exist or hasn't been implemented yet.
          </Text>
        </Stack>
      </Stack>
    </div>
  );
}
