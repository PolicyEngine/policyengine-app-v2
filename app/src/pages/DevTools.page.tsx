import { Link } from 'react-router-dom';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

interface DevToolCardProps {
  to: string;
  title: string;
  description: string;
}

function DevToolCard({ to, title, description }: DevToolCardProps) {
  return (
    <Link
      to={to}
      className="tw:block tw:no-underline tw:transition-all tw:duration-200 tw:hover:-translate-y-0.5"
      style={{
        padding: spacing['2xl'],
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
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
        }}
      >
        {description}
      </Text>
    </Link>
  );
}

const devToolCards: DevToolCardProps[] = [
  {
    to: 'api-status',
    title: 'API status',
    description:
      'Check the current status and availability of PolicyEngine API endpoints.',
  },
];

export default function DevToolsPage() {
  return (
    <StaticPageLayout title="Developer tools">
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <HeroSection
          title="Developer tools"
          description="Tools and resources for developers building on the PolicyEngine platform."
        />

        <div
          className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:md:grid-cols-3 tw:gap-xl tw:flex-1"
          style={{
            paddingTop: spacing['4xl'],
            paddingBottom: spacing['4xl'],
            backgroundColor: colors.background.tertiary,
            paddingLeft: '6.125%',
            paddingRight: '6.125%',
            alignContent: 'start',
          }}
        >
          {devToolCards.map((card) => (
            <DevToolCard key={card.to} {...card} />
          ))}
        </div>
      </div>
    </StaticPageLayout>
  );
}
