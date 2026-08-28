import { useEffect, useLayoutEffect, useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { createPortal } from 'react-dom';
import { Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

/**
 * The flagship shell's right plane.
 *
 * Both companions — the draft reform and a report's adjust rail — are
 * the same shape: a column beside the content, folding to a slim spine.
 * The chrome lives here once, and the column is real: the panel portals
 * into a slot that is a flex sibling of the shell's scrolling <main>
 * (see StandardLayout), so it runs the full height of the page by
 * construction, never scrolls away with the content, and never wraps
 * beneath it. Where the slot does not exist (tests, the legacy shell)
 * the panel renders in place.
 */
export const SIDE_PANEL_SLOT_ID = 'flagship-side-panel-slot';

const PANEL_WIDTH = 340;
const SPINE_WIDTH = 40;

/** Effects that must run before paint, without warning during SSR. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface SidePanelProps {
  /** Header text, and the label on the folded spine. */
  title: string;
  /** Right-hand note in the header: source, count, whatever is short. */
  meta?: string;
  /** Teal chrome, for a panel holding unsaved work. */
  accent?: boolean;
  /** Report companions start folded; the draft starts open. */
  defaultOpen?: boolean;
  /**
   * Remember the fold across navigations under this key. The draft
   * panel follows the reader between pages; without persistence every
   * navigation would spring a deliberately folded panel back open.
   */
  storageKey?: string;
  children: React.ReactNode;
}

function readStoredOpen(storageKey: string | undefined, fallback: boolean): boolean {
  if (!storageKey || typeof sessionStorage === 'undefined') {
    return fallback;
  }
  const stored = sessionStorage.getItem(`side-panel-open:${storageKey}`);
  return stored === null ? fallback : stored === 'true';
}

export default function SidePanel({
  title,
  meta,
  accent = false,
  defaultOpen = true,
  storageKey,
  children,
}: SidePanelProps) {
  const [open, setOpenState] = useState(() => readStoredOpen(storageKey, defaultOpen));
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    setSlot(document.getElementById(SIDE_PANEL_SLOT_ID));
  }, []);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    if (storageKey && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`side-panel-open:${storageKey}`, String(next));
    }
  };

  const borderColor = accent ? colors.primary[500] : colors.border.light;
  const headerBackground = accent ? colors.primary[50] : colors.gray[50];
  const titleColor = accent ? colors.primary[700] : colors.text.primary;
  const bodyId = `side-panel-body-${(storageKey ?? title).replace(/\W+/g, '-').toLowerCase()}`;

  const content = open ? (
    <div
      aria-label={title}
      style={{
        width: PANEL_WIDTH,
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `1px solid ${borderColor}`,
        background: colors.background.primary,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(false)}
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
          padding: `${spacing.md} ${spacing.lg}`,
          background: headerBackground,
          flexShrink: 0,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, minWidth: 0 }}>
          <IconChevronDown
            size={14}
            color={titleColor}
            style={{ flexShrink: 0, transition: 'transform 160ms ease' }}
          />
          <Text
            style={{
              fontWeight: typography.fontWeight.semibold,
              color: titleColor,
              fontSize: typography.fontSize.sm,
            }}
          >
            {title}
          </Text>
        </span>
        {meta && (
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
            {meta}
          </Text>
        )}
      </button>
      {/* The body scrolls, not the page: the plane keeps its own height. */}
      <div id={bodyId} style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-expanded={false}
      aria-label={`Open ${title}`}
      title={title}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        width: SPINE_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.sm,
        padding: `${spacing.md} 0`,
        borderLeft: `1px solid ${borderColor}`,
        background: headerBackground,
      }}
    >
      <IconChevronDown
        size={14}
        color={titleColor}
        style={{ transform: 'rotate(90deg)', transition: 'transform 160ms ease' }}
      />
      <Text
        style={{
          // Vertical label: the spine is a spine, not a squeezed button.
          writingMode: 'vertical-rl',
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.semibold,
          color: titleColor,
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </Text>
    </button>
  );

  // Into the shell's right-plane slot when it exists; in place otherwise.
  return slot ? createPortal(content, slot) : content;
}
