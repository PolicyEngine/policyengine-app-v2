import { useState } from 'react';
import {
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconInfoCircle,
  IconPlus,
  IconSearch,
  IconWorld,
  IconX,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

// Color tokens to display
const colorTokens = [
  { name: 'primary.500', value: colors.primary[500], label: 'Primary (Teal)' },
  { name: 'primary.600', value: colors.primary[600], label: 'Primary dark' },
  { name: 'primary.400', value: colors.primary[400], label: 'Primary light' },
  { name: 'primary.100', value: colors.primary[100], label: 'Primary subtle' },
  { name: 'secondary.700', value: colors.secondary[700], label: 'Gray' },
  { name: 'secondary.500', value: colors.secondary[500], label: 'Gray medium' },
  { name: 'secondary.300', value: colors.secondary[300], label: 'Gray light' },
  { name: 'success', value: colors.success, label: 'Success' },
  { name: 'warning', value: colors.warning, label: 'Warning' },
  { name: 'error', value: colors.error, label: 'Error' },
  { name: 'info', value: colors.info, label: 'Info' },
  { name: 'white', value: colors.white, label: 'White' },
];

const spacingTokens = [
  { name: 'xs', value: spacing.xs },
  { name: 'sm', value: spacing.sm },
  { name: 'md', value: spacing.md },
  { name: 'lg', value: spacing.lg },
  { name: 'xl', value: spacing.xl },
  { name: '2xl', value: spacing['2xl'] },
  { name: '3xl', value: spacing['3xl'] },
  { name: '4xl', value: spacing['4xl'] },
];

const radiusTokens = [
  { name: 'none', value: spacing.radius.none },
  { name: 'chip', value: spacing.radius.chip },
  { name: 'element', value: spacing.radius.element },
  { name: 'container', value: spacing.radius.container },
  { name: 'feature', value: spacing.radius.feature },
];

function ColorSwatch({ value, label }: { name: string; value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const isLight = value === colors.white || value === colors.primary[100];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          className="tw:bg-transparent tw:border tw:border-border-light tw:rounded-container tw:overflow-hidden tw:cursor-pointer tw:p-0 tw:transition-all tw:duration-150 tw:hover:-translate-y-0.5 tw:hover:shadow-md"
        >
          <div
            className="tw:h-20"
            style={{
              background: value,
              borderBottom: isLight ? `1px solid ${colors.border.light}` : 'none',
            }}
          />
          <div className="tw:p-md tw:text-left">
            <p className="tw:font-mono tw:text-sm tw:text-text-primary tw:mb-xs">{label}</p>
            <p className="tw:font-mono tw:text-xs tw:text-text-tertiary">{value}</p>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied!' : 'Click to copy'}</TooltipContent>
    </Tooltip>
  );
}

function SectionTitle({ children, badge }: { children: string; badge?: string }) {
  return (
    <div className="tw:flex tw:items-center tw:gap-md tw:mb-xl">
      <h2 className="tw:text-2xl tw:font-semibold tw:font-sans tw:text-text-primary">{children}</h2>
      {badge && (
        <span className="tw:text-xs tw:font-mono tw:px-sm tw:py-xs tw:bg-primary-100 tw:text-primary-600 tw:rounded-container tw:uppercase tw:tracking-wide">
          {badge}
        </span>
      )}
    </div>
  );
}

export default function BrandDesignPage() {
  return (
    <StaticPageLayout title="Design system">
      {/* Hero */}
      <div
        className="tw:py-4xl tw:border-b tw:border-border-dark"
        style={{
          backgroundColor: '#F7FEFE',
          paddingLeft: '6.125%',
          paddingRight: '6.125%',
        }}
      >
        <p className="tw:text-sm tw:text-text-secondary tw:mb-md">
          <Link to="../brand" className="tw:text-primary-500 tw:no-underline tw:hover:underline">
            Brand
          </Link>
          {' / '}
          Design
        </p>
        <h1 className="tw:text-4xl tw:font-semibold tw:font-sans tw:text-text-primary tw:mb-md">
          Design system
        </h1>
        <p className="tw:text-lg tw:text-text-secondary tw:max-w-[600px]">
          Tokens, typography, and spacing for building consistent PolicyEngine interfaces.
        </p>
      </div>

      {/* Content */}
      <div
        className="tw:py-4xl tw:max-w-[1200px]"
        style={{ paddingLeft: '6.125%', paddingRight: '6.125%' }}
      >
        {/* Colors */}
        <div className="tw:mb-4xl">
          <SectionTitle badge={`${colorTokens.length} tokens`}>Colors</SectionTitle>
          <div className="tw:grid tw:grid-cols-2 sm:tw:grid-cols-3 md:tw:grid-cols-4 lg:tw:grid-cols-6 tw:gap-md">
            {colorTokens.map((color) => (
              <ColorSwatch key={color.name} {...color} />
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="tw:mb-4xl">
          <SectionTitle>Typography</SectionTitle>
          <div className="tw:bg-white tw:border tw:border-border-light tw:rounded-container tw:overflow-hidden">
            {[
              {
                label: 'Primary',
                font: typography.fontFamily.primary,
                sample: 'Inter \u2014 The quick brown fox jumps over the lazy dog.',
              },
              {
                label: 'Mono',
                font: typography.fontFamily.mono,
                sample: 'JetBrains Mono \u2014 const x = fn(args);',
              },
            ].map((item, i) => (
              <div
                key={item.label}
                className="tw:flex tw:items-baseline tw:gap-xl tw:p-lg"
                style={{
                  borderBottom: i < 1 ? `1px solid ${colors.border.light}` : 'none',
                }}
              >
                <span className="tw:w-[100px] tw:shrink-0 tw:font-mono tw:text-xs tw:text-text-tertiary tw:uppercase tw:tracking-wide">
                  {item.label}
                </span>
                <span className="tw:text-lg tw:text-text-primary" style={{ fontFamily: item.font }}>
                  {item.sample}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Spacing */}
        <div className="tw:mb-4xl">
          <SectionTitle badge={`${spacingTokens.length} tokens`}>Spacing</SectionTitle>
          <div className="tw:flex tw:flex-col tw:gap-sm">
            {spacingTokens.map((space) => (
              <div key={space.name} className="tw:flex tw:items-center tw:gap-lg">
                <span className="tw:w-[60px] tw:font-mono tw:text-sm tw:text-text-tertiary">
                  {space.name}
                </span>
                <div
                  className="tw:h-6 tw:bg-primary-500 tw:rounded-element tw:opacity-60"
                  style={{ width: space.value }}
                />
                <span className="tw:font-mono tw:text-xs tw:text-text-tertiary">{space.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Border radius */}
        <div className="tw:mb-4xl">
          <SectionTitle badge={`${radiusTokens.length} tokens`}>Border radius</SectionTitle>
          <div className="tw:flex tw:gap-xl tw:flex-wrap">
            {radiusTokens.map((radius) => (
              <div key={radius.name} className="tw:flex tw:flex-col tw:items-center tw:gap-sm">
                <div
                  className="tw:w-20 tw:h-20 tw:bg-primary-500 tw:opacity-30"
                  style={{ borderRadius: radius.value }}
                />
                <span className="tw:font-mono tw:text-sm tw:text-text-tertiary">
                  {radius.name} ({radius.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Icons */}
        <div className="tw:mb-4xl">
          <SectionTitle badge="Tabler Icons">Icons</SectionTitle>
          <p className="tw:text-base tw:text-text-secondary tw:mb-xl">
            PolicyEngine uses{' '}
            <a
              href="https://tabler.io/icons"
              target="_blank"
              rel="noopener noreferrer"
              className="tw:text-primary-500 tw:hover:underline"
            >
              Tabler Icons
            </a>
            . Import from <code className="tw:font-mono tw:text-sm">@tabler/icons-react</code>.
          </p>

          <div className="tw:grid tw:grid-cols-4 sm:tw:grid-cols-5 md:tw:grid-cols-10 tw:gap-md">
            {[
              { icon: IconSearch, name: 'Search' },
              { icon: IconCheck, name: 'Check' },
              { icon: IconX, name: 'X' },
              { icon: IconPlus, name: 'Plus' },
              { icon: IconChevronRight, name: 'ChevronRight' },
              { icon: IconArrowUp, name: 'ArrowUp' },
              { icon: IconArrowDown, name: 'ArrowDown' },
              { icon: IconDownload, name: 'Download' },
              { icon: IconInfoCircle, name: 'InfoCircle' },
              { icon: IconWorld, name: 'World' },
            ].map(({ icon: Icon, name }) => (
              <div
                key={name}
                className="tw:flex tw:flex-col tw:items-center tw:gap-xs tw:p-md tw:bg-white tw:border tw:border-border-light tw:rounded-container"
              >
                <Icon size={24} color={colors.text.secondary} />
                <span className="tw:font-mono tw:text-xs tw:text-text-tertiary">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage */}
        <div>
          <SectionTitle>Usage</SectionTitle>
          <div
            className="tw:p-xl tw:rounded-container"
            style={{ background: colors.secondary[900] }}
          >
            <pre
              className="tw:font-mono tw:text-sm tw:m-0 tw:overflow-auto"
              style={{ color: colors.secondary[300] }}
            >
              {`// Import design tokens
import { colors, spacing, typography } from '@/designTokens';

// Use in styles
<Box
  style={{
    color: colors.primary[500],
    padding: spacing.lg,
    borderRadius: spacing.radius.container,
    fontFamily: typography.fontFamily.primary,
  }}
>
  Content
</Box>`}
            </pre>
          </div>
        </div>
      </div>
    </StaticPageLayout>
  );
}
