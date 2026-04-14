import type { CSSProperties } from 'react';
import { IconChevronLeft } from '@tabler/icons-react';
import { Group, Text } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

interface BackBreadcrumbProps {
  backPath?: string;
  backLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export function BackBreadcrumb({
  backPath,
  backLabel,
  className = 'tw:gap-xs tw:items-center tw:cursor-pointer',
  style,
}: BackBreadcrumbProps) {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();

  return (
    <Group
      className={className}
      style={style}
      onClick={() => nav.push(backPath || `/${countryId}/reports`)}
    >
      <IconChevronLeft size={14} color={colors.text.secondary} />
      <Text className="tw:text-sm" style={{ color: colors.text.secondary }}>
        {backLabel ? `Back to ${backLabel}` : 'Back to reports'}
      </Text>
    </Group>
  );
}
