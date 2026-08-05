import { useState } from 'react';
import {
  IconAdjustments,
  IconChevronRight,
  IconFolder,
  IconGavel,
  IconPlus,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import ChatComposer from '@/components/flagship/ChatComposer';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Stack, Text, Title } from '@/components/ui';
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

/** Option-style tile linking a blank-state entry to its section. */
function SectionTile({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: React.ComponentType<{ size: number; color?: string }>;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: `${spacing.sm} ${spacing.md}`,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 10,
        background: colors.background.primary,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: typography.fontFamily.primary,
        width: '100%',
        transition: 'border-color 120ms, box-shadow 120ms',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = colors.primary[500];
        event.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.06)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = colors.border.light;
        event.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Icon size={18} color={colors.text.secondary} />
      <Stack style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {detail}
        </Text>
      </Stack>
      <IconChevronRight size={14} color={colors.text.secondary} style={{ flexShrink: 0 }} />
    </button>
  );
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
        <Stack style={{ minHeight: 'calc(100vh - 128px)', gap: 0 }}>
          <Stack style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>
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
          </Stack>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: spacing.md,
              paddingBottom: spacing.xl,
            }}
          >
            <div style={{ flex: '1 1 220px', minWidth: 200 }}>
              <SectionTile
                icon={IconGavel}
                title="Tracker"
                detail="Real bills scored with the model"
                onClick={() => nav.push(`/${countryId}/tracker`)}
              />
            </div>
            <div style={{ flex: '1 1 220px', minWidth: 200 }}>
              <SectionTile
                icon={IconAdjustments}
                title="Build"
                detail="Search or browse every parameter"
                onClick={() => nav.push(`/${countryId}/build`)}
              />
            </div>
            <div style={{ flex: '1 1 220px', minWidth: 200 }}>
              <SectionTile
                icon={IconFolder}
                title="Library"
                detail="Your saved reforms"
                onClick={() => nav.push(`/${countryId}/library`)}
              />
            </div>
          </div>
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
