import { useState } from 'react';
import { IconChevronRight, IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getReformStore } from '@/api/reformStore';
import ChatComposer from '@/components/flagship/ChatComposer';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Stack, Text, Title } from '@/components/ui';
import { MOCK_USER_ID } from '@/constants';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { SAMPLE_BILLS } from '@/data/flagship/sampleBills';
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
    'Increase the basic rate to 21%',
  ],
  default: [
    'Raise the child tax credit to $3,600',
    'Increase the standard deduction',
    'Raise the SNAP maximum allotment',
    'Set the top income tax rate to 39.6%',
  ],
};

interface AskTurn {
  question: string;
  matches: ParameterSearchEntry[];
}

/**
 * Ask — the natural-language entry point of the flagship shell, styled
 * after the UK chat interface: a centered pill composer with a
 * typewriter placeholder, questions as right-aligned bubbles, and the
 * matched parameters as the reply. Clicking a match adds it to the
 * draft rail with the value parsed from that question when possible
 * ("to $3,600" prefills 3600). The hosted agent replaces the matcher
 * in phase 2 behind the same interface.
 */
export default function AskPage() {
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const draft = useDraftReform();
  const index = useSelector(selectParameterSearchIndex);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);

  const { data: reforms } = useQuery({
    queryKey: ['reforms', MOCK_USER_ID, countryId],
    queryFn: () => getReformStore().findByUser(MOCK_USER_ID, countryId),
  });
  const recentReforms = (reforms ?? []).slice(0, 3);
  const bills = SAMPLE_BILLS.filter((bill) => bill.countryId === countryId).slice(0, 3);

  const examples = EXAMPLES[countryId] ?? EXAMPLES.default;
  const draftPaths = new Set(draft?.provisions.map((p) => p.path) ?? []);
  const hasTurns = turns.length > 0;

  const send = (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question) {
      return;
    }
    setTurns((prev) => [...prev, { question, matches: searchParameters(index, question, 6) }]);
    setInput('');
  };

  const addMatch = (entry: ParameterSearchEntry, question: string) => {
    const provision = provisionFromSearchEntry(entry, parameters?.[entry.path]?.values);
    const proposed = parseValueFromQuestion(question, entry.unit);
    addDraftProvision(
      countryId,
      proposed === undefined ? provision : { ...provision, value: proposed },
      'chat',
      'ask-keyword-v0'
    );
  };

  const renderMatchRow = (entry: ParameterSearchEntry, question: string) => {
    const inDraft = draftPaths.has(entry.path);
    const baseline = getCurrentValue(parameters?.[entry.path]?.values);
    return (
      <button
        key={entry.path}
        type="button"
        disabled={inDraft}
        onClick={() => addMatch(entry, question)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          padding: `${spacing.sm} ${spacing.md}`,
          border: `1px solid ${inDraft ? colors.primary[500] : colors.border.light}`,
          borderRadius: 12,
          background: inDraft ? colors.primary[50] : colors.background.primary,
          cursor: inDraft ? 'default' : 'pointer',
          textAlign: 'left',
          fontFamily: typography.fontFamily.primary,
          width: '100%',
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
  };

  const composer = (
    <ChatComposer
      value={input}
      onChange={setInput}
      onSend={() => send()}
      examples={examples}
      animatePlaceholder={!hasTurns}
      note="Keyword matching today — AI drafting lands with the hosted analysis service"
    />
  );

  if (!hasTurns) {
    return (
      <WorkspaceLayout>
        <Stack
          style={{
            gap: spacing.xl,
            justifyContent: 'center',
            minHeight: '55vh',
            paddingBottom: spacing['2xl'],
          }}
        >
          <Title order={1} style={{ textAlign: 'center', fontWeight: 500 }}>
            What do you want to change?
          </Title>
          <div style={{ position: 'relative' }}>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '-40px -60px',
                background: `radial-gradient(ellipse at center, ${colors.primary[100]}, transparent 70%)`,
                filter: 'blur(20px)',
                opacity: 0.6,
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative' }}>{composer}</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: spacing.sm,
              justifyContent: 'center',
            }}
          >
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => send(example)}
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  background: colors.background.primary,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: 999,
                  padding: `${spacing.xs} ${spacing.md}`,
                  cursor: 'pointer',
                  fontFamily: typography.fontFamily.primary,
                  lineHeight: 1.4,
                }}
              >
                {example}
              </button>
            ))}
          </div>

          {(bills.length > 0 || recentReforms.length > 0) && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: spacing['2xl'],
                justifyContent: 'center',
                marginTop: spacing.lg,
              }}
            >
              {bills.length > 0 && (
                <Stack style={{ gap: spacing.xs, flex: '0 1 300px', minWidth: 240 }}>
                  <Text
                    style={{
                      fontSize: typography.fontSize.xs,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: colors.text.secondary,
                      fontWeight: typography.fontWeight.semibold,
                    }}
                  >
                    In Congress
                  </Text>
                  {bills.map((bill) => (
                    <button
                      key={bill.id}
                      type="button"
                      onClick={() => nav.push(`/${countryId}/tracker`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs,
                        border: 'none',
                        background: 'none',
                        padding: `${spacing.xs} 0`,
                        cursor: 'pointer',
                        fontSize: typography.fontSize.sm,
                        fontFamily: typography.fontFamily.primary,
                        color: colors.text.primary,
                        textAlign: 'left',
                      }}
                    >
                      <IconChevronRight
                        size={13}
                        color={colors.text.secondary}
                        style={{ flexShrink: 0 }}
                      />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {bill.title}
                      </span>
                    </button>
                  ))}
                </Stack>
              )}
              {recentReforms.length > 0 && (
                <Stack style={{ gap: spacing.xs, flex: '0 1 300px', minWidth: 240 }}>
                  <Text
                    style={{
                      fontSize: typography.fontSize.xs,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: colors.text.secondary,
                      fontWeight: typography.fontWeight.semibold,
                    }}
                  >
                    Your reforms
                  </Text>
                  {recentReforms.map((reform) => (
                    <button
                      key={reform.id}
                      type="button"
                      onClick={() => nav.push(`/${countryId}/library`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs,
                        border: 'none',
                        background: 'none',
                        padding: `${spacing.xs} 0`,
                        cursor: 'pointer',
                        fontSize: typography.fontSize.sm,
                        fontFamily: typography.fontFamily.primary,
                        color: colors.text.primary,
                        textAlign: 'left',
                      }}
                    >
                      <IconChevronRight
                        size={13}
                        color={colors.text.secondary}
                        style={{ flexShrink: 0 }}
                      />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {reform.label || 'Untitled reform'}
                      </span>
                    </button>
                  ))}
                </Stack>
              )}
            </div>
          )}
        </Stack>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <Stack style={{ gap: spacing.lg, minHeight: '60vh' }}>
        <Stack style={{ gap: spacing.md, flex: 1 }}>
          {turns.map((turn, turnIndex) => (
            <Stack key={turnIndex} style={{ gap: spacing.md }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    background: colors.gray[100],
                    color: colors.text.primary,
                    padding: `${spacing.sm} ${spacing.lg}`,
                    borderRadius: 18,
                    maxWidth: '80%',
                    whiteSpace: 'pre-wrap',
                    fontSize: typography.fontSize.sm,
                    lineHeight: 1.55,
                  }}
                >
                  {turn.question}
                </div>
              </div>
              <Stack style={{ gap: spacing.sm }}>
                {turn.matches.length === 0 ? (
                  <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                    No parameters matched that phrasing — try naming the program or amount, or
                    browse in Build.
                  </Text>
                ) : (
                  <>
                    <Text
                      style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}
                    >
                      Here&apos;s what matched — click to add it to your draft.
                    </Text>
                    {turn.matches.map((entry) => renderMatchRow(entry, turn.question))}
                  </>
                )}
              </Stack>
            </Stack>
          ))}
        </Stack>
        <div style={{ position: 'sticky', bottom: spacing.lg }}>{composer}</div>
      </Stack>
    </WorkspaceLayout>
  );
}
