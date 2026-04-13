import { IconArrowRight, IconHome, IconScale, IconShare3 } from '@tabler/icons-react';
import { Button, Container, Group, Stack, Text, Title } from '@/components/ui';
import { WEBSITE_URL } from '@/constants';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { CountryId } from '@/libs/countries';

type SupportedCountry = 'us' | 'uk';
type LaunchContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  householdCta: string;
  reportCta: string;
  householdDescription: string;
  reportDescription: string;
  outputs: string[];
  explainer: string;
};

const DEFAULT_LAUNCH_CONTENT: LaunchContent = {
  eyebrow: 'Household and policy analysis',
  title: 'Run household calculations and policy reports',
  subtitle:
    'Model a custom household, compare current law to reforms, and inspect income, taxes, benefits, and poverty impacts in one place.',
  householdCta: 'Start household calculation',
  reportCta: 'Build population report',
  householdDescription:
    'Check a household against current policy or a reform without starting from the full report workflow.',
  reportDescription:
    'Generate national or regional analyses for distribution, budget, and poverty impacts.',
  outputs: [
    'Household disposable income',
    'Tax and benefit changes',
    'Shareable and reproducible results',
  ],
  explainer:
    'Saved work stays in this browser unless you create a share link, so first-run users can start immediately without an account.',
};

const LAUNCH_CONTENT: Record<SupportedCountry, LaunchContent> = {
  us: {
    eyebrow: 'Poverty and household policy analysis',
    title: 'Run Supplemental Poverty Measure calculations and policy reports',
    subtitle:
      'Model a custom household, compare current law to reforms, and inspect SPM poverty, net income, taxes, and benefits in one place.',
    householdCta: 'Start household calculation',
    reportCta: 'Build population report',
    householdDescription:
      'Check a family or individual against current law and proposed reforms with a faster path into the household builder.',
    reportDescription:
      'Generate nationwide, state, or district analyses for budget, distribution, and poverty impacts.',
    outputs: [
      'SPM poverty status and gap',
      'Net income, taxes, and benefits',
      'Shareable and reproducible results',
    ],
    explainer:
      'Saved work stays in this browser unless you create a share link, so first-run users can start immediately without an account.',
  },
  uk: {
    eyebrow: 'Household and policy analysis',
    title: 'Run household calculations and poverty impact reports',
    subtitle:
      'Model a custom household, compare current law to reforms, and inspect income, taxes, benefits, and poverty impacts in one place.',
    householdCta: 'Start household calculation',
    reportCta: 'Build population report',
    householdDescription:
      'Check a household against current policy or a reform without starting from the full report workflow.',
    reportDescription:
      'Generate nationwide or regional analyses for distribution, budget, and poverty impacts.',
    outputs: [
      'Household disposable income',
      'Tax and benefit changes',
      'Shareable and reproducible results',
    ],
    explainer:
      'Saved work stays in this browser unless you create a share link, so first-run users can start immediately without an account.',
  },
};

export function getLaunchContent(countryId: CountryId): LaunchContent {
  return LAUNCH_CONTENT[countryId as SupportedCountry] ?? DEFAULT_LAUNCH_CONTENT;
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="tw:h-full tw:rounded-2xl tw:border tw:border-white/70 tw:bg-white/85 tw:p-6 tw:backdrop-blur"
      style={{ boxShadow: `0 18px 48px ${colors.shadow.light}` }}
    >
      <div
        className="tw:mb-4 tw:flex tw:h-11 tw:w-11 tw:items-center tw:justify-center tw:rounded-xl"
        style={{ backgroundColor: colors.primary[50], color: colors.primary[700] }}
      >
        {icon}
      </div>
      <Title
        order={2}
        style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.title,
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Title>
      <Text style={{ color: colors.text.secondary, lineHeight: 1.6 }}>{description}</Text>
    </div>
  );
}

export default function CalculatorLaunchPage() {
  const countryId = useCurrentCountry();
  const nav = useAppNavigate();
  const content = getLaunchContent(countryId);

  return (
    <Container size="xl" className="tw:px-xl">
      <Stack gap="xl">
        <section
          className="tw:relative tw:overflow-hidden tw:rounded-[28px] tw:border tw:border-white/70 tw:p-8 md:tw:p-10"
          style={{
            background: `linear-gradient(135deg, ${colors.primary[700]} 0%, ${colors.primary[500]} 48%, ${colors.primary[100]} 100%)`,
            boxShadow: `0 24px 72px ${colors.shadow.medium}`,
          }}
        >
          <div
            className="tw:pointer-events-none tw:absolute tw:-right-12 tw:-top-10 tw:h-40 tw:w-40 tw:rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          />
          <div
            className="tw:pointer-events-none tw:absolute tw:-bottom-12 tw:left-1/2 tw:h-52 tw:w-52 tw:-translate-x-1/2 tw:rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
          />

          <div className="tw:relative tw:grid tw:grid-cols-1 tw:gap-8 lg:tw:grid-cols-[1.35fr_0.95fr] lg:tw:items-center">
            <div>
              <Text
                className="tw:mb-3 tw:inline-flex tw:rounded-full tw:px-3 tw:py-1"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  color: colors.white,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                {content.eyebrow}
              </Text>
              <Title
                order={1}
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3.4rem)',
                  lineHeight: 1.05,
                  color: colors.white,
                  marginBottom: spacing.md,
                }}
              >
                {content.title}
              </Title>
              <Text
                size="lg"
                style={{
                  color: 'rgba(255,255,255,0.92)',
                  maxWidth: '52rem',
                  lineHeight: 1.65,
                  marginBottom: spacing.xl,
                }}
              >
                {content.subtitle}
              </Text>
              <Group className="tw:flex-wrap tw:gap-3">
                <Button
                  size="lg"
                  className="tw:bg-white tw:text-primary-700 hover:tw:bg-white/90"
                  onClick={() => nav.push(`/${countryId}/households/create?scope=household`)}
                >
                  {content.householdCta}
                  <IconArrowRight size={18} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="tw:border-white/60 tw:bg-white/10 tw:text-white hover:tw:bg-white/20"
                  onClick={() => nav.push(`/${countryId}/reports/create`)}
                >
                  {content.reportCta}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="tw:text-white hover:tw:bg-white/12"
                  onClick={() => nav.push(`/${countryId}/reports`)}
                >
                  Open saved work
                </Button>
              </Group>
              <Text
                className="tw:mt-5"
                style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '46rem', lineHeight: 1.6 }}
              >
                {content.explainer}
              </Text>
            </div>

            <div className="tw:grid tw:gap-4">
              <div
                className="tw:rounded-2xl tw:border tw:border-white/45 tw:bg-white/12 tw:p-6 tw:backdrop-blur"
                style={{ color: colors.white }}
              >
                <Text
                  className="tw:mb-2"
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  What you can inspect
                </Text>
                <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-3 tw:p-0">
                  {content.outputs.map((output) => (
                    <li key={output} className="tw:flex tw:items-start tw:gap-3">
                      <div
                        className="tw:mt-1 tw:h-2.5 tw:w-2.5 tw:shrink-0 tw:rounded-full"
                        style={{ backgroundColor: colors.white }}
                      />
                      <Text style={{ color: colors.white, lineHeight: 1.5 }}>{output}</Text>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tw:rounded-2xl tw:border tw:border-white/45 tw:bg-gray-950/20 tw:p-6 tw:backdrop-blur">
                <Text
                  className="tw:mb-2"
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  Good launch posture
                </Text>
                <Text style={{ color: colors.white, lineHeight: 1.7 }}>
                  Clear household entry, shareable report links, and a separate saved-work area so
                  first-time visitors do not land on an empty internal screen.
                </Text>
              </div>
            </div>
          </div>
        </section>

        <section className="tw:grid tw:grid-cols-1 tw:gap-5 lg:tw:grid-cols-3">
          <FeatureCard
            icon={<IconHome size={22} />}
            title="Household calculations"
            description={content.householdDescription}
          />
          <FeatureCard
            icon={<IconScale size={22} />}
            title="Population-wide reports"
            description={content.reportDescription}
          />
          <FeatureCard
            icon={<IconShare3 size={22} />}
            title="Sharing and reproducibility"
            description="Copy a share link for report output, keep local saved work for iteration, and jump to the Python reproduction view when you need exact implementation details."
          />
        </section>

        <section className="tw:grid tw:grid-cols-1 tw:gap-5 lg:tw:grid-cols-[1.25fr_0.75fr]">
          <div
            className="tw:rounded-2xl tw:border tw:bg-white tw:p-6"
            style={{
              borderColor: colors.border.light,
              boxShadow: `0 14px 42px ${colors.shadow.light}`,
            }}
          >
            <Title
              order={3}
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.title,
                marginBottom: spacing.sm,
              }}
            >
              Recommended first steps
            </Title>
            <ol className="tw:m-0 tw:flex tw:list-decimal tw:flex-col tw:gap-3 tw:pl-5">
              <li>
                <Text style={{ color: colors.text.secondary, lineHeight: 1.6 }}>
                  Start with a household calculation if you want an immediate answer for one family
                  or individual.
                </Text>
              </li>
              <li>
                <Text style={{ color: colors.text.secondary, lineHeight: 1.6 }}>
                  Build a population report if you want national, state, or district-level poverty
                  and budget effects.
                </Text>
              </li>
              <li>
                <Text style={{ color: colors.text.secondary, lineHeight: 1.6 }}>
                  Use saved work for iteration and share links only once the output is ready to
                  send.
                </Text>
              </li>
            </ol>
          </div>

          <div
            className="tw:rounded-2xl tw:border tw:bg-white tw:p-6"
            style={{
              borderColor: colors.border.light,
              boxShadow: `0 14px 42px ${colors.shadow.light}`,
            }}
          >
            <Title
              order={3}
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.title,
                marginBottom: spacing.sm,
              }}
            >
              Learn more
            </Title>
            <Stack gap="sm">
              <a
                href={`${WEBSITE_URL}/${countryId}/research`}
                target="_blank"
                rel="noreferrer"
                className="tw:rounded-xl tw:border tw:px-4 tw:py-3 tw:no-underline"
                style={{ borderColor: colors.border.light, color: colors.text.title }}
              >
                Research and methodology
              </a>
              <a
                href={`${WEBSITE_URL}/${countryId}/model`}
                target="_blank"
                rel="noreferrer"
                className="tw:rounded-xl tw:border tw:px-4 tw:py-3 tw:no-underline"
                style={{ borderColor: colors.border.light, color: colors.text.title }}
              >
                Model explorer
              </a>
              <a
                href={`${WEBSITE_URL}/${countryId}/api`}
                target="_blank"
                rel="noreferrer"
                className="tw:rounded-xl tw:border tw:px-4 tw:py-3 tw:no-underline"
                style={{ borderColor: colors.border.light, color: colors.text.title }}
              >
                API documentation
              </a>
            </Stack>
          </div>
        </section>
      </Stack>
    </Container>
  );
}
