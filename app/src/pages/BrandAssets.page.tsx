import { Box, Button, Flex, List, SimpleGrid, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { colors, spacing, typography } from '@/designTokens';

function SectionTitle({ children }: { children: string }) {
  return (
    <Title
      order={2}
      mb="lg"
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

function LogoCard({ variant, background, logoSrc }: { variant: string; background: string; logoSrc: string }) {
  return (
    <Box
      style={{
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.lg,
        overflow: 'hidden',
      }}
    >
      <Flex
        align="center"
        justify="center"
        p="xl"
        style={{
          background,
          minHeight: 120,
        }}
      >
        <img
          src={logoSrc}
          alt={`PolicyEngine logo - ${variant}`}
          style={{ height: 48 }}
        />
      </Flex>
      <Box p="md">
        <Text
          mb="sm"
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            textAlign: 'center',
          }}
        >
          {variant}
        </Text>
        <Button
          component="a"
          href={logoSrc}
          download
          variant="outline"
          fullWidth
          size="sm"
          color="teal"
        >
          Download PNG
        </Button>
      </Box>
    </Box>
  );
}

function UsageCard({ type, items }: { type: 'do' | 'dont'; items: string[] }) {
  const isDo = type === 'do';
  return (
    <Box
      p="lg"
      style={{
        background: isDo ? `${colors.success}08` : `${colors.error}08`,
        border: `1px solid ${isDo ? colors.success : colors.error}20`,
        borderRadius: spacing.radius.md,
      }}
    >
      <Text
        mb="md"
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: isDo ? colors.success : colors.error,
        }}
      >
        {isDo ? '✓ Do' : '✗ Don\'t'}
      </Text>
      <List
        style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}
        styles={{ itemWrapper: { marginBottom: spacing.xs } }}
      >
        {items.map((item, i) => (
          <List.Item key={i}>{item}</List.Item>
        ))}
      </List>
    </Box>
  );
}

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <Box
      style={{
        borderRadius: spacing.radius.md,
        overflow: 'hidden',
        border: `1px solid ${colors.border.light}`,
      }}
    >
      <Box style={{ height: 60, background: value }} />
      <Box p="sm" style={{ background: colors.white }}>
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
      </Box>
    </Box>
  );
}

export default function BrandAssetsPage() {
  return (
    <StaticPageLayout title="Assets">
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
      </Box>

      {/* Content */}
      <Box
        py={spacing['4xl']}
        style={{
          paddingLeft: '6.125%',
          paddingRight: '6.125%',
          maxWidth: 1000,
        }}
      >
        {/* Logos */}
        <Box mb={spacing['4xl']}>
          <SectionTitle>Logos</SectionTitle>
          <Text
            mb="xl"
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
            }}
          >
            Download official PolicyEngine logos for use in publications, presentations, and partner materials.
          </Text>

          <Text
            mb="md"
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Full logo
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="xl">
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
          </SimpleGrid>

          <Text
            mb="md"
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Square mark
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
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
          </SimpleGrid>
        </Box>

        {/* Clear space */}
        <Box mb={spacing['4xl']}>
          <SectionTitle>Clear space</SectionTitle>
          <Text
            mb="xl"
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
            }}
          >
            Maintain clear space around the logo equal to at least half the height of the logomark.
          </Text>

          <Box
            p="xl"
            mb="md"
            style={{
              background: colors.white,
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.lg,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Box
              style={{
                position: 'relative',
                padding: spacing['2xl'],
                border: `2px dashed ${colors.primary[300]}`,
                borderRadius: spacing.radius.md,
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
            </Box>
          </Box>
          <Text
            ta="center"
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.tertiary,
            }}
          >
            Minimum clear space around logo
          </Text>
        </Box>

        {/* Usage guidelines */}
        <Box mb={spacing['4xl']}>
          <SectionTitle>Usage guidelines</SectionTitle>
          <Flex gap="lg" direction={{ base: 'column', sm: 'row' }}>
            <Box flex={1}>
              <UsageCard
                type="do"
                items={[
                  'Use official logo files',
                  'Maintain clear space',
                  'Use on contrasting backgrounds',
                  'Scale proportionally',
                ]}
              />
            </Box>
            <Box flex={1}>
              <UsageCard
                type="dont"
                items={[
                  'Stretch or distort the logo',
                  'Change logo colors',
                  'Add effects or shadows',
                  'Place on busy backgrounds',
                ]}
              />
            </Box>
          </Flex>
        </Box>

        {/* Brand colors */}
        <Box>
          <SectionTitle>Brand colors</SectionTitle>
          <Text
            mb="xl"
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
            }}
          >
            Primary brand colors for use alongside the PolicyEngine logo.
          </Text>

          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <ColorSwatch name="Primary teal" value={colors.primary[500]} />
            <ColorSwatch name="Primary dark" value={colors.primary[700]} />
            <ColorSwatch name="Gray" value={colors.secondary[700]} />
            <ColorSwatch name="White" value={colors.white} />
          </SimpleGrid>
        </Box>
      </Box>
    </StaticPageLayout>
  );
}
