import { Link } from 'react-router-dom';
import { Box, SimpleGrid, Text, Title, UnstyledButton } from '@mantine/core';
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
    <UnstyledButton
      component={Link}
      to={to}
      style={{
        display: 'block',
        padding: spacing['2xl'],
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.lg,
        textDecoration: 'none',
        transition: 'all 0.2s ease',
      }}
      styles={{
        root: {
          '&:hover': {
            borderColor: colors.primary[500],
            boxShadow: `0 4px 12px ${colors.shadow.light}`,
            transform: 'translateY(-2px)',
          },
        },
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
    </UnstyledButton>
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

      <Box
        py={spacing['4xl']}
        style={{
          backgroundColor: colors.background.tertiary,
          paddingLeft: '6.125%',
          paddingRight: '6.125%',
        }}
      >
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
          {brandCards.map((card) => (
            <BrandCard key={card.to} {...card} />
          ))}
        </SimpleGrid>
      </Box>
    </StaticPageLayout>
  );
}
