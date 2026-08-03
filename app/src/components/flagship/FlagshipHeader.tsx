import { IconDotsVertical } from '@tabler/icons-react';
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

const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

const SECTION_LABELS: Record<string, string> = {
  ask: 'Ask',
  tracker: 'Tracker',
  build: 'Build',
  library: 'Library',
};

/**
 * Minimal header for the flagship shell: brand (→ home) and a compact
 * menu of website links. Navigation lives on the Home launcher, not in
 * persistent chrome; a small section label keeps you oriented.
 */
export default function FlagshipHeader() {
  const location = useAppLocation();
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();

  const section = location.pathname.split('/')[2];
  const sectionLabel = section ? SECTION_LABELS[section] : undefined;

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
        alignItems: 'center',
        gap: spacing.md,
        padding: `0 ${spacing.xl}`,
        height: spacing.layout.header,
        background: `linear-gradient(to right, ${colors.primary[800]}, ${colors.primary[600]})`,
        borderBottom: `0.5px solid ${colors.primary[700]}`,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <button
        type="button"
        onClick={() => nav.push(`/${countryId}`)}
        aria-label="PolicyEngine home"
        style={{
          display: 'flex',
          alignItems: 'center',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <img src={PolicyEngineLogo} alt="PolicyEngine" style={{ height: 24, width: 'auto' }} />
      </button>

      {sectionLabel && (
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.primary[50],
            borderLeft: `1px solid ${colors.primary[500]}`,
            paddingLeft: spacing.md,
          }}
        >
          {sectionLabel}
        </span>
      )}

      <div style={{ flex: 1 }} />

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
  );
}
