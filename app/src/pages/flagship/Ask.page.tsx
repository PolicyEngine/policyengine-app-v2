import { useMemo, useState } from 'react';
import { IconArrowRight, IconFolder, IconPlus, IconSparkles } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getReformStore } from '@/api/reformStore';
import BackToHome from '@/components/flagship/BackToHome';
import ReformPreviewCard from '@/components/flagship/ReformPreviewCard';
import { Button, Stack, Text, Title } from '@/components/ui';
import { MOCK_USER_ID } from '@/constants';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { addDraftProvision, provisionFromSearchEntry, useDraftReform } from '@/libs/draftReform';
import {
  ParameterSearchEntry,
  searchParameters,
  selectParameterSearchIndex,
} from '@/libs/parameterSearch';
import { RootState } from '@/store';
import { formatValue, getCurrentValue } from '@/utils/parameterValues';

const EXAMPLES: Record<string, string[]> = {
  uk: [
    'Raise the personal allowance to £15,000',
    'Remove the two-child limit',
    'Raise the higher rate threshold to £60,000',
  ],
  default: [
    'Raise the child tax credit to $3,600',
    'Increase the standard deduction',
    'Raise the SNAP maximum allotment',
  ],
};

/**
 * Ask — the natural-language entry point of the flagship shell.
 *
 * Today: the question runs through the parameter search index, matched
 * parameters become suggested provisions, and accepted ones build a
 * draft reform in the preview card. Phase 2 replaces the matcher with
 * the hosted agent (which will also draft the values), keeping the same
 * preview-then-confirm contract.
 */
export default function AskPage() {
  const [question, setQuestion] = useState('');
  const [submitted, setSubmitted] = useState('');
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const draft = useDraftReform();
  const index = useSelector(selectParameterSearchIndex);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);

  const suggestions = useMemo(
    () => (submitted ? searchParameters(index, submitted, 6) : []),
    [index, submitted]
  );

  const { data: recentReforms } = useQuery({
    queryKey: ['reforms', MOCK_USER_ID, countryId],
    queryFn: () => getReformStore().findByUser(MOCK_USER_ID, countryId),
  });

  const examples = EXAMPLES[countryId] ?? EXAMPLES.default;
  const draftPaths = new Set(draft?.provisions.map((p) => p.path) ?? []);

  const addSuggestion = (entry: ParameterSearchEntry) => {
    addDraftProvision(
      countryId,
      provisionFromSearchEntry(entry, parameters?.[entry.path]?.values),
      'chat',
      'ask-keyword-v0'
    );
  };

  return (
    <Stack style={{ maxWidth: 720, margin: '0 auto', gap: spacing['2xl'] }}>
      <BackToHome />
      <Stack style={{ gap: spacing.md }}>
        <Title order={1} style={{ textAlign: 'center' }}>
          What policy question can we answer?
        </Title>
        <Text style={{ textAlign: 'center', color: colors.text.secondary }}>
          Describe a reform in plain language. PolicyEngine matches it to model parameters you can
          edit, save, and simulate.
        </Text>
      </Stack>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(question);
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
          placeholder="e.g. raise the child tax credit to $3,600"
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

      {!submitted && (
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
              onClick={() => {
                setQuestion(example);
                setSubmitted(example);
              }}
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
      )}

      {submitted && (
        <Stack style={{ gap: spacing.md }}>
          <Text
            style={{
              fontSize: typography.fontSize.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            Matching parameters
          </Text>
          {suggestions.length === 0 && (
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              No parameters matched that phrasing — try naming the program or amount, or browse in
              Build.
            </Text>
          )}
          {suggestions.map((entry) => {
            const inDraft = draftPaths.has(entry.path);
            const baseline = getCurrentValue(parameters?.[entry.path]?.values);
            return (
              <Stack
                key={entry.path}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: `${spacing.sm} ${spacing.md}`,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: 8,
                  background: colors.background.primary,
                }}
              >
                <Stack style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                    }}
                  >
                    {entry.breadcrumb || entry.label}
                  </Text>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                    current: {formatValue(baseline, entry.unit)}
                  </Text>
                </Stack>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={inDraft}
                  onClick={() => addSuggestion(entry)}
                >
                  {inDraft ? 'Added' : 'Add'}
                  {!inDraft && <IconPlus size={14} />}
                </Button>
              </Stack>
            );
          })}
          <Stack
            style={{
              flexDirection: 'row',
              gap: spacing.md,
              padding: spacing.md,
              background: colors.primary[50],
              borderRadius: 8,
              alignItems: 'flex-start',
            }}
          >
            <IconSparkles size={16} color={colors.primary[700]} style={{ flexShrink: 0 }} />
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.primary }}>
              Matching is keyword-based today. AI drafting — which will also propose the values —
              lands with the hosted analysis service.
            </Text>
          </Stack>
        </Stack>
      )}

      {draft && draft.countryId === countryId && draft.provisions.length > 0 && (
        <ReformPreviewCard draft={draft} />
      )}

      {recentReforms && recentReforms.length > 0 && (
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
            Recent reforms
          </Text>
          {recentReforms.slice(0, 3).map((reform) => (
            <Stack
              key={reform.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: spacing.md,
                padding: `${spacing.sm} ${spacing.md}`,
                border: `1px solid ${colors.border.light}`,
                borderRadius: 8,
                background: colors.background.primary,
              }}
            >
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
                {reform.label || 'Untitled reform'}
              </Text>
              <Button variant="ghost" size="sm" onClick={() => nav.push(`/${countryId}/library`)}>
                <IconFolder size={14} />
                Library
              </Button>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
