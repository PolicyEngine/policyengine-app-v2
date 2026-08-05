import {
  IconAdjustments,
  IconDotsVertical,
  IconFolder,
  IconGavel,
  IconMessageCircle,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getReformStore } from '@/api/reformStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Stack,
  Text,
} from '@/components/ui';
import { MOCK_USER_ID, WEBSITE_URL } from '@/constants';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const PolicyEngineLogo = '/assets/logos/policyengine/teal.svg';

const NAV_ITEMS = [
  { slug: 'ask', label: 'Ask', icon: IconMessageCircle },
  { slug: 'tracker', label: 'Tracker', icon: IconGavel },
  { slug: 'build', label: 'Build', icon: IconAdjustments },
  { slug: 'library', label: 'Library', icon: IconFolder },
];

/**
 * The flagship shell's persistent left sidebar: brand, the entry
 * points, recent reforms, and the website links. Replaces both the
 * header nav and the Home launcher page — Ask is the landing view.
 */
export default function FlagshipSidebar() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const location = useAppLocation();

  const { data: reforms } = useQuery({
    queryKey: ['reforms', MOCK_USER_ID, countryId],
    queryFn: () => getReformStore().findByUser(MOCK_USER_ID, countryId),
  });
  const recent = (reforms ?? []).slice(0, 5);

  const moreLinks = [
    { label: 'Research', href: `${WEBSITE_URL}/${countryId}/research` },
    { label: 'Model documentation', href: `${WEBSITE_URL}/${countryId}/model` },
    { label: 'API', href: `${WEBSITE_URL}/${countryId}/api` },
    { label: 'About', href: `${WEBSITE_URL}/${countryId}/team` },
    { label: 'Donate', href: `${WEBSITE_URL}/${countryId}/donate` },
    { label: 'GitHub', href: 'https://github.com/PolicyEngine' },
  ];

  return (
    <Stack
      style={{
        width: 220,
        flexShrink: 0,
        height: '100%',
        gap: 0,
        background: colors.gray[50],
        borderRight: `1px solid ${colors.border.light}`,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <button
        type="button"
        onClick={() => nav.push(`/${countryId}/ask`)}
        aria-label="PolicyEngine"
        style={{
          display: 'flex',
          alignItems: 'center',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: `${spacing.lg} ${spacing.lg} ${spacing.md}`,
        }}
      >
        <img src={PolicyEngineLogo} alt="PolicyEngine" style={{ height: 22, width: 'auto' }} />
      </button>

      <Stack style={{ gap: 2, padding: `0 ${spacing.sm}` }} aria-label="Primary">
        {NAV_ITEMS.map(({ slug, label, icon: Icon }) => {
          const active = location.pathname.includes(`/${slug}`);
          return (
            <button
              key={slug}
              type="button"
              onClick={() => nav.push(`/${countryId}/${slug}`)}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.sm} ${spacing.md}`,
                border: 'none',
                borderRadius: 8,
                background: active ? colors.primary[50] : 'transparent',
                color: active ? colors.primary[700] : colors.text.primary,
                fontWeight: active ? typography.fontWeight.semibold : typography.fontWeight.normal,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.primary,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {label}
            </button>
          );
        })}
      </Stack>

      {recent.length > 0 && (
        <Stack style={{ gap: 2, padding: `${spacing.lg} ${spacing.sm} 0`, minHeight: 0 }}>
          <Text
            style={{
              fontSize: typography.fontSize.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.semibold,
              padding: `0 ${spacing.md} ${spacing.xs}`,
            }}
          >
            Recent
          </Text>
          {recent.map((reform) => (
            <button
              key={reform.id}
              type="button"
              onClick={() => nav.push(`/${countryId}/library`)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: `${spacing.xs} ${spacing.md}`,
                borderRadius: 8,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.primary,
                color: colors.text.secondary,
                cursor: 'pointer',
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
              }}
            >
              {reform.label || 'Untitled reform'}
            </button>
          ))}
        </Stack>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ padding: spacing.md }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More PolicyEngine links"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.xs} ${spacing.sm}`,
                border: 'none',
                borderRadius: 8,
                background: 'none',
                color: colors.text.secondary,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.primary,
                cursor: 'pointer',
              }}
            >
              <IconDotsVertical size={16} />
              More
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
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
    </Stack>
  );
}
