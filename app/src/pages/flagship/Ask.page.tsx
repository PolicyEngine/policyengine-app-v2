import { useState } from 'react';
import { IconArrowRight, IconInfoCircle } from '@tabler/icons-react';
import { Button, Stack, Text, Title } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

/**
 * Ask — the natural-language entry point of the flagship shell.
 *
 * Phase 2 wires this to the hosted agent service (text → reform preview →
 * simulation → report). Until then the input routes the question into the
 * Build flow so users always have a path forward.
 */
export default function AskPage() {
  const [question, setQuestion] = useState('');
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();

  const examples =
    countryId === 'uk'
      ? [
          'What if the personal allowance rose to £15,000?',
          'Cost of removing the two-child limit',
          'Raise the higher rate threshold to £60,000',
        ]
      : [
          'What if the child tax credit rose to $3,600?',
          'Cost of a $15,000 standard deduction',
          'Eliminate state income tax in Missouri',
        ];

  return (
    <Stack style={{ maxWidth: 720, margin: '0 auto', gap: spacing['3xl'] }}>
      <Stack style={{ gap: spacing.md, marginTop: spacing['4xl'] }}>
        <Title order={1} style={{ textAlign: 'center' }}>
          What policy question can we answer?
        </Title>
        <Text style={{ textAlign: 'center', color: colors.text.secondary }}>
          Describe a reform in plain language and PolicyEngine will map it to model parameters,
          simulate it, and build a report.
        </Text>
      </Stack>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          nav.push(`/${countryId}/build`);
        }}
        style={{
          display: 'flex',
          gap: spacing.md,
          padding: spacing.lg,
          border: `1px solid ${colors.border.light}`,
          borderRadius: 12,
          background: colors.background.primary,
        }}
      >
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="e.g. what would doubling the child tax credit cost?"
          aria-label="Policy question"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.primary,
            background: 'transparent',
          }}
        />
        <Button type="submit" disabled={!question.trim()}>
          Ask
          <IconArrowRight size={16} />
        </Button>
      </form>

      <Stack style={{ gap: spacing.sm }}>
        <Text
          style={{
            fontSize: typography.fontSize.xs,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          Try asking
        </Text>
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setQuestion(example)}
            style={{
              textAlign: 'left',
              padding: `${spacing.sm} ${spacing.md}`,
              border: `1px solid ${colors.border.light}`,
              borderRadius: 8,
              background: colors.background.primary,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
              color: colors.text.primary,
            }}
          >
            {example}
          </button>
        ))}
      </Stack>

      <Stack
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          padding: spacing.lg,
          background: colors.primary[50],
          borderRadius: 8,
          alignItems: 'flex-start',
        }}
      >
        <IconInfoCircle size={18} color={colors.primary[700]} style={{ flexShrink: 0 }} />
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
          AI-assisted analysis is in development. For now, asking routes you to the reform builder;
          soon it will draft the reform for you and show exactly which parameters it set before
          running anything.
        </Text>
      </Stack>
    </Stack>
  );
}
