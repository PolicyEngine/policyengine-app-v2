import {
  IconAdjustments,
  IconFolder,
  IconGavel,
  IconMessageCircle,
  IconPlus,
} from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

/**
 * Horizontal navigation for the flagship shell. Four verbs don't earn a
 * 300px persistent sidebar — a slim tab bar keeps the content (especially
 * Ask, the front door) full-width and calm. The legacy sidebar remains
 * for the flag-off experience.
 */
export default function FlagshipTopNav() {
  const location = useAppLocation();
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();

  const items = [
    { label: 'Ask', icon: IconMessageCircle, path: `/${countryId}/ask` },
    { label: 'Tracker', icon: IconGavel, path: `/${countryId}/tracker` },
    { label: 'Build', icon: IconAdjustments, path: `/${countryId}/build` },
    { label: 'Library', icon: IconFolder, path: `/${countryId}/library` },
  ];

  return (
    <div
      style={{
        borderBottom: `1px solid ${colors.border.light}`,
        background: colors.background.primary,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: `0 ${spacing.lg}`,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          overflowX: 'auto',
        }}
      >
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => nav.push(item.path)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                padding: `${spacing.md} ${spacing.md}`,
                border: 'none',
                borderBottom: isActive
                  ? `2px solid ${colors.primary[500]}`
                  : '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.primary,
                fontWeight: isActive
                  ? typography.fontWeight.semibold
                  : typography.fontWeight.normal,
                color: isActive ? colors.primary[700] : colors.text.primary,
                whiteSpace: 'nowrap',
              }}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <Button size="sm" onClick={() => nav.push(`/${countryId}/build`)}>
          New reform
          <IconPlus size={14} />
        </Button>
      </div>
    </div>
  );
}
