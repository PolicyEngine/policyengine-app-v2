import { Link } from 'react-router-dom';
import { Text, Title } from '@/components/ui';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { colors, spacing, typography } from '@/designTokens';

interface BrandCardProps {
  to: string;
  title: string;
  description: string;
  meta: string;
}

function BrandCard({ to, title, description, meta }: BrandCardProps) {
  return (
    <Link
      to={to}
      className="tw:block tw:no-underline tw:transition-all tw:duration-200 hover:tw:-translate-y-0.5"
      style={{
        padding: spacing['2xl'],
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.primary[500];
        e.currentTarget.style.boxShadow = `0 4px 12px ${colors.shadow.light}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border.light;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Title
        order={3}
        style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
          fontFamily: typography.fontFamily.primary,
          color: colors.text.primary,
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Title>
      <Text
        style={{
          fontSize: typography.fontSize.base,
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.relaxed,
          marginBottom: spacing.lg,
        }}
      >
        {description}
      </Text>
      <Text
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.tertiary,
        }}
      >
        {meta}
      </Text>
    </Link>
  );
}

const brandCards: BrandCardProps[] = [
  {
    to: 'design',
    title: 'Design system',
    description:
      'Colors, typography, spacing, and component tokens for building consistent PolicyEngine interfaces.',
    meta: 'Tokens and guidelines',
  },
  {
    to: 'writing',
    title: 'Writing guide',
    description: 'Voice, tone, and style guidelines for clear, research-oriented communication.',
    meta: 'Content standards',
  },
  {
    to: 'assets',
    title: 'Assets',
    description: 'Logo files, usage guidelines, and brand resources for partners and press.',
    meta: 'Downloads and guidelines',
  },
];

export default function BrandPage() {
  return (
    <StaticPageLayout title="Brand">
      <HeroSection
        title="Brand"
        description="Resources for representing PolicyEngine consistently across platforms, publications, and partnerships."
      />

      <div
        className="tw:grid tw:grid-cols-1 sm:tw:grid-cols-2 md:tw:grid-cols-3 tw:gap-xl"
        style={{
          paddingTop: spacing['4xl'],
          paddingBottom: spacing['4xl'],
          backgroundColor: colors.background.tertiary,
          paddingLeft: '6.125%',
          paddingRight: '6.125%',
        }}
      >
        {brandCards.map((card) => (
          <BrandCard key={card.to} {...card} />
        ))}
      </div>
    </StaticPageLayout>
  );
}
