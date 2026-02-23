import { IconCheck, IconX } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Button, Text, Title } from '@/components/ui';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { colors, spacing, typography } from '@/designTokens';

function SectionTitle({ children }: { children: string }) {
  return (
    <Title
      order={2}
      className="tw:mb-lg"
      style={{
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.semibold,
        fontFamily: typography.fontFamily.primary,
        color: colors.text.primary,
      }}
    >
      {children}
    </Title>
  );
}

function LogoCard({
  variant,
  background,
  logoSrc,
}: {
  variant: string;
  background: string;
  logoSrc: string;
}) {
  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        overflow: 'hidden',
      }}
    >
      <div
        className="tw:flex tw:items-center tw:justify-center tw:p-xl"
        style={{
          background,
          minHeight: 120,
        }}
      >
        <img src={logoSrc} alt={`PolicyEngine logo - ${variant}`} style={{ height: 48 }} />
      </div>
      <div className="tw:p-md">
        <Text
          className="tw:mb-sm tw:text-center"
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          {variant}
        </Text>
        <Button variant="outline" className="tw:w-full" asChild>
          <a href={logoSrc} download>
            Download PNG
          </a>
        </Button>
      </div>
    </div>
  );
}

function UsageCard({ type, items }: { type: 'do' | 'dont'; items: string[] }) {
  const isDo = type === 'do';
  return (
    <div
      className="tw:p-lg"
      style={{
        background: isDo ? `${colors.success}08` : `${colors.error}08`,
        border: `1px solid ${isDo ? colors.success : colors.error}20`,
        borderRadius: spacing.radius.container,
      }}
    >
      <Text
        className="tw:mb-md"
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: isDo ? colors.success : colors.error,
        }}
      >
        <span className="tw:flex tw:items-center tw:gap-1">
          {isDo ? <IconCheck size={14} /> : <IconX size={14} />}
          {isDo ? 'Do' : "Don't"}
        </span>
      </Text>
      <ul style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm, paddingLeft: 20 }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: spacing.xs }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: spacing.radius.container,
        overflow: 'hidden',
        border: `1px solid ${colors.border.light}`,
      }}
    >
      <div style={{ height: 60, background: value }} />
      <div className="tw:p-sm" style={{ background: colors.white }}>
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            marginBottom: spacing.xs,
          }}
        >
          {name}
        </Text>
        <Text
          style={{
            fontFamily: typography.fontFamily.mono,
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
          }}
        >
          {value}
        </Text>
      </div>
    </div>
  );
}

export default function BrandAssetsPage() {
  return (
    <StaticPageLayout title="Assets">
      {/* Hero */}
      <div
        style={{
          paddingTop: spacing['4xl'],
          paddingBottom: spacing['4xl'],
          backgroundColor: '#F7FEFE',
          borderBottom: `1px solid ${colors.border.dark}`,
          paddingLeft: '6.125%',
          paddingRight: '6.125%',
        }}
      >
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.md,
          }}
        >
          <Link to="../brand" style={{ color: colors.primary[500], textDecoration: 'none' }}>
            Brand
          </Link>
          {' / '}
          Assets
        </Text>
        <Title
          style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.semibold,
            fontFamily: typography.fontFamily.primary,
            color: colors.text.primary,
            marginBottom: spacing.md,
          }}
        >
          Assets
        </Title>
        <Text
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            maxWidth: 600,
          }}
        >
          Logo files, usage guidelines, and brand resources for partners and press.
        </Text>
      </div>

      {/* Content */}
      <div
        style={{
          paddingTop: spacing['4xl'],
          paddingBottom: spacing['4xl'],
          paddingLeft: '6.125%',
          paddingRight: '6.125%',
          maxWidth: 1000,
        }}
      >
        {/* Logos */}
        <div style={{ marginBottom: spacing['4xl'] }}>
          <SectionTitle>Logos</SectionTitle>
          <Text
            className="tw:mb-xl"
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
            }}
          >
            Download official PolicyEngine logos for use in publications, presentations, and partner
            materials.
          </Text>

          <Text
            className="tw:mb-md"
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Full logo
          </Text>
          <div className="tw:grid tw:grid-cols-1 sm:tw:grid-cols-2 tw:gap-lg tw:mb-xl">
            <LogoCard
              variant="Teal on white"
              background={colors.white}
              logoSrc="/assets/logos/policyengine/teal.png"
            />
            <LogoCard
              variant="White on dark"
              background={colors.primary[700]}
              logoSrc="/assets/logos/policyengine/white.png"
            />
          </div>

          <Text
            className="tw:mb-md"
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Square mark
          </Text>
          <div className="tw:grid tw:grid-cols-1 sm:tw:grid-cols-2 tw:gap-lg">
            <LogoCard
              variant="Teal square"
              background={colors.white}
              logoSrc="/assets/logos/policyengine/teal-square.png"
            />
            <LogoCard
              variant="Teal square (transparent)"
              background={colors.gray[100]}
              logoSrc="/assets/logos/policyengine/teal-square-transparent.png"
            />
          </div>
        </div>

        {/* Clear space */}
        <div style={{ marginBottom: spacing['4xl'] }}>
          <SectionTitle>Clear space</SectionTitle>
          <Text
            className="tw:mb-xl"
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
            }}
          >
            Maintain clear space around the logo equal to at least half the height of the logomark.
          </Text>

          <div
            className="tw:flex tw:justify-center tw:p-xl tw:mb-md"
            style={{
              background: colors.white,
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.container,
            }}
          >
            <div
              style={{
                position: 'relative',
                padding: spacing['2xl'],
                border: `2px dashed ${colors.primary[300]}`,
                borderRadius: spacing.radius.container,
              }}
            >
              <img
                src="/assets/logos/policyengine/teal.png"
                alt="PolicyEngine logo"
                style={{ height: 40 }}
              />
              <Text
                style={{
                  position: 'absolute',
                  top: -20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: typography.fontSize.xs,
                  fontFamily: typography.fontFamily.mono,
                  color: colors.primary[500],
                }}
              >
                0.5x
              </Text>
            </div>
          </div>
          <Text
            className="tw:text-center"
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.tertiary,
            }}
          >
            Minimum clear space around logo
          </Text>
        </div>

        {/* Usage guidelines */}
        <div style={{ marginBottom: spacing['4xl'] }}>
          <SectionTitle>Usage guidelines</SectionTitle>
          <div className="tw:flex tw:flex-col sm:tw:flex-row tw:gap-lg">
            <div className="tw:flex-1">
              <UsageCard
                type="do"
                items={[
                  'Use official logo files',
                  'Maintain clear space',
                  'Use on contrasting backgrounds',
                  'Scale proportionally',
                ]}
              />
            </div>
            <div className="tw:flex-1">
              <UsageCard
                type="dont"
                items={[
                  'Stretch or distort the logo',
                  'Change logo colors',
                  'Add effects or shadows',
                  'Place on busy backgrounds',
                ]}
              />
            </div>
          </div>
        </div>

        {/* Brand colors */}
        <div>
          <SectionTitle>Brand colors</SectionTitle>
          <Text
            className="tw:mb-xl"
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
            }}
          >
            Primary brand colors for use alongside the PolicyEngine logo.
          </Text>

          <div className="tw:grid tw:grid-cols-2 sm:tw:grid-cols-4 tw:gap-md">
            <ColorSwatch name="Primary teal" value={colors.primary[500]} />
            <ColorSwatch name="Primary dark" value={colors.primary[700]} />
            <ColorSwatch name="Gray" value={colors.secondary[700]} />
            <ColorSwatch name="White" value={colors.white} />
          </div>
        </div>
      </div>
    </StaticPageLayout>
  );
}
