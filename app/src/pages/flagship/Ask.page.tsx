import { useMemo, useState } from 'react';
import { IconPlus, IconSparkles } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { addDraftProvision, provisionFromSearchEntry, useDraftReform } from '@/libs/draftReform';
import {
  ParameterSearchEntry,
  searchParameters,
  selectParameterSearchIndex,
} from '@/libs/parameterSearch';
import { RootState } from '@/store';
import { formatValue, getCurrentValue, parseValueFromQuestion } from '@/utils/parameterValues';

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
 * Matching happens live as you type; clicking a match adds it to the
 * draft rail with the value parsed from your question when possible
 * ("to $3,600" prefills 3600). The hosted agent replaces the matcher
 * in phase 2 behind the same interaction.
 */
export default function AskPage() {
  const [question, setQuestion] = useState('');
  const countryId = useCurrentCountry();
  const draft = useDraftReform();
  const index = useSelector(selectParameterSearchIndex);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);

  const suggestions = useMemo(() => searchParameters(index, question, 6), [index, question]);
  const examples = EXAMPLES[countryId] ?? EXAMPLES.default;
  const draftPaths = new Set(draft?.provisions.map((p) => p.path) ?? []);

  const addSuggestion = (entry: ParameterSearchEntry) => {
    const provision = provisionFromSearchEntry(entry, parameters?.[entry.path]?.values);
    const proposed = parseValueFromQuestion(question, entry.unit);
    addDraftProvision(
      countryId,
      proposed === undefined ? provision : { ...provision, value: proposed },
      'chat',
      'ask-keyword-v0'
    );
  };

  return (
    <WorkspaceLayout>
      <Stack style={{ gap: spacing.lg }}>
        <Stack style={{ gap: spacing.xs }}>
          <Title order={1}>Ask a policy question</Title>
          <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
            Describe a reform in plain language — matches appear as you type, and amounts in your
            question carry into the draft.
          </Text>
        </Stack>

        <div
          style={{
            display: 'flex',
            gap: spacing.md,
            padding: `${spacing.md} ${spacing.lg}`,
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
        </div>

        {!question.trim() && (
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
        )}

        {question.trim().length >= 2 && (
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
              Matching parameters — click to add
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
                <button
                  key={entry.path}
                  type="button"
                  disabled={inDraft}
                  onClick={() => addSuggestion(entry)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: `${spacing.sm} ${spacing.md}`,
                    border: `1px solid ${inDraft ? colors.primary[500] : colors.border.light}`,
                    borderRadius: 8,
                    background: inDraft ? colors.primary[50] : colors.background.primary,
                    cursor: inDraft ? 'default' : 'pointer',
                    textAlign: 'left',
                    fontFamily: typography.fontFamily.primary,
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
                    <Text
                      style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}
                    >
                      current: {formatValue(baseline, entry.unit)}
                    </Text>
                  </Stack>
                  {inDraft ? (
                    <Text
                      style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.primary[700],
                        fontWeight: typography.fontWeight.medium,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      In draft
                    </Text>
                  ) : (
                    <IconPlus size={16} color={colors.text.secondary} style={{ flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
            <Stack
              style={{
                flexDirection: 'row',
                gap: spacing.sm,
                padding: spacing.sm,
                background: colors.primary[50],
                borderRadius: 8,
                alignItems: 'flex-start',
              }}
            >
              <IconSparkles size={14} color={colors.primary[700]} style={{ flexShrink: 0 }} />
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.primary }}>
                Matching is keyword-based today; AI drafting lands with the hosted analysis service.
              </Text>
            </Stack>
          </Stack>
        )}
      </Stack>
    </WorkspaceLayout>
  );
}
