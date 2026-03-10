import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconArrowsMinimize } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { colors, spacing } from '@/designTokens';

const FADE_MS = 150;
const RESIZE_S = 0.35;
export const SHRUNKEN_CARD_HEIGHT = 200;

export type ExpandDirection = 'down-right' | 'down-left' | 'up-right' | 'up-left';

interface DashboardCardProps {
  mode: 'expanded' | 'shrunken';
  zIndex: number;
  expandDirection: ExpandDirection;
  expandedContent: React.ReactNode;
  onToggleMode?: () => void;
  gridGap?: number;

  /** Header pinned to top of shrunken card (e.g. icon + label) */
  shrunkenHeader: React.ReactNode;
  /** Body centered in remaining space below header */
  shrunkenBody?: React.ReactNode;

  // Layout
  colSpan?: number;
  /** Number of grid rows the card occupies when shrunken (default 1) */
  shrunkenRows?: number;
  /** Number of grid rows the card occupies when expanded (default 2) */
  expandedRows?: number;

  /** Controls (e.g. SegmentedControl) rendered in a row with the minimize button when expanded */
  expandedControls?: React.ReactNode;

  // Style overrides (apply only when shrunken/idle)
  shrunkenBackground?: string;
  shrunkenBorderColor?: string;
  padding?: string;
}

const ANCHOR: Record<ExpandDirection, React.CSSProperties> = {
  'down-right': { top: 0, left: 0 },
  'down-left': { top: 0, right: 0 },
  'up-right': { bottom: 0, left: 0 },
  'up-left': { bottom: 0, right: 0 },
};

const RESIZE_TRANSITION = {
  duration: RESIZE_S,
  ease: [0.4, 0, 0.2, 1] as const,
};

type Phase =
  | 'idle' // shrunken, relative, content visible
  | 'pre-expand' // shrunken content fading out
  | 'expanding' // card resizing to expanded dimensions
  | 'expanded' // at expanded size, expanded content visible
  | 'pre-collapse' // expanded content fading out
  | 'collapsing'; // card resizing back to cell dimensions

export default function DashboardCard({
  mode,
  zIndex,
  expandDirection,
  expandedContent,
  onToggleMode,
  gridGap = 16,
  shrunkenHeader,
  shrunkenBody,
  colSpan = 1,
  shrunkenRows = 1,
  expandedRows = 2,
  expandedControls,
  shrunkenBackground,
  shrunkenBorderColor,
  padding: paddingProp,
}: DashboardCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isExpanded = mode === 'expanded';
  const cardPadding = paddingProp ?? spacing.lg;
  const shrunkenHeight = SHRUNKEN_CARD_HEIGHT * shrunkenRows + gridGap * (shrunkenRows - 1);

  const [phase, setPhase] = useState<Phase>('idle');
  const [cell, setCell] = useState<{ w: number; h: number } | null>(null);
  // Controls the 1-frame-delayed fade-in of expanded content
  const [expandedVisible, setExpandedVisible] = useState(false);

  // --- Detect mode changes and drive phase transitions ---
  useLayoutEffect(() => {
    if (mode === 'expanded') {
      if (phase === 'idle') {
        // Measure cell while card is still in flow
        if (cardRef.current) {
          setCell({
            w: cardRef.current.offsetWidth,
            h: cardRef.current.offsetHeight,
          });
        }
        setPhase('pre-expand');
      } else if (phase === 'collapsing' || phase === 'pre-collapse') {
        // Reverse a collapse mid-animation
        setPhase('expanding');
      }
    }
    if (mode === 'shrunken') {
      if (phase === 'expanded') {
        setPhase('pre-collapse');
      } else if (phase === 'pre-expand' || phase === 'expanding') {
        // Reverse an expand mid-animation
        setPhase('collapsing');
      }
    }
  }, [mode, phase]);

  // --- Timed fade phases (pre-expand / pre-collapse) ---
  useEffect(() => {
    if (phase === 'pre-expand') {
      const t = setTimeout(() => setPhase('expanding'), FADE_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'pre-collapse') {
      const t = setTimeout(() => setPhase('collapsing'), FADE_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // --- Expanded content: mount with opacity 0, then fade in after 1 frame ---
  useEffect(() => {
    if (phase === 'expanded') {
      const raf = requestAnimationFrame(() => {
        setExpandedVisible(true);
      });
      return () => cancelAnimationFrame(raf);
    }
    setExpandedVisible(false);
  }, [phase]);

  // --- Trigger Plotly resize after expanded content becomes visible ---
  useEffect(() => {
    if (expandedVisible) {
      const t = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      return () => clearTimeout(t);
    }
  }, [expandedVisible]);

  // Note: no need to clear framer-motion inline styles on return to idle —
  // the collapse animation targets cell.h (= SHRUNKEN_CARD_HEIGHT), so the
  // residual inline height is already correct. Clearing here would also fire
  // on initial mount, wiping out React's height before the first paint.

  // --- Resize animation complete handler ---
  const handleAnimationComplete = () => {
    if (phase === 'expanding') {
      setPhase('expanded');
    } else if (phase === 'collapsing') {
      setPhase('idle');
      setCell(null);
      window.dispatchEvent(new Event('resize'));
    }
  };

  // --- Derived values ---
  const isLifted = phase !== 'idle';
  const expandedW = colSpan >= 2 ? (cell?.w ?? 0) : cell ? cell.w * 2 + gridGap : 0;
  // Expanded height is always based on single-row cell height, not the shrunken
  // card height (which may span multiple rows via shrunkenRows).
  const singleRowH = SHRUNKEN_CARD_HEIGHT;
  const expandedH = cell ? singleRowH * expandedRows + gridGap * (expandedRows - 1) : 0;

  // Background/border: use overrides only when idle (shrunken)
  const cardBackground =
    !isLifted && shrunkenBackground ? shrunkenBackground : colors.background.primary;
  const cardBorderColor =
    !isLifted && shrunkenBorderColor ? shrunkenBorderColor : colors.border.light;

  const shrunkenContentOpacity = phase === 'idle' ? 1 : 0;
  const mountExpanded = phase === 'expanded' || phase === 'pre-collapse';
  const expandedContentOpacity = phase === 'expanded' && expandedVisible ? 1 : 0;

  // Animate target: cell size when shrinking, expanded size when growing
  const getAnimateTarget = (): { width: number; height: number } | undefined => {
    if (!cell) {
      return undefined;
    }
    if (phase === 'expanding' || phase === 'expanded' || phase === 'pre-collapse') {
      return { width: expandedW, height: expandedH };
    }
    // pre-expand, collapsing
    return { width: cell.w, height: cell.h };
  };

  const anchor = ANCHOR[expandDirection];

  const expandButton = onToggleMode ? (
    isExpanded ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMode();
            }}
            aria-label="Collapse"
          >
            <IconArrowsMinimize size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Collapse</TooltipContent>
      </Tooltip>
    ) : (
      <Button
        variant="link"
        size="xs"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMode();
        }}
      >
        See detailed analysis
      </Button>
    )
  ) : null;

  return (
    /* Wrapper: stays in grid flow, fixed height always */
    <div
      style={{
        position: 'relative',
        height: isLifted ? (cell?.h ?? shrunkenHeight) : shrunkenHeight,
        ...(colSpan > 1 ? { gridColumn: `span ${colSpan}` } : {}),
        ...(shrunkenRows > 1 ? { gridRow: `span ${shrunkenRows}` } : {}),
      }}
    >
      <motion.div
        ref={cardRef}
        initial={false}
        animate={getAnimateTarget()}
        transition={RESIZE_TRANSITION}
        onAnimationComplete={handleAnimationComplete}
        style={{
          position: isLifted ? 'absolute' : 'relative',
          ...(isLifted ? anchor : {}),
          ...(!isLifted ? { width: '100%', height: shrunkenHeight } : {}),
          zIndex,
          background: cardBackground,
          borderRadius: spacing.md,
          border: `1px solid ${cardBorderColor}`,
          padding: cardPadding,
          cursor: !isExpanded && onToggleMode ? 'pointer' : undefined,
          overflow: 'hidden',
          boxShadow: isLifted ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={!isExpanded ? onToggleMode : undefined}
      >
        {/* Content area */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Shrunken layer — always mounted, opacity-controlled */}
          <div
            style={{
              opacity: shrunkenContentOpacity,
              transition: `opacity ${FADE_MS}ms ease`,
              pointerEvents: phase === 'idle' ? 'auto' : 'none',
              height: '100%',
              display: 'flex',
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                {shrunkenHeader}
                {expandButton}
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 0,
                  position: 'relative',
                }}
              >
                <div style={{ width: '100%' }}>{shrunkenBody}</div>
              </div>
            </div>
          </div>

          {/* Expanded layer — only mounted after card finishes expanding */}
          {mountExpanded && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: expandedContentOpacity,
                transition: `opacity ${FADE_MS}ms ease`,
                pointerEvents: phase === 'expanded' ? 'auto' : 'none',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Controls row: expandedControls on left, minimize button on right */}
              {onToggleMode && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                    height: 31,
                    marginBottom: spacing.sm,
                  }}
                >
                  <div style={{ display: 'flex', gap: spacing.lg }}>{expandedControls}</div>
                  {expandButton}
                </div>
              )}
              <div style={{ flex: 1, minHeight: 0 }}>{expandedContent}</div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
