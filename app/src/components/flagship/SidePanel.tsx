import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconChevronDown, IconX } from '@tabler/icons-react';
import { createPortal } from 'react-dom';
import { Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { PHONE_QUERY } from '@/libs/flagship/viewport';

/**
 * The flagship shell's right plane.
 *
 * Both companions — the draft reform and a report's adjust rail — are
 * the same shape: a column beside the content, folding to a slim spine.
 * The chrome lives here once, and the column is real: the panel portals
 * into a slot that is a flex sibling of the shell's scrolling <main>
 * (see FlagshipShell), so it runs the full height of the page by
 * construction, never scrolls away with the content, and never wraps
 * beneath it. Where the slot does not exist (tests, the legacy shell)
 * the panel renders in place.
 */
export const SIDE_PANEL_SLOT_ID = 'flagship-side-panel-slot';
/** The shell's root (see FlagshipShell): what a phone's open drawer covers. */
const SHELL_ROOT_SELECTOR = '[data-flagship-shell]';

const PANEL_WIDTH = 340;
const SPINE_WIDTH = 40;
/** Width eases over this; the two faces crossfade inside it. */
const WIDTH_MS = 240;
const FADE_MS = 160;
/**
 * Below this the shell cannot spare a 340px column beside the sidebar
 * and the content, so the open panel floats over the content instead.
 * The spine keeps its place in the column as the way back.
 */
const OVERLAY_BELOW = '(max-width: 1023px)';
/**
 * The folded bar's height on a phone: a fingertip, and a line of text.
 * There a spine would take a ninth of the screen, so the shell puts the
 * plane under the content (see FlagshipShell): folded, the panel is a
 * bar across the bottom; open, it fills the screen, as a drawer.
 */
const BAR_HEIGHT = spacing['4xl'];

/** Effects that must run before paint, without warning during SSR. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface SidePanelProps {
  /** Header text, and the label on the folded spine. */
  title: string;
  /**
   * Small uppercase label above the title — the panel's kind ("Draft"),
   * styled like the sidebar's section labels, so the title itself can be
   * the thing's own name.
   */
  kicker?: string;
  /**
   * Right-hand note in the header, repeated on the folded spine: source,
   * count, whatever is short enough to say what is in there.
   */
  meta?: string;
  /** Teal title, for a panel holding unsaved work — the same accent the
   * sidebar gives its active item, not a colored band. */
  accent?: boolean;
  /** Report companions start folded; the draft starts open. */
  defaultOpen?: boolean;
  /**
   * Remember the fold across navigations under this key. The draft
   * panel follows the reader between pages; without persistence every
   * navigation would spring a deliberately folded panel back open.
   */
  storageKey?: string;
  /**
   * The open panel's width; the draft widens while a provision is being
   * edited, so the editor sits in the column instead of over the page.
   */
  width?: number;
  children: React.ReactNode;
}

// Storage can be absent (SSR) or throw (a sandboxed embed, blocked
// cookies); either way the fold is simply not remembered.
function readStoredOpen(storageKey: string | undefined, fallback: boolean): boolean {
  if (!storageKey) {
    return fallback;
  }
  try {
    const stored = sessionStorage.getItem(`side-panel-open:${storageKey}`);
    return stored === null ? fallback : stored === 'true';
  } catch {
    return fallback;
  }
}

function writeStoredOpen(storageKey: string | undefined, open: boolean): void {
  if (!storageKey) {
    return;
  }
  try {
    sessionStorage.setItem(`side-panel-open:${storageKey}`, String(open));
  } catch {
    // Not remembered.
  }
}

export default function SidePanel({
  title,
  kicker,
  meta,
  accent = false,
  defaultOpen = true,
  storageKey,
  width = PANEL_WIDTH,
  children,
}: SidePanelProps) {
  const [open, setOpenState] = useState(() => readStoredOpen(storageKey, defaultOpen));
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const collapseRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  /**
   * Set by the toggle buttons so focus follows the fold onto the other
   * face — the face just used disappears from the tab order, and without
   * this the keyboard lands on <body>. Not set on mount or when the
   * stored fold is restored, where nothing had focus to keep.
   */
  const focusAfterToggle = useRef(false);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const overlay = useMediaQuery(OVERLAY_BELOW);
  const phone = useMediaQuery(PHONE_QUERY);

  useIsomorphicLayoutEffect(() => {
    setSlot(document.getElementById(SIDE_PANEL_SLOT_ID));
  }, []);

  useEffect(() => {
    if (!focusAfterToggle.current) {
      return;
    }
    focusAfterToggle.current = false;
    (open ? collapseRef : expandRef).current?.focus();
  }, [open]);

  // A new key is a new thing to remember (one draft replaced by the next
  // in the same mounted panel): re-read its fold rather than carry the
  // old one over.
  const lastKey = useRef(storageKey);
  useEffect(() => {
    if (lastKey.current === storageKey) {
      return;
    }
    lastKey.current = storageKey;
    setOpenState(readStoredOpen(storageKey, defaultOpen));
  }, [storageKey, defaultOpen]);

  const toggle = (next: boolean) => {
    focusAfterToggle.current = true;
    setOpenState(next);
    writeStoredOpen(storageKey, next);
  };

  // A drawer over the whole screen closes with Escape, as a dialog does —
  // unless the Escape already closed a picker open inside it.
  useEffect(() => {
    if (!phone || !open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return;
      }
      focusAfterToggle.current = true;
      setOpenState(false);
      writeStoredOpen(storageKey, false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [phone, open, storageKey]);

  // The drawer covers the shell: while it is open, the page and the top
  // bar under it are out of reach of the keyboard and screen readers.
  useEffect(() => {
    const shell = slot?.closest(SHELL_ROOT_SELECTOR);
    if (!phone || !open || !slot || !shell) {
      return;
    }
    const covered: Element[] = [];
    let node: Element = slot;
    while (node !== shell && node.parentElement) {
      const parent: Element = node.parentElement;
      for (const sibling of Array.from(parent.children)) {
        if (sibling !== node && !sibling.hasAttribute('inert')) {
          sibling.setAttribute('inert', '');
          covered.push(sibling);
        }
      }
      node = parent;
    }
    return () => covered.forEach((element) => element.removeAttribute('inert'));
  }, [phone, open, slot]);

  // The plane mirrors the left sidebar: the same flat surface and quiet
  // edge, with teal reserved for text — no colored bands.
  const titleColor = accent ? colors.primary[700] : colors.text.primary;
  const bodyId = `side-panel-body-${(storageKey ?? title).replace(/\W+/g, '-').toLowerCase()}`;

  /**
   * Both faces stay mounted so the fold can animate: the container's
   * width eases between panel and spine while the faces crossfade.
   * visibility (not just opacity) removes the hidden face from the
   * accessibility tree and tab order, delayed so the fade-out is seen.
   */
  const face = (visible: boolean): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    visibility: visible ? 'visible' : 'hidden',
    transition: reduceMotion
      ? undefined
      : `opacity ${FADE_MS}ms ease, visibility 0s linear ${visible ? 0 : FADE_MS}ms`,
  });

  const surface: React.CSSProperties = {
    borderLeft: `1px solid ${colors.border.light}`,
    background: colors.gray[50],
  };

  /** Where the open panel sits: the column, over the content, or (a phone) the whole screen. */
  const openPlacement: React.CSSProperties = phone
    ? {
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 30,
        width: '100%',
        background: colors.gray[50],
      }
    : overlay
      ? {
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          zIndex: 30,
          boxShadow: `-${spacing.sm} 0 ${spacing.xl} ${colors.shadow.medium}`,
          ...surface,
          // Floating on narrow shells, a wide panel never outgrows the window.
          width: `min(${width}px, 100vw)`,
        }
      : { position: 'absolute', top: 0, left: 0, height: '100%', width };

  const content = (
    <div
      style={
        phone
          ? {
              // A phone's plane is under the content: a bar across the screen.
              width: '100%',
              height: BAR_HEIGHT,
              position: 'relative',
              flexShrink: 0,
              overflow: 'hidden',
              fontFamily: typography.fontFamily.primary,
              borderTop: `1px solid ${colors.border.light}`,
              background: colors.gray[50],
            }
          : {
              // Narrow shells keep only the spine's width; the open panel
              // floats over the content instead of squeezing it.
              width: open && !overlay ? width : SPINE_WIDTH,
              transition: reduceMotion
                ? undefined
                : `width ${WIDTH_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              height: '100%',
              position: 'relative',
              flexShrink: 0,
              overflow: 'hidden',
              fontFamily: typography.fontFamily.primary,
              ...surface,
            }
      }
    >
      <div
        aria-label={title}
        // A phone's open panel is a drawer over the whole screen.
        role={phone && open ? 'dialog' : undefined}
        aria-modal={phone && open ? true : undefined}
        style={{
          ...openPlacement,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          ...face(open),
        }}
      >
        <button
          ref={collapseRef}
          type="button"
          onClick={() => toggle(false)}
          aria-expanded
          aria-controls={bodyId}
          aria-label={`Collapse ${title}`}
          style={{
            all: 'unset',
            boxSizing: 'border-box',
            cursor: 'pointer',
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
            padding: `${spacing.lg} ${spacing.lg} ${spacing.sm}`,
            flexShrink: 0,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.xs, minWidth: 0 }}>
            <IconChevronDown
              size={14}
              color={colors.text.secondary}
              style={{ flexShrink: 0, marginTop: 3, transition: 'transform 160ms ease' }}
            />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              {kicker && (
                <Text
                  style={{
                    fontSize: typography.fontSize.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: colors.text.secondary,
                    fontWeight: typography.fontWeight.semibold,
                  }}
                >
                  {kicker}
                </Text>
              )}
              <Text
                style={{
                  fontWeight: typography.fontWeight.semibold,
                  color: titleColor,
                  fontSize: typography.fontSize.sm,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </Text>
            </span>
          </span>
          {(meta || phone) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              {meta && (
                <Text
                  style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {meta}
                </Text>
              )}
              {/* A drawer shows how to close it. */}
              {phone && <IconX size={18} aria-hidden color={colors.text.secondary} />}
            </span>
          )}
        </button>
        {/* The body scrolls, not the page: the plane keeps its own height. */}
        <div id={bodyId} style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {children}
        </div>
      </div>

      <button
        ref={expandRef}
        type="button"
        onClick={() => toggle(true)}
        aria-expanded={false}
        aria-label={`Open ${title}`}
        title={meta ? `${title} · ${meta}` : title}
        style={{
          all: 'unset',
          boxSizing: 'border-box',
          cursor: 'pointer',
          position: 'absolute',
          top: 0,
          left: 0,
          width: phone ? '100%' : SPINE_WIDTH,
          height: '100%',
          display: 'flex',
          flexDirection: phone ? 'row' : 'column',
          alignItems: 'center',
          gap: spacing.sm,
          padding: phone ? `0 ${spacing.lg}` : `${spacing.md} 0`,
          ...face(!open),
        }}
      >
        <IconChevronDown
          size={14}
          color={titleColor}
          style={{
            flexShrink: 0,
            // The spine opens to the left; a phone's bar opens upward.
            transform: phone ? 'rotate(180deg)' : 'rotate(90deg)',
            transition: 'transform 160ms ease',
          }}
        />
        <Text
          style={{
            // Vertical label: the spine is a spine, not a squeezed button.
            writingMode: phone ? undefined : 'vertical-rl',
            minWidth: 0,
            overflow: phone ? 'hidden' : undefined,
            textOverflow: phone ? 'ellipsis' : undefined,
            fontSize: phone ? typography.fontSize.sm : typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: titleColor,
            whiteSpace: 'nowrap',
          }}
        >
          {title}
          {/* Folded, the count is all that is left to say what is in there. */}
          {meta && (
            <span
              style={{ color: colors.text.secondary, fontWeight: typography.fontWeight.normal }}
            >
              {` · ${meta}`}
            </span>
          )}
        </Text>
      </button>
    </div>
  );

  // Into the shell's right-plane slot when it exists; in place otherwise.
  return slot ? createPortal(content, slot) : content;
}
