import { useEffect, useState } from 'react';
import { IconAdjustments, IconDotsVertical, IconFilePencil, IconGavel } from '@tabler/icons-react';
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
import { useDraftReform } from '@/libs/draftReform';
import FlagshipBrand from './FlagshipBrand';

const NAV_ITEMS = [
  { slug: 'build', label: 'Build', icon: IconAdjustments },
  { slug: 'reforms', label: 'Reforms', icon: IconGavel },
];

/** Height of the bar. */
const FLAGSHIP_TOP_BAR_HEIGHT = 56;

/**
 * The flagship shell's navigation: brand, the two sections, and the
 * website links, in one slim bar across the top. Two destinations do
 * not earn a sidebar's width, and they fit a phone's bar as they are,
 * so there is no drawer to open on any viewport.
 */
export default function FlagshipTopBar() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const location = useAppLocation();

  // Warm the section routes so the first click on each is instant.
  useEffect(() => {
    NAV_ITEMS.forEach(({ slug }) => nav.prefetch?.(`/${countryId}/${slug}`));
  }, [nav, countryId]);

  // Highlight the clicked item immediately — router navigation can take
  // a beat (route compile in dev, RSC fetch in prod) and the bar should
  // not look unresponsive while it lands.
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  useEffect(() => {
    setPendingSlug(null);
  }, [location.pathname]);

  // Away from Build, an unfinished draft stays one click away.
  const draft = useDraftReform();
  const draftCount =
    draft && draft.countryId === countryId && !location.pathname.includes('/build')
      ? draft.provisions.length
      : 0;

  const moreLinks = [
    { label: 'Research', href: `${WEBSITE_URL}/${countryId}/research` },
    { label: 'Model documentation', href: `${WEBSITE_URL}/${countryId}/model` },
    { label: 'API', href: `${WEBSITE_URL}/${countryId}/api` },
    { label: 'About', href: `${WEBSITE_URL}/${countryId}/team` },
    { label: 'Donate', href: `${WEBSITE_URL}/${countryId}/donate` },
    { label: 'GitHub', href: 'https://github.com/PolicyEngine' },
  ];

  return (
    <header
      className="tw:flex tw:shrink-0 tw:items-center tw:border-b tw:border-border-light tw:bg-white"
      style={{
        height: FLAGSHIP_TOP_BAR_HEIGHT,
        gap: spacing.lg,
        padding: `0 ${spacing.lg}`,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <FlagshipBrand style={{ padding: 0, flexShrink: 0 }} />

      <nav aria-label="Primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {NAV_ITEMS.map(({ slug, label, icon: Icon }) => {
          const active = pendingSlug
            ? pendingSlug === slug
            : location.pathname.includes(`/${slug}`);
          return (
            <button
              key={slug}
              type="button"
              onClick={() => {
                setPendingSlug(slug);
                nav.push(`/${countryId}/${slug}`);
              }}
              aria-current={active ? 'page' : undefined}
              className={
                active ? undefined : 'tw:cursor-pointer tw:hover:bg-gray-100 tw:text-gray-700'
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                height: 34,
                padding: `0 ${spacing.md}`,
                border: 'none',
                borderRadius: spacing.radius.container,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.primary,
                fontWeight: active ? typography.fontWeight.semibold : typography.fontWeight.medium,
                // Inactive items leave background and color to their classes,
                // so the hover can show.
                ...(active && { background: colors.primary[50], color: colors.primary[700] }),
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {label}
            </button>
          );
        })}
      </nav>

      {draftCount > 0 && (
        <button
          type="button"
          onClick={() => nav.push(`/${countryId}/build`)}
          className="tw:cursor-pointer tw:hover:bg-primary-100"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            height: 30,
            marginLeft: 'auto',
            padding: `0 ${spacing.md}`,
            border: 'none',
            borderRadius: 999,
            background: colors.primary[50],
            color: colors.primary[700],
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            fontFamily: typography.fontFamily.primary,
          }}
        >
          <IconFilePencil size={15} aria-hidden />
          Draft · {draftCount} parameter{draftCount === 1 ? '' : 's'}
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="More PolicyEngine links"
            className="tw:cursor-pointer tw:text-gray-700 tw:hover:bg-gray-100"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              height: 34,
              marginLeft: draftCount > 0 ? undefined : 'auto',
              padding: `0 ${spacing.sm}`,
              border: 'none',
              borderRadius: spacing.radius.container,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            <IconDotsVertical size={16} />
            <span className="tw:hidden tw:sm:inline">More</span>
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
    </header>
  );
}
