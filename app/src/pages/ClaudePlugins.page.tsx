import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
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
    <div style={{ display: 'flex', gap: 6 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#febc2e' }} />
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#28c840' }} />
    </div>
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
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {s.prefix && (
        <span style={{ color: s.prefixColor, fontFamily: 'inherit', fontSize: 'inherit' }}>
          {s.prefix}
        </span>
      )}
      <span style={{ color: s.textColor, fontFamily: 'inherit', fontSize: 'inherit' }}>{text}</span>
    </div>
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
    <div
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
      <div style={{ marginBottom: compact ? 8 : 14 }}>
        <WindowDots size={compact ? 8 : 10} />
      </div>
      {lines.map((l, i) => (
        <TerminalLine key={i} {...l} />
      ))}
    </div>
  );
}

/* ─── animated section wrapper ─── */

function FadeInSection({
  children,
  delay = 0,
  style,
  ...rest
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>) {
  const { ref, visible } = useInView(0.08);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ─── data ─── */

type LineType = 'comment' | 'command' | 'prompt' | 'output' | 'success';

interface UseCase {
  title: string;
  description: string;
  terminal: { type: LineType; text: string }[];
}

interface MicrosimFeature {
  title: string;
  desc: string;
}

const usUseCases: UseCase[] = [
  {
    title: 'Model a reform',
    description: 'Budgetary and distributional impacts from plain English.',
    terminal: [
      { type: 'prompt', text: 'What if we raised the standard deduction to $20,000?' },
      { type: 'output', text: 'Running microsimulation on 2024 Enhanced CPS...' },
      { type: 'success', text: 'Cost: $80B · Winners: 62% · Gini: -0.001' },
    ],
  },
  {
    title: 'Analyze historical policy',
    description: 'Study how programs have changed over time.',
    terminal: [
      { type: 'prompt', text: 'How has the EITC max credit changed?' },
      { type: 'output', text: 'Reading gov.irs.credits.eitc.max...' },
      { type: 'success', text: '3+ kids: $6,660 (2020) → $8,231 (2026)' },
    ],
  },
  {
    title: 'Create household calculators',
    description: 'Show how a specific household is affected.',
    terminal: [
      { type: 'prompt', text: 'Raise the CTC to $3k. Impact on a family of 4 earning $55k?' },
      { type: 'output', text: 'CTC: $4,400 → $6,000' },
      { type: 'success', text: 'Net change: +$1,280/yr (+$107/mo)' },
    ],
  },
  {
    title: 'Build interactive dashboards',
    description: 'Let stakeholders explore reform scenarios.',
    terminal: [
      { type: 'prompt', text: 'Build a dashboard comparing flat tax rates' },
      { type: 'output', text: 'Creating interactive app with charts...' },
      { type: 'success', text: '✓ app.py written → ready to run' },
    ],
  },
  {
    title: 'Write policy briefs',
    description: 'Research-quality analysis with charts and tables.',
    terminal: [
      { type: 'prompt', text: 'Write a brief on eliminating the SALT cap' },
      { type: 'output', text: 'Cost: $69B · 98% goes to top decile' },
      { type: 'success', text: '✓ salt_cap_brief.md written with 3 charts' },
    ],
  },
  {
    title: 'Congressional district analysis',
    description: 'Map reform impacts to every district.',
    terminal: [
      { type: 'prompt', text: 'Map the SALT cap repeal across all 435 districts' },
      { type: 'output', text: 'Loading district-level microdata...' },
      { type: 'success', text: '✓ 435 districts analyzed → choropleth ready' },
    ],
  },
];

const ukUseCases: UseCase[] = [
  {
    title: 'Model a reform',
    description: 'Budgetary and distributional impacts from plain English.',
    terminal: [
      { type: 'prompt', text: 'What if we raised the personal allowance to £13,500?' },
      { type: 'output', text: 'Running microsimulation on Family Resources Survey...' },
      { type: 'success', text: 'Cost: £8B · Winners: 54% · Gini: -0.001' },
    ],
  },
  {
    title: 'Analyze historical policy',
    description: 'Study how programs have changed over time.',
    terminal: [
      { type: 'prompt', text: 'How has the Universal Credit standard allowance changed?' },
      { type: 'output', text: 'Reading gov.dwp.universal_credit.standard_allowance...' },
      { type: 'success', text: 'Single 25+: £318/mo (2015) → £400/mo (2025)' },
    ],
  },
  {
    title: 'Create household calculators',
    description: 'Show how a specific household is affected.',
    terminal: [
      {
        type: 'prompt',
        text: 'Set Child Benefit to £30/wk per child. Impact on a family of 4 earning £35k?',
      },
      { type: 'output', text: 'Child Benefit: £2,251 → £3,120/yr' },
      { type: 'success', text: 'Net change: +£869/yr (+£72/mo)' },
    ],
  },
  {
    title: 'Build interactive dashboards',
    description: 'Let stakeholders explore reform scenarios.',
    terminal: [
      { type: 'prompt', text: 'Build a dashboard showing the impact of cutting the basic rate by 1p' },
      { type: 'output', text: 'Creating interactive app with charts...' },
      { type: 'success', text: '✓ app.py written → ready to run' },
    ],
  },
  {
    title: 'Write policy briefs',
    description: 'Research-quality analysis with charts and tables.',
    terminal: [
      { type: 'prompt', text: 'Write a brief on abolishing the two-child limit' },
      { type: 'output', text: 'Cost: £2.3B · 90% goes to bottom 3 deciles' },
      { type: 'success', text: '✓ two_child_limit_brief.md written with 3 charts' },
    ],
  },
  {
    title: 'Constituency analysis',
    description: 'Map reform impacts to every constituency.',
    terminal: [
      { type: 'prompt', text: 'Map the two-child limit repeal across all 650 constituencies' },
      { type: 'output', text: 'Loading constituency-level microdata...' },
      { type: 'success', text: '✓ 650 constituencies analyzed → choropleth ready' },
    ],
  },
];

const usMicrosimFeatures: MicrosimFeature[] = [
  { title: 'Cost & revenue', desc: 'Budgetary impact of any reform' },
  { title: 'Winners & losers', desc: 'Who gains and who loses' },
  { title: 'Distributional', desc: 'Decile impacts, Gini changes' },
  { title: 'Poverty effects', desc: 'Rate and depth changes' },
  { title: 'Congressional', desc: 'Per-district geographic impacts' },
  { title: '50-state', desc: 'State-by-state breakdowns' },
];

const ukMicrosimFeatures: MicrosimFeature[] = [
  { title: 'Cost & revenue', desc: 'Budgetary impact of any reform' },
  { title: 'Winners & losers', desc: 'Who gains and who loses' },
  { title: 'Distributional', desc: 'Decile impacts, Gini changes' },
  { title: 'Poverty effects', desc: 'Rate and depth changes' },
  { title: 'Constituency', desc: 'Per-constituency geographic impacts' },
  { title: 'Regional', desc: 'Country and region breakdowns' },
];

const stats = [
  { value: '24', label: 'Skills' },
  { value: '21', label: 'Agents' },
  { value: '4', label: 'Commands' },
  { value: '7', label: 'Bundles' },
];

/* ─── shared section padding ─── */

const SECTION_PX: React.CSSProperties = { paddingLeft: '6.125%', paddingRight: '6.125%' };
const CONTAINER: React.CSSProperties = { maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' };

/* ─── page ─── */

export default function ClaudePluginsPage() {
  const { countryId } = useParams<{ countryId: string }>();
  const isUK = countryId === 'uk';
  const useCases = isUK ? ukUseCases : usUseCases;
  const microsimFeatures = isUK ? ukMicrosimFeatures : usMicrosimFeatures;
  const heroPrompt = isUK
    ? 'What is the budgetary impact of raising the personal allowance to £13,500?'
    : 'What is the budgetary impact of doubling the standard deduction?';
  const heroDataset = isUK ? 'Family Resources Survey' : '2024 Enhanced CPS';

  return (
    <StaticPageLayout title="Claude Plugins">
      {/* ━━━ HERO ━━━ */}
      <div
        style={{
          paddingTop: 80,
          paddingBottom: 80,
          backgroundColor: colors.white,
          ...SECTION_PX,
          borderBottom: `1px solid ${colors.border.light}`,
          overflow: 'hidden',
        }}
      >
        <div style={CONTAINER}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 56,
              alignItems: 'center',
            }}
          >
            {/* Left — copy */}
            <div style={{ flex: '1 1 400px', maxWidth: 500 }}>
              <FadeInSection>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: typography.fontWeight.semibold,
                    fontFamily: typography.fontFamily.primary,
                    letterSpacing: '1.8px',
                    textTransform: 'uppercase',
                    color: colors.primary[500],
                    marginBottom: 20,
                  }}
                >
                  Claude Code Plugin
                </span>
              </FadeInSection>

              <FadeInSection delay={80}>
                <h1
                  style={{
                    fontSize: 'clamp(32px, 4.5vw, 48px)',
                    fontWeight: typography.fontWeight.bold,
                    fontFamily: typography.fontFamily.primary,
                    color: colors.gray[900],
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                    marginBottom: spacing.lg,
                  }}
                >
                  AI-powered{'\n'}policy analysis
                </h1>
              </FadeInSection>

              <FadeInSection delay={160}>
                <p
                  style={{
                    color: colors.text.secondary,
                    fontSize: typography.fontSize.lg,
                    lineHeight: typography.lineHeight.relaxed,
                    fontFamily: typography.fontFamily.body,
                    maxWidth: 420,
                    marginBottom: 28,
                  }}
                >
                  Run microsimulations, model reforms, analyze distributional impacts, and build
                  dashboards — all from your terminal.
                </p>
              </FadeInSection>

              <FadeInSection delay={240}>
                <a
                  href="https://github.com/PolicyEngine/policyengine-claude"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    backgroundColor: colors.primary[500],
                    color: colors.white,
                    fontFamily: typography.fontFamily.primary,
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: typography.fontSize.sm,
                    border: 'none',
                    borderRadius: spacing.sm,
                    padding: '11px 28px',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  View on GitHub
                </a>
              </FadeInSection>
            </div>

            {/* Right — terminal */}
            <FadeInSection delay={200} style={{ flex: '1 1 400px', maxWidth: 560, width: '100%' }}>
              <div
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
                <div
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
                <div style={{ marginBottom: 14 }}>
                  <WindowDots size={11} />
                </div>
                <TerminalLine type="comment" text="# 1. Install Claude Code" />
                <TerminalLine type="command" text="npm install -g @anthropic-ai/claude-code" />
                <div style={{ marginTop: 6 }} />
                <TerminalLine type="comment" text="# 2. Add the plugin" />
                <TerminalLine
                  type="command"
                  text="claude plugins add PolicyEngine/policyengine-claude"
                />
                <div style={{ marginTop: 6 }} />
                <TerminalLine type="comment" text="# 3. Analyze" />
                <TerminalLine type="prompt" text={heroPrompt} />
              </div>
            </FadeInSection>
          </div>
        </div>
      </div>

      {/* ━━━ WHAT YOU CAN DO ━━━ */}
      <div
        style={{
          paddingTop: spacing['4xl'],
          paddingBottom: spacing['4xl'],
          backgroundColor: colors.gray[50],
          ...SECTION_PX,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <div style={CONTAINER}>
          <FadeInSection>
            <h2
              style={{
                fontSize: typography.fontSize['3xl'],
                fontWeight: typography.fontWeight.semibold,
                fontFamily: typography.fontFamily.primary,
                color: colors.text.primary,
                marginBottom: spacing['3xl'],
              }}
            >
              What you can do
            </h2>
          </FadeInSection>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: spacing.lg,
            }}
          >
            {useCases.map((uc, i) => (
              <FadeInSection key={uc.title} delay={i * 60}>
                <div
                  style={{
                    border: `1px solid ${colors.border.light}`,
                    borderRadius: spacing.md,
                    padding: spacing.xl,
                    backgroundColor: colors.white,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      fontFamily: typography.fontFamily.primary,
                      color: colors.text.primary,
                      marginBottom: 4,
                    }}
                  >
                    {uc.title}
                  </h3>
                  <p
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      fontFamily: typography.fontFamily.body,
                      lineHeight: typography.lineHeight.normal,
                      margin: 0,
                    }}
                  >
                    {uc.description}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                    <TerminalBlock lines={uc.terminal} compact />
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </div>

      {/* ━━━ VIDEO ━━━ */}
      <div
        style={{
          paddingTop: spacing['4xl'],
          paddingBottom: spacing['4xl'],
          backgroundColor: colors.white,
          ...SECTION_PX,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <div style={CONTAINER}>
          <FadeInSection>
            <h2
              style={{
                fontFamily: typography.fontFamily.primary,
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize['3xl'],
                color: colors.text.primary,
                marginBottom: spacing.lg,
              }}
            >
              Demo
            </h2>
          </FadeInSection>
          <FadeInSection delay={100}>
            <p
              style={{
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
                fontFamily: typography.fontFamily.body,
                color: colors.text.secondary,
                maxWidth: 600,
                marginBottom: spacing.xl,
              }}
            >
              Watch how the plugin examines the impact of TANF on a household in LA County — from a
              plain-English prompt to a full household-level analysis.
            </p>
            <div style={{ maxWidth: 800 }}>
              <div
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
              </div>
              <p
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.tertiary,
                  fontFamily: typography.fontFamily.body,
                  marginTop: spacing.sm,
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
              </p>
            </div>
          </FadeInSection>
        </div>
      </div>

      {/* ━━━ MICROSIMULATION ━━━ */}
      <div
        style={{
          paddingTop: spacing['4xl'],
          paddingBottom: spacing['4xl'],
          backgroundColor: colors.white,
          ...SECTION_PX,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <div style={CONTAINER}>
          <FadeInSection>
            <h2
              style={{
                fontFamily: typography.fontFamily.primary,
                fontWeight: typography.fontWeight.bold,
                fontSize: typography.fontSize['3xl'],
                color: colors.text.primary,
                marginBottom: spacing.sm,
              }}
            >
              Population-level policy analysis
            </h2>
            <p
              style={{
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
                fontFamily: typography.fontFamily.body,
                color: colors.text.secondary,
                maxWidth: 540,
                marginBottom: spacing['3xl'],
              }}
            >
              The analysis-tools plugin turns Claude into a microsimulation analyst. Point it at any
              tax or benefit reform and it runs full population analysis using PolicyEngine&apos;s
              weighted survey data.
            </p>
          </FadeInSection>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: spacing.sm,
            }}
          >
            {microsimFeatures.map((f, i) => (
              <FadeInSection key={f.title} delay={i * 50}>
                <div
                  style={{
                    paddingTop: spacing.lg,
                    paddingBottom: spacing.lg,
                    paddingLeft: spacing.md,
                    paddingRight: spacing.md,
                    borderLeft: `2px solid ${colors.primary[200]}`,
                  }}
                >
                  <div
                    style={{
                      fontWeight: typography.fontWeight.semibold,
                      fontFamily: typography.fontFamily.primary,
                      fontSize: typography.fontSize.sm,
                      color: colors.text.primary,
                      marginBottom: 2,
                    }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.text.tertiary,
                      fontFamily: typography.fontFamily.body,
                      lineHeight: typography.lineHeight.normal,
                    }}
                  >
                    {f.desc}
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </div>

      {/* ━━━ DARK CLOSING — stats + read more ━━━ */}
      <div
        style={{
          paddingTop: spacing['4xl'],
          paddingBottom: spacing['4xl'],
          backgroundColor: colors.gray[900],
          ...SECTION_PX,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
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
        <div style={{ ...CONTAINER, position: 'relative' }}>
          {/* Read more */}
          <FadeInSection>
            <h2
              style={{
                fontFamily: typography.fontFamily.primary,
                fontWeight: typography.fontWeight.bold,
                fontSize: typography.fontSize['3xl'],
                color: colors.white,
                textAlign: 'center',
                marginBottom: spacing['3xl'],
              }}
            >
              Read more
            </h2>
          </FadeInSection>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: spacing.md,
              maxWidth: 700,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {(
              [
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
                <a
                  href={post.href}
                  target={post.external ? '_blank' : undefined}
                  rel={post.external ? 'noopener noreferrer' : undefined}
                  style={{
                    display: 'block',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: spacing.md,
                    padding: spacing.lg,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      fontWeight: typography.fontWeight.semibold,
                      fontFamily: typography.fontFamily.primary,
                      fontSize: typography.fontSize.sm,
                      color: colors.white,
                      marginBottom: 4,
                    }}
                  >
                    {post.title}
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: 'rgba(255,255,255,0.4)',
                      fontFamily: typography.fontFamily.body,
                      lineHeight: typography.lineHeight.normal,
                    }}
                  >
                    {post.desc}
                  </div>
                </a>
              </FadeInSection>
            ))}
          </div>

          {/* Stats */}
          <FadeInSection>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 56,
                flexWrap: 'wrap',
                marginTop: 64,
              }}
            >
              {stats.map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      fontFamily: typography.fontFamily.primary,
                      fontSize: 'clamp(28px, 3vw, 36px)',
                      fontWeight: typography.fontWeight.bold,
                      color: colors.primary[300],
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </span>
                  <div
                    style={{
                      fontFamily: typography.fontFamily.primary,
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '1.8px',
                      color: 'rgba(255,255,255,0.4)',
                      fontWeight: typography.fontWeight.medium,
                      marginTop: 4,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </div>
    </StaticPageLayout>
  );
}
