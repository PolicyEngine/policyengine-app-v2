import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { IconArrowUp, IconSparkles } from '@tabler/icons-react';
import { Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

const IS_TEST = typeof process !== 'undefined' && Boolean(process.env?.VITEST);

/**
 * Cycles a typewriter placeholder through example queries — types one
 * out, pauses, deletes it, moves to the next. Ported from the UK chat
 * interface. Disabled under test to keep renders deterministic.
 */
function useAnimatedPlaceholder(queries: string[], enabled: boolean) {
  const [placeholder, setPlaceholder] = useState('');
  const [queryIndex, setQueryIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!enabled || IS_TEST || queries.length === 0) {
      setPlaceholder('');
      setCharIndex(0);
      setIsDeleting(false);
      return undefined;
    }
    const currentQuery = queries[queryIndex % queries.length];
    const atEnd = charIndex === currentQuery.length && !isDeleting;
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (charIndex < currentQuery.length) {
            setPlaceholder(currentQuery.slice(0, charIndex + 1));
            setCharIndex(charIndex + 1);
          } else {
            setIsDeleting(true);
          }
        } else if (charIndex > 0) {
          setPlaceholder(currentQuery.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setQueryIndex((queryIndex + 1) % queries.length);
        }
      },
      atEnd ? 2000 : isDeleting ? 30 : 50
    );
    return () => clearTimeout(timeout);
  }, [queries, queryIndex, charIndex, isDeleting, enabled]);

  return placeholder;
}

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** Example queries the placeholder types out while the page is idle. */
  examples: string[];
  /** Animate the placeholder (empty transcript only). */
  animatePlaceholder: boolean;
  /** Small muted note shown bottom-left of the composer. */
  note?: string;
}

/**
 * The pill-shaped chat composer from the UK chat interface: borderless
 * textarea in a rounded surface card, animated typewriter placeholder,
 * circular send button. Enter sends; Shift+Enter adds a line.
 */
export default function ChatComposer({
  value,
  onChange,
  onSend,
  examples,
  animatePlaceholder,
  note,
}: ChatComposerProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const animated = useAnimatedPlaceholder(examples, animatePlaceholder && !value);
  const canSend = value.trim().length > 0;

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        onSend();
        const el = inputRef.current;
        if (el) {
          el.style.height = 'auto';
        }
      }
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${colors.border.light}`,
        background: colors.background.primary,
        borderRadius: 24,
        padding: `${spacing.md} ${spacing.lg} ${spacing.sm}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div style={{ position: 'relative' }}>
        {!value && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 2,
              left: 0,
              fontSize: typography.fontSize.base,
              lineHeight: 1.5,
              color: colors.gray[400],
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              maxWidth: '100%',
            }}
          >
            {animatePlaceholder ? animated || 'Describe a reform' : 'Describe a reform'}
            {animatePlaceholder && (
              <span
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: '1em',
                  background: colors.gray[400],
                  marginLeft: 1,
                  verticalAlign: 'text-bottom',
                  animation: 'pe-caret-blink 1s step-end infinite',
                }}
              />
            )}
            <style>{`@keyframes pe-caret-blink { 50% { opacity: 0; } }`}</style>
          </div>
        )}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            autoResize(event.target);
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Policy question"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: typography.fontSize.base,
            lineHeight: 1.5,
            color: colors.text.primary,
            fontFamily: typography.fontFamily.primary,
            resize: 'none',
            padding: '2px 0',
            overflowY: 'hidden',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div
        style={{
          marginTop: spacing.xs,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        {note ? (
          <Text
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            <IconSparkles size={12} style={{ flexShrink: 0 }} />
            {note}
          </Text>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: canSend ? colors.primary[500] : colors.gray[100],
            color: canSend ? colors.white : colors.gray[400],
            border: 'none',
            cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            flexShrink: 0,
            transition: 'background 120ms',
          }}
        >
          <IconArrowUp size={16} />
        </button>
      </div>
    </div>
  );
}
