import { useState } from 'react';
import { IconChevronDown, IconChevronsLeft } from '@tabler/icons-react';
import { Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

/**
 * The flagship shell's right-hand plane.
 *
 * Both companions — the draft reform and a report's adjust rail — are
 * the same shape: a column that runs the height of the page beside the
 * content, scrolling its own body, folding to a slim tab that keeps its
 * place in the layout. Panels differ in what they hold, not in how they
 * sit, so the chrome lives here rather than twice.
 *
 * The shell's <main> is the scroll container, so full height means the
 * viewport minus that element's padding.
 */
/**
 * Narrow enough that a report's content column (640px basis) and this
 * panel still share one flex line at 1280px — at 380 the row wrapped and
 * the panel fell under the report.
 */
const PANEL_WIDTH = 340;
const TAB_WIDTH = 40;
/** StandardLayout pads <main> by 24px top and bottom. */
const PANEL_HEIGHT = 'calc(100vh - 48px)';

interface SidePanelProps {
  /** Header text, and the label on the folded tab. */
  title: string;
  /** Right-hand note in the header: source, count, whatever is short. */
  meta?: string;
  /** Teal chrome, for a panel holding unsaved work. */
  accent?: boolean;
  /** Report companions start folded; the draft starts open. */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function SidePanel({
  title,
  meta,
  accent = false,
  defaultOpen = true,
  children,
}: SidePanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const headerBackground = accent ? colors.primary[50] : colors.gray[50];
  const titleColor = accent ? colors.primary[700] : colors.text.primary;

  if (!open) {
    return (
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
          position: 'sticky',
          top: 0,
          flex: `0 0 ${TAB_WIDTH}px`,
          width: TAB_WIDTH,
          height: PANEL_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.sm,
          padding: `${spacing.md} 0`,
          border: `1px solid ${accent ? colors.primary[500] : colors.border.light}`,
          borderRadius: 12,
          background: headerBackground,
        }}
      >
        <IconChevronsLeft size={16} color={titleColor} style={{ transform: 'rotate(180deg)' }} />
        <Text
          style={{
            // Vertical label: the tab is a spine, not a button with a
            // truncated word in it.
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
  }

  return (
    <div
      aria-label={title}
      style={{
        position: 'sticky',
        top: 0,
        flex: `0 1 ${PANEL_WIDTH}px`,
        width: PANEL_WIDTH,
        minWidth: 300,
        height: PANEL_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${accent ? colors.primary[500] : colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-expanded
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
            style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}
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
      {/* The body scrolls, not the page: the panel keeps its own height. */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{children}</div>
    </div>
  );
}
