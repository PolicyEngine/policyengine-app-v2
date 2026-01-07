import { Box, CopyButton, Flex, SimpleGrid, Text, Title, Tooltip, UnstyledButton } from '@mantine/core';
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
  { name: 'sm', value: spacing.radius.sm },
  { name: 'md', value: spacing.radius.md },
  { name: 'lg', value: spacing.radius.lg },
  { name: 'xl', value: spacing.radius.xl },
  { name: '2xl', value: spacing.radius['2xl'] },
];

function ColorSwatch({ name: _name, value, label }: { name: string; value: string; label: string }) {
  const isLight = value === colors.white || value === colors.primary[100];

  return (
    <CopyButton value={value}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied!' : 'Click to copy'}>
          <UnstyledButton
            onClick={copy}
            style={{
              borderRadius: spacing.radius.lg,
              overflow: 'hidden',
              background: colors.white,
              border: `1px solid ${colors.border.light}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            styles={{
              root: {
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${colors.shadow.light}`,
                },
              },
            }}
          >
            <Box
              style={{
                height: 80,
                background: value,
                border: isLight ? `1px solid ${colors.border.light}` : 'none',
              }}
            />
            <Box p="md">
              <Text
                style={{
                  fontFamily: typography.fontFamily.mono,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.primary,
                  marginBottom: spacing.xs,
                }}
              >
                {label}
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
            </Box>
          </UnstyledButton>
        </Tooltip>
      )}
    </CopyButton>
  );
}

function SectionTitle({ children, badge }: { children: string; badge?: string }) {
  return (
    <Flex align="center" gap="md" mb="xl">
      <Title
        order={2}
        style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.semibold,
          fontFamily: typography.fontFamily.primary,
          color: colors.text.primary,
        }}
      >
        {children}
      </Title>
      {badge && (
        <Text
          style={{
            fontSize: typography.fontSize.xs,
            fontFamily: typography.fontFamily.mono,
            padding: `${spacing.xs} ${spacing.sm}`,
            background: colors.primary[100],
            color: colors.primary[600],
            borderRadius: spacing.radius.md,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {badge}
        </Text>
      )}
    </Flex>
  );
}

export default function BrandDesignPage() {
  return (
    <StaticPageLayout title="Design system">
      {/* Hero */}
      <Box
        py={spacing['4xl']}
        style={{
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
          Design
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
          Design system
        </Title>
        <Text
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            maxWidth: 600,
          }}
        >
          Tokens, typography, and spacing for building consistent PolicyEngine interfaces.
        </Text>
      </Box>

      {/* Content */}
      <Box
        py={spacing['4xl']}
        style={{
          paddingLeft: '6.125%',
          paddingRight: '6.125%',
          maxWidth: 1200,
        }}
      >
        {/* Colors */}
        <Box mb={spacing['4xl']}>
          <SectionTitle badge={`${colorTokens.length} tokens`}>Colors</SectionTitle>
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing="md">
            {colorTokens.map((color) => (
              <ColorSwatch key={color.name} {...color} />
            ))}
          </SimpleGrid>
        </Box>

        {/* Typography */}
        <Box mb={spacing['4xl']}>
          <SectionTitle>Typography</SectionTitle>
          <Box
            style={{
              background: colors.white,
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.lg,
              overflow: 'hidden',
            }}
          >
            {[
              { label: 'Primary', font: typography.fontFamily.primary, sample: 'Inter — The quick brown fox jumps over the lazy dog.' },
              { label: 'Mono', font: typography.fontFamily.mono, sample: 'JetBrains Mono — const x = fn(args);' },
            ].map((item, i) => (
              <Flex
                key={item.label}
                align="baseline"
                gap="xl"
                p="lg"
                style={{
                  borderBottom: i < 1 ? `1px solid ${colors.border.light}` : 'none',
                }}
              >
                <Text
                  style={{
                    width: 100,
                    flexShrink: 0,
                    fontFamily: typography.fontFamily.mono,
                    fontSize: typography.fontSize.xs,
                    color: colors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    fontFamily: item.font,
                    fontSize: typography.fontSize.lg,
                    color: colors.text.primary,
                  }}
                >
                  {item.sample}
                </Text>
              </Flex>
            ))}
          </Box>
        </Box>

        {/* Spacing */}
        <Box mb={spacing['4xl']}>
          <SectionTitle badge={`${spacingTokens.length} tokens`}>Spacing</SectionTitle>
          <Flex direction="column" gap="sm">
            {spacingTokens.map((space) => (
              <Flex key={space.name} align="center" gap="lg">
                <Text
                  style={{
                    width: 60,
                    fontFamily: typography.fontFamily.mono,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.tertiary,
                  }}
                >
                  {space.name}
                </Text>
                <Box
                  style={{
                    height: 24,
                    width: space.value,
                    background: colors.primary[500],
                    borderRadius: spacing.radius.sm,
                    opacity: 0.6,
                  }}
                />
                <Text
                  style={{
                    fontFamily: typography.fontFamily.mono,
                    fontSize: typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  {space.value}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>

        {/* Border radius */}
        <Box mb={spacing['4xl']}>
          <SectionTitle badge={`${radiusTokens.length} tokens`}>Border radius</SectionTitle>
          <Flex gap="xl" wrap="wrap">
            {radiusTokens.map((radius) => (
              <Flex key={radius.name} direction="column" align="center" gap="sm">
                <Box
                  style={{
                    width: 80,
                    height: 80,
                    background: colors.primary[500],
                    borderRadius: radius.value,
                    opacity: 0.3,
                  }}
                />
                <Text
                  style={{
                    fontFamily: typography.fontFamily.mono,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.tertiary,
                  }}
                >
                  {radius.name} ({radius.value})
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>

        {/* Icons */}
        <Box mb={spacing['4xl']}>
          <SectionTitle badge="Tabler Icons">Icons</SectionTitle>
          <Text
            mb="xl"
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
            }}
          >
            PolicyEngine uses{' '}
            <a
              href="https://tabler.io/icons"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: colors.primary[500] }}
            >
              Tabler Icons
            </a>
            . Import from <code style={{ fontFamily: typography.fontFamily.mono, fontSize: typography.fontSize.sm }}>@tabler/icons-react</code>.
          </Text>

          <SimpleGrid cols={{ base: 4, sm: 5, md: 10 }} spacing="md">
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
              <Flex
                key={name}
                direction="column"
                align="center"
                gap="xs"
                p="md"
                style={{
                  background: colors.white,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: spacing.radius.md,
                }}
              >
                <Icon size={24} color={colors.text.secondary} />
                <Text
                  style={{
                    fontFamily: typography.fontFamily.mono,
                    fontSize: typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  {name}
                </Text>
              </Flex>
            ))}
          </SimpleGrid>
        </Box>

        {/* Usage */}
        <Box>
          <SectionTitle>Usage</SectionTitle>
          <Box
            p="xl"
            style={{
              background: colors.secondary[900],
              borderRadius: spacing.radius.lg,
            }}
          >
            <Text
              component="pre"
              style={{
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.sm,
                color: colors.secondary[300],
                margin: 0,
                overflow: 'auto',
              }}
            >
{`// Import design tokens
import { colors, spacing, typography } from '@/designTokens';

// Use in styles
<Box
  style={{
    color: colors.primary[500],
    padding: spacing.lg,
    borderRadius: spacing.radius.md,
    fontFamily: typography.fontFamily.primary,
  }}
>
  Content
</Box>`}
            </Text>
          </Box>
        </Box>
      </Box>
    </StaticPageLayout>
  );
}
