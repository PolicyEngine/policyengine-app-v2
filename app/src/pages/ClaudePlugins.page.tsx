import { useEffect, useRef, useState } from 'react';
import { Box, Button, Card, Container, Flex, SimpleGrid, Text, Title } from '@mantine/core';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { colors, spacing, typography } from '@/designTokens';

/* ─── animation hook ─── */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── terminal chrome ─── */

const TERM_BG = '#0d1117';
const TERM_RADIUS = '10px';

function WindowDots({ size = 10 }: { size?: number }) {
  return (
    <Flex gap={6}>
      <Box style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
      <Box style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#febc2e' }} />
      <Box style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#28c840' }} />
    </Flex>
  );
}

function TerminalLine({
  type,
  text,
}: {
  type: 'comment' | 'command' | 'prompt' | 'output' | 'success';
  text: string;
}) {
  const styles: Record<string, { prefix: string; prefixColor: string; textColor: string }> = {
    comment: { prefix: '', prefixColor: '', textColor: '#545d6c' },
    command: { prefix: '$ ', prefixColor: '#79c0ff', textColor: '#e6edf3' },
    prompt: { prefix: '> ', prefixColor: '#56d4b1', textColor: '#e6edf3' },
    output: { prefix: '  ', prefixColor: '', textColor: '#7d8590' },
    success: { prefix: '  ', prefixColor: '', textColor: '#56d4b1' },
  };
  const s = styles[type];
  return (
    <Box style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {s.prefix && (
        <Text
          component="span"
          style={{ color: s.prefixColor, fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          {s.prefix}
        </Text>
      )}
      <Text
        component="span"
        style={{ color: s.textColor, fontFamily: 'inherit', fontSize: 'inherit' }}
      >
        {text}
      </Text>
    </Box>
  );
}

function TerminalBlock({
  lines,
  compact,
}: {
  lines: { type: 'comment' | 'command' | 'prompt' | 'output' | 'success'; text: string }[];
  compact?: boolean;
}) {
  return (
    <Box
      style={{
        backgroundColor: TERM_BG,
        borderRadius: compact ? '8px' : TERM_RADIUS,
        padding: compact ? '12px 14px' : '20px 24px',
        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
        fontSize: compact ? '11.5px' : '13px',
        lineHeight: compact ? 1.7 : 1.9,
        overflow: 'hidden',
      }}
    >
      <Box mb={compact ? 8 : 14}>
        <WindowDots size={compact ? 8 : 10} />
      </Box>
      {lines.map((l, i) => (
        <TerminalLine key={i} {...l} />
      ))}
    </Box>
  );
}

/* ─── animated section wrapper ─── */

function FadeInSection({
  children,
  delay = 0,
  ...boxProps
}: { children: React.ReactNode; delay?: number } & Record<string, unknown>) {
  const { ref, visible } = useInView(0.08);
  return (
    <Box
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
      {...boxProps}
    >
      {children}
    </Box>
  );
}

/* ─── data ─── */

const useCases = [
  {
    title: 'Model a reform',
    description: 'Budgetary and distributional impacts from plain English.',
    terminal: [
      { type: 'prompt' as const, text: 'What if we raised the standard deduction to $20,000?' },
      { type: 'output' as const, text: 'Running microsimulation on 2024 Enhanced CPS...' },
      { type: 'success' as const, text: 'Cost: $236B · Winners: 62% · Gini: -0.001' },
    ],
  },
  {
    title: 'Analyze historical policy',
    description: 'Study how programs have changed over time.',
    terminal: [
      { type: 'prompt' as const, text: 'How has the EITC max credit changed?' },
      { type: 'output' as const, text: 'Reading gov.irs.credits.eitc.max...' },
      { type: 'success' as const, text: '3+ kids: $6,660 (2020) → $8,231 (2026)' },
    ],
  },
  {
    title: 'Create household calculators',
    description: 'Show how a specific household is affected.',
    terminal: [
      {
        type: 'prompt' as const,
        text: 'Raise the CTC to $3k. Impact on a family of 4 earning $55k?',
      },
      { type: 'output' as const, text: 'CTC: $4,400 → $6,000' },
      { type: 'success' as const, text: 'Net change: +$1,280/yr (+$107/mo)' },
    ],
  },
  {
    title: 'Build interactive dashboards',
    description: 'Let stakeholders explore reform scenarios.',
    terminal: [
      { type: 'prompt' as const, text: 'Build a dashboard comparing flat tax rates' },
      { type: 'output' as const, text: 'Creating interactive app with charts...' },
      { type: 'success' as const, text: '✓ app.py written → ready to run' },
    ],
  },
  {
    title: 'Write policy briefs',
    description: 'Research-quality analysis with charts and tables.',
    terminal: [
      { type: 'prompt' as const, text: 'Write a brief on eliminating the SALT cap' },
      { type: 'output' as const, text: 'Cost: $214B · 97% goes to top decile' },
      { type: 'success' as const, text: '✓ salt_cap_brief.md written with 3 charts' },
    ],
  },
  {
    title: 'Congressional district analysis',
    description: 'Map reform impacts to every district.',
    terminal: [
      { type: 'prompt' as const, text: 'Map this reform across all 435 districts' },
      { type: 'output' as const, text: 'Loading HuggingFace geographic data...' },
      { type: 'success' as const, text: '✓ 435 districts analyzed → choropleth ready' },
    ],
  },
];

const microsimFeatures = [
  { title: 'Cost & revenue', desc: 'Budgetary impact of any reform' },
  { title: 'Winners & losers', desc: 'Who gains and who loses' },
  { title: 'Distributional', desc: 'Decile impacts, Gini changes' },
  { title: 'Poverty effects', desc: 'Rate and depth changes' },
  { title: 'Congressional', desc: 'Per-district geographic impacts' },
  { title: '50-state', desc: 'State-by-state breakdowns' },
];

const stats = [
  { value: '24', label: 'Skills' },
  { value: '21', label: 'Agents' },
  { value: '4', label: 'Commands' },
  { value: '7', label: 'Bundles' },
];

/* ─── shared section padding ─── */

const SECTION_PX = { paddingLeft: '6.125%', paddingRight: '6.125%' };

/* ─── page ─── */

export default function ClaudePluginsPage() {
  return (
    <StaticPageLayout title="Claude Plugins">
      {/* ━━━ HERO ━━━ */}
      <Box
        py={80}
        style={{
          backgroundColor: colors.white,
          ...SECTION_PX,
          borderBottom: `1px solid ${colors.border.light}`,
          overflow: 'hidden',
        }}
      >
        <Container size="xl" px={0}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={{ base: 32, md: 56 }}
            align={{ base: 'stretch', md: 'center' }}
          >
            {/* Left — copy */}
            <Box flex={1} maw={500}>
              <FadeInSection>
                <Text
                  component="span"
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: typography.fontWeight.semibold,
                    fontFamily: typography.fontFamily.primary,
                    letterSpacing: '1.8px',
                    textTransform: 'uppercase' as const,
                    color: colors.primary[500],
                    marginBottom: 20,
                  }}
                >
                  Claude Code Plugin
                </Text>
              </FadeInSection>

              <FadeInSection delay={80}>
                <Title
                  order={1}
                  style={{
                    fontSize: 'clamp(32px, 4.5vw, 48px)',
                    fontWeight: typography.fontWeight.bold,
                    fontFamily: typography.fontFamily.primary,
                    color: colors.gray[900],
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                  }}
                  mb="lg"
                >
                  AI-powered{'\n'}policy analysis
                </Title>
              </FadeInSection>

              <FadeInSection delay={160}>
                <Text
                  style={{
                    color: colors.text.secondary,
                    fontSize: typography.fontSize.lg,
                    lineHeight: typography.lineHeight.relaxed,
                    fontFamily: typography.fontFamily.body,
                    maxWidth: 420,
                  }}
                  mb={28}
                >
                  Run microsimulations, model reforms, analyze distributional impacts, and build
                  dashboards — all from your terminal.
                </Text>
              </FadeInSection>

              <FadeInSection delay={240}>
                <Button
                  component="a"
                  href="https://github.com/PolicyEngine/policyengine-claude"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="md"
                  styles={{
                    root: {
                      backgroundColor: colors.primary[500],
                      color: colors.white,
                      fontFamily: typography.fontFamily.primary,
                      fontWeight: typography.fontWeight.semibold,
                      fontSize: typography.fontSize.sm,
                      border: 'none',
                      borderRadius: spacing.sm,
                      padding: '11px 28px',
                      height: 'auto',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: colors.primary[600],
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 14px ${colors.primary.alpha[40]}`,
                      },
                    },
                  }}
                >
                  View on GitHub
                </Button>
              </FadeInSection>
            </Box>

            {/* Right — terminal */}
            <FadeInSection delay={200} style={{ flex: 1, maxWidth: 560, width: '100%' }}>
              <Box
                style={{
                  backgroundColor: TERM_BG,
                  borderRadius: '14px',
                  padding: '22px 26px',
                  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
                  fontSize: '13px',
                  lineHeight: 2,
                  boxShadow: `0 24px 80px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.04) inset`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* subtle glow */}
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background:
                      'linear-gradient(90deg, transparent, rgba(86,212,177,0.3), transparent)',
                  }}
                />
                <Box mb={14}>
                  <WindowDots size={11} />
                </Box>
                <TerminalLine type="comment" text="# 1. Install Claude Code" />
                <TerminalLine type="command" text="npm install -g @anthropic-ai/claude-code" />
                <Box mt={6} />
                <TerminalLine type="comment" text="# 2. Add the plugin" />
                <TerminalLine
                  type="command"
                  text="claude plugins add PolicyEngine/policyengine-claude"
                />
                <Box mt={6} />
                <TerminalLine type="comment" text="# 3. Analyze" />
                <TerminalLine
                  type="prompt"
                  text="What is the budgetary impact of doubling the standard deduction?"
                />
              </Box>
            </FadeInSection>
          </Flex>
        </Container>
      </Box>

      {/* ━━━ WHAT YOU CAN DO ━━━ */}
      <Box
        py={spacing['4xl']}
        style={{
          backgroundColor: colors.gray[50],
          ...SECTION_PX,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <Container size="xl" px={0}>
          <FadeInSection>
            <Title
              order={2}
              mb={spacing['3xl']}
              style={{
                fontSize: typography.fontSize['3xl'],
                fontWeight: typography.fontWeight.semibold,
                fontFamily: typography.fontFamily.primary,
                color: colors.text.primary,
              }}
            >
              What you can do
            </Title>
          </FadeInSection>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {useCases.map((uc, i) => (
              <FadeInSection key={uc.title} delay={i * 60}>
                <Card
                  padding="xl"
                  radius="md"
                  withBorder
                  style={{
                    borderColor: colors.border.light,
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    backgroundColor: colors.white,
                  }}
                  styles={{
                    root: {
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        borderColor: colors.primary[300],
                        boxShadow: `0 12px 32px -8px ${colors.shadow.medium}`,
                      },
                    },
                  }}
                >
                  <Title
                    order={3}
                    mb={4}
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      fontFamily: typography.fontFamily.primary,
                      color: colors.text.primary,
                    }}
                  >
                    {uc.title}
                  </Title>
                  <Text
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      fontFamily: typography.fontFamily.body,
                      lineHeight: typography.lineHeight.normal,
                    }}
                  >
                    {uc.description}
                  </Text>
                  <Box style={{ marginTop: 'auto', paddingTop: 12 }}>
                    <TerminalBlock lines={uc.terminal} compact />
                  </Box>
                </Card>
              </FadeInSection>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ━━━ VIDEO ━━━ */}
      <Box
        py={spacing['4xl']}
        style={{
          backgroundColor: colors.white,
          ...SECTION_PX,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <Container size="xl" px={0}>
          <FadeInSection>
            <Title
              order={2}
              mb="lg"
              style={{
                fontFamily: typography.fontFamily.primary,
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize['3xl'],
                color: colors.text.primary,
              }}
            >
              Demo
            </Title>
          </FadeInSection>
          <FadeInSection delay={100}>
            <Text
              style={{
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
                fontFamily: typography.fontFamily.body,
                color: colors.text.secondary,
                maxWidth: 600,
              }}
              mb="xl"
            >
              Watch how the plugin examines the impact of TANF on a household in LA County — from a
              plain-English prompt to a full household-level analysis.
            </Text>
            <Box style={{ maxWidth: 800 }}>
              <Box
                style={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px -4px rgba(0,0,0,0.12)',
                }}
              >
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src="/assets/demo-clip.mp4"
                  controls
                  preload="metadata"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    borderRadius: '12px',
                  }}
                />
              </Box>
              <Text
                mt="sm"
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.tertiary,
                  fontFamily: typography.fontFamily.body,
                }}
              >
                From our June 2025 launch video ·{' '}
                <a
                  href="https://www.youtube.com/watch?v=Ke_J3pOdL8k"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.primary[500], textDecoration: 'none' }}
                >
                  Watch full video
                </a>
              </Text>
            </Box>
          </FadeInSection>
        </Container>
      </Box>

      {/* ━━━ MICROSIMULATION — light with teal accents ━━━ */}
      <Box
        py={spacing['4xl']}
        style={{
          backgroundColor: colors.white,
          ...SECTION_PX,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <Container size="xl" px={0}>
          <FadeInSection>
            <Title
              order={2}
              mb="sm"
              style={{
                fontFamily: typography.fontFamily.primary,
                fontWeight: typography.fontWeight.bold,
                fontSize: typography.fontSize['3xl'],
                color: colors.text.primary,
              }}
            >
              Population-level policy analysis
            </Title>
            <Text
              style={{
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
                fontFamily: typography.fontFamily.body,
                color: colors.text.secondary,
                maxWidth: 540,
              }}
              mb={spacing['3xl']}
            >
              The analysis-tools plugin turns Claude into a microsimulation analyst. Point it at any
              tax or benefit reform and it runs full population analysis using PolicyEngine&apos;s
              weighted survey data.
            </Text>
          </FadeInSection>

          <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="sm">
            {microsimFeatures.map((f, i) => (
              <FadeInSection key={f.title} delay={i * 50}>
                <Box
                  py="lg"
                  px="md"
                  style={{
                    borderLeft: `2px solid ${colors.primary[200]}`,
                  }}
                >
                  <Text
                    fw={typography.fontWeight.semibold}
                    style={{
                      fontFamily: typography.fontFamily.primary,
                      fontSize: typography.fontSize.sm,
                      color: colors.text.primary,
                    }}
                    mb={2}
                  >
                    {f.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: '12px',
                      color: colors.text.tertiary,
                      fontFamily: typography.fontFamily.body,
                      lineHeight: typography.lineHeight.normal,
                    }}
                  >
                    {f.desc}
                  </Text>
                </Box>
              </FadeInSection>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ━━━ DARK CLOSING — stats + read more ━━━ */}
      <Box
        py={spacing['4xl']}
        style={{
          backgroundColor: colors.gray[900],
          ...SECTION_PX,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.primary[500]}12, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        <Container size="xl" px={0} style={{ position: 'relative' }}>
          {/* Read more */}
          <FadeInSection>
            <Title
              order={2}
              mb={spacing['3xl']}
              style={{
                fontFamily: typography.fontFamily.primary,
                fontWeight: typography.fontWeight.bold,
                fontSize: typography.fontSize['3xl'],
                color: colors.white,
                textAlign: 'center',
              }}
            >
              Read more
            </Title>
          </FadeInSection>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" maw={900} mx="auto">
            {(
              [
                {
                  href: '/plugin-blog/',
                  external: false,
                  title: 'How we built the plugin',
                  desc: 'From first experiments to 24 skills and 21 agents.',
                },
                {
                  href: '/us/encode-policy-multi-agent-ai',
                  external: false,
                  title: 'Encode policy with AI',
                  desc: 'Legal text to tested code with multi-agent pipelines.',
                },
                {
                  href: '/us/research/multi-agent-workflows-policy-research',
                  external: false,
                  title: 'Multi-agent AI workflows',
                  desc: 'Distributional analysis and benefit interactions.',
                },
              ] as const
            ).map((post, i) => (
              <FadeInSection key={post.title} delay={i * 80}>
                <Card
                  component="a"
                  href={post.href}
                  target={post.external ? '_blank' : undefined}
                  rel={post.external ? 'noopener noreferrer' : undefined}
                  padding="lg"
                  radius="md"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    height: '100%',
                  }}
                  styles={{
                    root: {
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderColor: 'rgba(255,255,255,0.15)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 40px -10px rgba(0,0,0,0.3)',
                      },
                    },
                  }}
                >
                  <Text
                    fw={typography.fontWeight.semibold}
                    mb={4}
                    style={{
                      fontFamily: typography.fontFamily.primary,
                      fontSize: typography.fontSize.sm,
                      color: colors.white,
                    }}
                  >
                    {post.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: 'rgba(255,255,255,0.4)',
                      fontFamily: typography.fontFamily.body,
                      lineHeight: typography.lineHeight.normal,
                    }}
                  >
                    {post.desc}
                  </Text>
                </Card>
              </FadeInSection>
            ))}
          </SimpleGrid>

          {/* Stats */}
          <FadeInSection>
            <Flex justify="center" gap={{ base: 32, sm: 56, md: 80 }} wrap="wrap" mt={64}>
              {stats.map((s) => (
                <Box key={s.label} style={{ textAlign: 'center' }}>
                  <Text
                    component="span"
                    style={{
                      fontFamily: typography.fontFamily.primary,
                      fontSize: 'clamp(28px, 3vw, 36px)',
                      fontWeight: typography.fontWeight.bold,
                      color: colors.primary[300],
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.primary,
                      fontSize: '11px',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '1.8px',
                      color: 'rgba(255,255,255,0.4)',
                      fontWeight: typography.fontWeight.medium,
                      marginTop: 4,
                    }}
                  >
                    {s.label}
                  </Text>
                </Box>
              ))}
            </Flex>
          </FadeInSection>
        </Container>
      </Box>
    </StaticPageLayout>
  );
}
