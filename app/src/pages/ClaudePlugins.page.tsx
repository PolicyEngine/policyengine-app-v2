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

/* ---------- terminal style block ---------- */

function TerminalBlock({ lines }: { lines: { type: 'prompt' | 'output'; text: string }[] }) {
  return (
    <Box
      style={{
        backgroundColor: '#1a1b26',
        borderRadius: '6px',
        padding: '14px 16px',
        fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace",
        fontSize: '12.5px',
        lineHeight: 1.6,
        overflow: 'hidden',
      }}
      mt="md"
    >
      {/* Window dots */}
      <Flex gap={6} mb={10}>
        <Box style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
        <Box style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#febc2e' }} />
        <Box style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#28c840' }} />
      </Flex>
      {lines.map((line, i) => (
        <Box key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {line.type === 'prompt' ? (
            <Text component="span" style={{ color: '#7dcfff', fontFamily: 'inherit', fontSize: 'inherit' }}>
              {'> '}<Text component="span" style={{ color: '#c0caf5', fontFamily: 'inherit', fontSize: 'inherit' }}>{line.text}</Text>
            </Text>
          ) : (
            <Text component="span" style={{ color: '#565f89', fontFamily: 'inherit', fontSize: 'inherit' }}>
              {line.text}
            </Text>
          )}
        </Box>
      ))}
    </Box>
  );
}

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
    terminal: [
      { type: 'prompt' as const, text: 'What if we raised the standard deduction to $20,000?' },
      { type: 'output' as const, text: 'Running microsimulation on 2024 CPS...' },
      { type: 'output' as const, text: 'Cost: $142B | Winners: 68% | Gini: -0.003' },
    ],
  },
  {
    title: 'Analyze historical policy',
    description:
      'Backdate policy parameters to study how programs have changed over time and their evolving impacts.',
    terminal: [
      { type: 'prompt' as const, text: 'How has the EITC changed since 2000?' },
      { type: 'output' as const, text: 'Fetching historical parameters...' },
      { type: 'output' as const, text: 'Max credit: $2,353 (2000) → $7,830 (2024)' },
    ],
  },
  {
    title: 'Build interactive dashboards',
    description:
      'Generate Streamlit apps and Plotly visualizations that let stakeholders explore reform scenarios.',
    terminal: [
      { type: 'prompt' as const, text: 'Build a dashboard comparing flat tax rates' },
      { type: 'output' as const, text: 'Creating Streamlit app with Plotly charts...' },
      { type: 'output' as const, text: '✓ app.py written → streamlit run app.py' },
    ],
  },
  {
    title: 'Create household calculators',
    description:
      'Build tools that show how a specific household is affected by a policy change.',
    terminal: [
      { type: 'prompt' as const, text: 'Show CTC impact for a family of 4 earning $55k' },
      { type: 'output' as const, text: 'Current CTC: $4,000 | Reformed: $6,000' },
      { type: 'output' as const, text: 'Net change: +$2,000/yr (+$167/mo)' },
    ],
  },
  {
    title: 'Write policy briefs',
    description:
      'Draft research-quality analysis with charts, tables, and properly cited methodology.',
    terminal: [
      { type: 'prompt' as const, text: 'Write a brief on eliminating the SALT cap' },
      { type: 'output' as const, text: 'Drafting with distributional tables...' },
      { type: 'output' as const, text: '✓ salt_cap_brief.md (2,400 words + 3 charts)' },
    ],
  },
  {
    title: 'Congressional district analysis',
    description:
      'Map reform impacts to every congressional district using geographic microdata.',
    terminal: [
      { type: 'prompt' as const, text: 'Map this reform across all 435 districts' },
      { type: 'output' as const, text: 'Loading HuggingFace geographic data...' },
      { type: 'output' as const, text: '✓ 435 districts analyzed → choropleth ready' },
    ],
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

      {/* Section 2 — Quick start (right after hero) */}
      <ContentSection title="Get started in 3 steps" variant="accent" centerTitle>
        <Stack gap="lg" maw={600} mx="auto">
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

      {/* Section 3 — What you can do (with terminal examples) */}
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
                display: 'flex',
                flexDirection: 'column',
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
                mb={6}
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
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  fontFamily: typography.fontFamily.body,
                  lineHeight: typography.lineHeight.relaxed,
                }}
              >
                {uc.description}
              </Text>
              <Box style={{ marginTop: 'auto' }}>
                <TerminalBlock lines={uc.terminal} />
              </Box>
            </Card>
          ))}
        </SimpleGrid>
      </ContentSection>

      {/* Section 4 — Microsimulation showcase */}
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

      {/* Section 5 — Plugin bundles */}
      <ContentSection title="Choose your plugin bundle" variant="primary">
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
                backgroundColor: b.recommended ? 'rgba(45,139,135,0.03)' : colors.white,
              }}
            >
              <Flex justify="space-between" align="center" mb="sm">
                <Code
                  style={{
                    backgroundColor: 'rgba(45,139,135,0.08)',
                    color: colors.primary[600],
                    border: '1px solid rgba(45,139,135,0.3)',
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.medium,
                    padding: '2px 8px',
                  }}
                >
                  {b.name}
                </Code>
                {b.recommended && (
                  <Badge size="sm" variant="filled" color="teal">
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
      <ContentSection variant="secondary">
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
