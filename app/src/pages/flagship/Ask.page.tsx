import { useEffect, useRef, useState } from 'react';
import {
  IconAdjustments,
  IconChevronRight,
  IconFolder,
  IconGavel,
  IconPlus,
} from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';
import remarkGfm from 'remark-gfm';
import { isUkChatEnabled, streamUkChatTurn, toolActivityLabel, UkChatMessage } from '@/api/ukChat';
import ChatComposer from '@/components/flagship/ChatComposer';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Stack, Text, Title } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { addDraftProvision, provisionFromSearchEntry, useDraftReform } from '@/libs/draftReform';
import {
  ChatReformBridge,
  provisionsFromChatReform,
  reformFromToolInput,
} from '@/libs/flagship/chatDraftBridge';
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

interface ChatTurnState {
  answer: string;
  status: 'streaming' | 'done' | 'error';
  /** Human-readable label of the tool currently running, if any */
  activity: string | null;
  suggestions: string[];
  /** Provisions extracted from the model's validated reform, if any */
  bridge: ChatReformBridge | null;
}

interface AskTurn {
  question: string;
  matches: ParameterSearchEntry[];
  /** Present when the turn ran through the live UK chat service */
  chat?: ChatTurnState;
  /** Set when the chat service failed and matches are the fallback */
  fallback?: boolean;
}

/** Markdown answer styled to sit inside the chat transcript. */
function ChatAnswer({ content }: { content: string }) {
  return (
    <div
      style={{
        fontSize: typography.fontSize.sm,
        lineHeight: 1.6,
        color: colors.text.primary,
        fontFamily: typography.fontFamily.primary,
        overflowWrap: 'break-word',
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
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
        height: '100%',
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
  const chatEnabled = isUkChatEnabled(countryId);

  const sessionRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  /** Applies a patch to the newest turn's chat state. */
  const patchLastChat = (patch: (chat: ChatTurnState) => ChatTurnState) => {
    setTurns((prev) => {
      const last = prev[prev.length - 1];
      if (!last?.chat) {
        return prev;
      }
      return [...prev.slice(0, -1), { ...last, chat: patch(last.chat) }];
    });
  };

  const sendChatTurn = (question: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const history: UkChatMessage[] = turns.flatMap((turn) => {
      const messages: UkChatMessage[] = [{ role: 'user', content: turn.question }];
      if (turn.chat?.answer) {
        messages.push({ role: 'assistant', content: turn.chat.answer });
      }
      return messages;
    });

    setTurns((prev) => [
      // A new question aborts any in-flight turn; settle it so it doesn't
      // sit on "Thinking…" forever.
      ...prev.map((turn) =>
        turn.chat?.status === 'streaming'
          ? {
              ...turn,
              chat: {
                ...turn.chat,
                status: 'done' as const,
                activity: null,
                answer: turn.chat.answer || 'Interrupted by the next question.',
              },
            }
          : turn
      ),
      {
        question,
        matches: [],
        chat: { answer: '', status: 'streaming', activity: null, suggestions: [], bridge: null },
      },
    ]);

    streamUkChatTurn(
      {
        messages: [...history, { role: 'user', content: question }],
        sessionId: sessionRef.current,
      },
      {
        onChunk: (text) =>
          patchLastChat((chat) => ({ ...chat, answer: chat.answer + text, activity: null })),
        onToolStart: ({ toolName }) =>
          patchLastChat((chat) => ({ ...chat, activity: toolActivityLabel(toolName) })),
        onToolUse: ({ toolName, toolInput }) => {
          const reform = reformFromToolInput(toolName, toolInput);
          if (!reform) {
            return;
          }
          const bridge = provisionsFromChatReform(reform, index.entries, parameters);
          if (bridge.provisions.length > 0) {
            patchLastChat((chat) => ({ ...chat, bridge }));
          }
        },
        onSuggestions: (suggestions) => patchLastChat((chat) => ({ ...chat, suggestions })),
        onDone: ({ content, sessionId }) => {
          sessionRef.current = sessionId ?? sessionRef.current;
          patchLastChat((chat) => ({
            ...chat,
            answer: content || chat.answer,
            status: 'done',
            activity: null,
          }));
        },
        onError: (message) =>
          patchLastChat((chat) => ({
            ...chat,
            answer: chat.answer || message,
            status: 'error',
            activity: null,
          })),
      },
      { signal: controller.signal }
    ).catch(() => {
      if (controller.signal.aborted) {
        return;
      }
      // Service unreachable — degrade this turn to the keyword matcher.
      setTurns((prev) => {
        const last = prev[prev.length - 1];
        if (!last?.chat || last.chat.status !== 'streaming') {
          return prev;
        }
        return [
          ...prev.slice(0, -1),
          {
            question: last.question,
            matches: searchParameters(index, last.question, 6),
            fallback: true,
          },
        ];
      });
    });
  };

  const send = (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question) {
      return;
    }
    setInput('');
    if (chatEnabled) {
      sendChatTurn(question);
      return;
    }
    setTurns((prev) => [...prev, { question, matches: searchParameters(index, question, 6) }]);
  };

  const addBridgeToDraft = (bridge: ChatReformBridge) => {
    bridge.provisions.forEach((provision) =>
      addDraftProvision(countryId, provision, 'chat', 'uk-chat')
    );
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
          <Text
            style={{
              fontSize: 11,
              fontFamily: typography.fontFamily.mono,
              color: colors.gray[400],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.path}
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

  const suggestionChipStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    background: colors.background.primary,
    border: `1px solid ${colors.border.light}`,
    borderRadius: 999,
    padding: `${spacing.xs} ${spacing.md}`,
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
    lineHeight: 1.4,
  };

  const renderChatReply = (chat: ChatTurnState) => {
    const bridgeInDraft =
      chat.bridge !== null && chat.bridge.provisions.every((p) => draftPaths.has(p.path));
    return (
      <Stack style={{ gap: spacing.sm }}>
        {chat.activity && (
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
            {chat.activity}…
          </Text>
        )}
        {chat.answer ? (
          <ChatAnswer content={chat.answer} />
        ) : (
          !chat.activity &&
          chat.status === 'streaming' && (
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
              Thinking…
            </Text>
          )
        )}
        {chat.bridge && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
              border: `1px solid ${colors.border.light}`,
              borderRadius: 12,
              padding: spacing.md,
              background: colors.background.primary,
            }}
          >
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.secondary,
              }}
            >
              Reform validated by the model
            </Text>
            {chat.bridge.provisions.map((provision) => (
              <div
                key={provision.path}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: spacing.md,
                }}
              >
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
                  {provision.breadcrumb}
                </Text>
                <Text
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatValue(provision.baselineValue, provision.unit)} →{' '}
                  {formatValue(provision.value, provision.unit)}
                </Text>
              </div>
            ))}
            <button
              type="button"
              disabled={bridgeInDraft}
              onClick={() => chat.bridge && addBridgeToDraft(chat.bridge)}
              style={{
                alignSelf: 'flex-start',
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                fontFamily: typography.fontFamily.primary,
                color: bridgeInDraft ? colors.text.secondary : colors.primary[700],
                background: bridgeInDraft ? colors.gray[50] : colors.primary[50],
                border: 'none',
                borderRadius: 999,
                padding: `${spacing.xs} ${spacing.md}`,
                cursor: bridgeInDraft ? 'default' : 'pointer',
              }}
            >
              {bridgeInDraft ? 'In draft' : 'Add to draft'}
            </button>
          </div>
        )}
        {chat.status === 'done' && chat.suggestions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
            {chat.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                style={suggestionChipStyle}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </Stack>
    );
  };

  const composer = (
    <ChatComposer
      value={input}
      onChange={setInput}
      onSend={() => send()}
      examples={examples}
      animatePlaceholder={!hasTurns}
      note={
        chatEnabled
          ? 'Answers computed live by the PolicyEngine UK model'
          : 'Keyword matching today — AI drafting lands with the hosted analysis service'
      }
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
                title="In Congress"
                detail="Real bills scored with the model"
                onClick={() => nav.push(`/${countryId}/reforms?filter=bills`)}
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
                title="Your reforms"
                detail="Your saved reforms"
                onClick={() => nav.push(`/${countryId}/reforms?filter=yours`)}
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
              {turn.chat ? (
                renderChatReply(turn.chat)
              ) : (
                <Stack style={{ gap: spacing.sm }}>
                  {turn.matches.length === 0 ? (
                    <Text
                      style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}
                    >
                      No parameters matched that phrasing — try naming the program or amount, or
                      browse in Build.
                    </Text>
                  ) : (
                    <>
                      <Text
                        style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}
                      >
                        {turn.fallback
                          ? 'The chat service is unreachable — here’s what matched by keyword instead.'
                          : "Here's what matched — click to add it to your draft."}
                      </Text>
                      {turn.matches.map((entry) => renderMatchRow(entry, turn.question))}
                    </>
                  )}
                </Stack>
              )}
            </Stack>
          ))}
        </Stack>
        <div style={{ position: 'sticky', bottom: spacing.lg }}>{composer}</div>
      </Stack>
    </WorkspaceLayout>
  );
}
