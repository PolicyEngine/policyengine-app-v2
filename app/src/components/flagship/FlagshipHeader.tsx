import {
  IconAdjustments,
  IconDotsVertical,
  IconFolder,
  IconGavel,
  IconMessageCircle,
  IconPlus,
} from '@tabler/icons-react';
import HeaderLogo from '@/components/homeHeader/HeaderLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { WEBSITE_URL } from '@/constants';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

/**
 * Single-row header for the flagship shell: brand, the four entry
 * points, and the primary action — replacing the stacked website
 * header + banner + tab bar. Website destinations live in the trailing
 * "more" menu instead of competing with app navigation.
 */
export default function FlagshipHeader() {
  const location = useAppLocation();
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();

  const items = [
    { label: 'Ask', icon: IconMessageCircle, path: `/${countryId}/ask` },
    { label: 'Tracker', icon: IconGavel, path: `/${countryId}/tracker` },
    { label: 'Build', icon: IconAdjustments, path: `/${countryId}/build` },
    { label: 'Library', icon: IconFolder, path: `/${countryId}/library` },
  ];

  const moreLinks = [
    { label: 'Research', href: `${WEBSITE_URL}/${countryId}/research` },
    { label: 'Model documentation', href: `${WEBSITE_URL}/${countryId}/model` },
    { label: 'API', href: `${WEBSITE_URL}/${countryId}/api` },
    { label: 'About', href: `${WEBSITE_URL}/${countryId}/team` },
    { label: 'Donate', href: `${WEBSITE_URL}/${countryId}/donate` },
    { label: 'GitHub', href: 'https://github.com/PolicyEngine' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: spacing.md,
        padding: `0 ${spacing.xl}`,
        height: spacing.layout.header,
        background: `linear-gradient(to right, ${colors.primary[800]}, ${colors.primary[600]})`,
        borderBottom: `0.5px solid ${colors.primary[700]}`,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <HeaderLogo />
      </div>

      <nav
        aria-label="Primary"
        style={{
          display: 'flex',
          alignItems: 'stretch',
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
                padding: `0 ${spacing.md}`,
                border: 'none',
                borderBottom: isActive ? '2px solid #FFFFFF' : '2px solid transparent',
                borderTop: '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.primary,
                fontWeight: isActive
                  ? typography.fontWeight.semibold
                  : typography.fontWeight.normal,
                color: isActive ? '#FFFFFF' : colors.primary[50],
                whiteSpace: 'nowrap',
              }}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <button
          type="button"
          onClick={() => nav.push(`/${countryId}/build`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            padding: `${spacing.xs} ${spacing.md}`,
            border: 'none',
            borderRadius: 6,
            background: '#FFFFFF',
            color: colors.primary[700],
            cursor: 'pointer',
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.medium,
            whiteSpace: 'nowrap',
          }}
        >
          New reform
          <IconPlus size={14} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More PolicyEngine links"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: spacing.xs,
                border: 'none',
                borderRadius: 6,
                background: 'none',
                color: colors.primary[50],
                cursor: 'pointer',
              }}
            >
              <IconDotsVertical size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {moreLinks.map((link) => (
              <DropdownMenuItem key={link.href} asChild>
                <a href={link.href} style={{ cursor: 'pointer' }}>
                  {link.label}
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
