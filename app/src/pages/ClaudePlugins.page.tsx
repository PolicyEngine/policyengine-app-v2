import {
  Box,
  Card,
  Flex,
  SimpleGrid,
  Text,
  Title,
  Stack,
  Badge,
  Code,
} from '@mantine/core';
import ContentSection from '@/components/shared/static/ContentSection';
import CTASection from '@/components/shared/static/CTASection';
import HeroSection from '@/components/shared/static/HeroSection';
import RichTextBlock from '@/components/shared/static/RichTextBlock';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { colors, spacing, typography } from '@/designTokens';

const RADIUS = 'md';

/* ---------- data ---------- */

const microsimFeatures = [
  {
    title: 'Cost and revenue estimates',
    description: 'Calculate the budgetary impact of any policy reform',
  },
  {
    title: 'Winners and losers',
    description: 'See who gains and who loses under a proposed change',
  },
  {
    title: 'Distributional analysis',
    description: 'Decile-level impacts, Gini coefficient changes',
  },
  {
    title: 'Poverty effects',
    description: 'Measure changes in poverty rates and depth of poverty',
  },
  {
    title: 'Congressional district analysis',
    description: 'Per-district impacts using geographic microdata',
  },
  {
    title: '50-state analysis',
    description: 'State-by-state breakdowns for any federal reform',
  },
];

const useCases = [
  {
    title: 'Model a reform',
    description:
      'Describe a policy change in plain English and get a full microsimulation with budgetary and distributional impacts.',
  },
  {
    title: 'Analyze historical policy',
    description:
      'Backdate policy parameters to study how programs have changed over time and their evolving impacts.',
  },
  {
    title: 'Build interactive dashboards',
    description:
      'Generate Streamlit apps and Plotly visualizations that let stakeholders explore reform scenarios.',
  },
  {
    title: 'Create household calculators',
    description:
      'Build tools that show how a specific household is affected by a policy change.',
  },
  {
    title: 'Write policy briefs',
    description:
      'Draft research-quality analysis with charts, tables, and properly cited methodology.',
  },
  {
    title: 'Congressional district analysis',
    description:
      'Map reform impacts to every congressional district using HuggingFace geographic datasets.',
  },
];

const setupSteps = [
  {
    step: 1,
    title: 'Install Claude Code',
    code: 'npm install -g @anthropic-ai/claude-code',
  },
  {
    step: 2,
    title: 'Add the plugin',
    code: 'claude plugins add PolicyEngine/policyengine-claude',
  },
  {
    step: 3,
    title: 'Open any PolicyEngine repo',
    description: 'Auto-detects and loads the right tools',
  },
];

const bundles = [
  {
    name: 'analysis-tools',
    audience: 'Policy researchers',
    recommended: true,
  },
  {
    name: 'country-models',
    audience: 'Policy modelers',
    recommended: false,
  },
  {
    name: 'data-science',
    audience: 'Data scientists',
    recommended: false,
  },
  {
    name: 'app-development',
    audience: 'Frontend developers',
    recommended: false,
  },
  {
    name: 'api-development',
    audience: 'Backend developers',
    recommended: false,
  },
  {
    name: 'content',
    audience: 'Content creators',
    recommended: false,
  },
];

const stats = [
  { number: '42', label: 'Skills' },
  { number: '21', label: 'Agents' },
  { number: '9', label: 'Commands' },
  { number: '3', label: 'Hook types' },
  { number: '7', label: 'Bundles' },
];

/* ---------- component ---------- */

export default function ClaudePluginsPage() {
  return (
    <StaticPageLayout title="Claude Plugins">
      {/* Section 1 — Hero */}
      <HeroSection
        title="AI-powered policy analysis"
        description="Use Claude and PolicyEngine together to run microsimulations, model reforms, analyze distributional impacts, and build interactive dashboards — all from your terminal."
      />

      {/* Section 2 — Microsimulation showcase */}
      <ContentSection title="Population-level policy analysis" variant="secondary">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          gap={{ base: spacing.xl, md: spacing['3xl'] }}
        >
          <Box flex={1}>
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                lineHeight: typography.lineHeight.relaxed,
                fontFamily: typography.fontFamily.body,
                color: colors.text.secondary,
              }}
            >
              The analysis-tools plugin turns Claude into a microsimulation
              analyst. Point it at any tax or benefit reform and it runs
              population-level analysis using PolicyEngine&apos;s weighted survey
              data — covering income, demographics, and household structure for
              the entire US population.
            </Text>
          </Box>
          <Box flex={1}>
            <SimpleGrid cols={2} spacing="md">
              {microsimFeatures.map((f) => (
                <Card
                  key={f.title}
                  padding="lg"
                  radius={RADIUS}
                  withBorder
                  style={{
                    borderColor: colors.border.light,
                    backgroundColor: colors.white,
                  }}
                >
                  <Text
                    fw={typography.fontWeight.semibold}
                    style={{
                      fontFamily: typography.fontFamily.primary,
                      fontSize: typography.fontSize.base,
                      color: colors.text.primary,
                    }}
                    mb={4}
                  >
                    {f.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      fontFamily: typography.fontFamily.body,
                      lineHeight: typography.lineHeight.normal,
                    }}
                  >
                    {f.description}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        </Flex>
      </ContentSection>

      {/* Section 3 — What you can do */}
      <ContentSection title="What you can do" variant="primary">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {useCases.map((uc) => (
            <Card
              key={uc.title}
              padding="xl"
              radius={RADIUS}
              withBorder
              style={{
                borderColor: colors.border.light,
                transition: 'all 0.2s ease',
              }}
              styles={{
                root: {
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    borderColor: colors.primary[500],
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  },
                },
              }}
            >
              <Title
                order={3}
                mb="sm"
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  fontFamily: typography.fontFamily.primary,
                  color: colors.primary[600],
                }}
              >
                {uc.title}
              </Title>
              <Text
                style={{
                  fontSize: typography.fontSize.base,
                  color: colors.text.secondary,
                  fontFamily: typography.fontFamily.body,
                  lineHeight: typography.lineHeight.relaxed,
                }}
              >
                {uc.description}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </ContentSection>

      {/* Section 4 — Quick start */}
      <ContentSection title="Get started in 3 steps" variant="accent" centerTitle>
        <Stack
          gap="lg"
          maw={600}
          mx="auto"
        >
          {setupSteps.map((s) => (
            <Flex key={s.step} gap="md" align="flex-start">
              <Box
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: colors.white,
                  color: colors.primary[600],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: typography.fontWeight.bold,
                  fontFamily: typography.fontFamily.primary,
                  fontSize: typography.fontSize.lg,
                }}
              >
                {s.step}
              </Box>
              <Box>
                <Text
                  fw={typography.fontWeight.semibold}
                  style={{
                    color: colors.white,
                    fontFamily: typography.fontFamily.primary,
                    fontSize: typography.fontSize.lg,
                  }}
                  mb={4}
                >
                  {s.title}
                </Text>
                {s.code ? (
                  <Code
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: colors.white,
                      border: '1px solid rgba(255,255,255,0.2)',
                      fontSize: typography.fontSize.sm,
                      padding: '4px 10px',
                    }}
                  >
                    {s.code}
                  </Code>
                ) : (
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.75)',
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.base,
                    }}
                  >
                    {s.description}
                  </Text>
                )}
              </Box>
            </Flex>
          ))}
        </Stack>
      </ContentSection>

      {/* Section 5 — Plugin bundles */}
      <ContentSection title="Choose your plugin bundle" variant="secondary">
        <Text
          mb="xl"
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            fontFamily: typography.fontFamily.body,
          }}
        >
          Most policy researchers want analysis-tools.
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {bundles.map((b) => (
            <Card
              key={b.name}
              padding="xl"
              radius={RADIUS}
              withBorder
              style={{
                borderColor: b.recommended ? colors.primary[500] : colors.border.light,
                borderWidth: b.recommended ? 2 : 1,
                backgroundColor: colors.white,
              }}
            >
              <Flex justify="space-between" align="center" mb="sm">
                <Code
                  style={{
                    backgroundColor: 'rgba(45,139,135,0.08)',
                    color: colors.primary[600],
                    border: `1px solid rgba(45,139,135,0.3)`,
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.medium,
                    padding: '2px 8px',
                  }}
                >
                  {b.name}
                </Code>
                {b.recommended && (
                  <Badge
                    size="sm"
                    variant="filled"
                    color="teal"
                  >
                    Recommended
                  </Badge>
                )}
              </Flex>
              <Text
                style={{
                  fontSize: typography.fontSize.base,
                  color: colors.text.secondary,
                  fontFamily: typography.fontFamily.body,
                }}
              >
                {b.audience}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </ContentSection>

      {/* Section 6 — By the numbers */}
      <ContentSection variant="primary">
        <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing={0}>
          {stats.map((s) => (
            <Box
              key={s.label}
              py="xl"
              style={{
                textAlign: 'center',
                borderRight: `1px solid ${colors.border.light}`,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fontFamily.primary,
                  fontSize: '2.5rem',
                  fontWeight: typography.fontWeight.bold,
                  color: colors.primary[600],
                  lineHeight: 1,
                }}
                mb="xs"
              >
                {s.number}
              </Text>
              <Text
                style={{
                  fontFamily: typography.fontFamily.primary,
                  fontSize: typography.fontSize.sm,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '1.5px',
                  color: colors.text.secondary,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                {s.label}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </ContentSection>

      {/* Section 7 — Story link + CTA */}
      <CTASection
        title="The full story"
        variant="accent"
        content={
          <RichTextBlock variant="inverted">
            <p>
              Read about how we turned a general-purpose AI into a domain expert — the
              failures that taught us, the ideas that worked, and the engineering journey from
              first experiments to a production plugin with 42 skills and 21 specialized agents.
            </p>
          </RichTextBlock>
        }
        cta={{
          text: 'Read the blog post',
          href: 'https://policyengine.github.io/plugin-blog/',
        }}
        caption="View on GitHub"
      />
    </StaticPageLayout>
  );
}
