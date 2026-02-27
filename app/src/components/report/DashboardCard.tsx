import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconArrowsMinimize, IconMaximize } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { ActionIcon, Box, Group, Stack, Text, Tooltip } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

const SECONDARY_ICON_SIZE = 36;
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

  // Standard header mode (icon + label + slides)
  icon?: React.ComponentType<{ size: number; color: string; stroke: number }>;
  label?: string;
  slides?: React.ReactNode[];

  // Custom shrunken content (replaces header + slides entirely)
  shrunkenContent?: React.ReactNode;

  // Layout
  colSpan?: number;

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
  icon: Icon,
  label,
  slides,
  shrunkenContent,
  colSpan = 1,
  shrunkenBackground,
  shrunkenBorderColor,
  padding: paddingProp,
}: DashboardCardProps) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const safeIndex = slides ? Math.min(activeSlideIndex, slides.length - 1) : 0;
  const isExpanded = mode === 'expanded';
  const useCustomContent = !!shrunkenContent;
  const cardPadding = paddingProp ?? spacing.lg;

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
  const expandedH = cell ? cell.h * 2 + gridGap : 0;

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
    <Tooltip label={isExpanded ? 'Collapse' : 'Expand'} position="left">
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMode();
        }}
      >
        {isExpanded ? <IconArrowsMinimize size={16} /> : <IconMaximize size={14} />}
      </ActionIcon>
    </Tooltip>
  ) : null;

  return (
    /* Wrapper: stays in grid flow, fixed height always */
    <div
      style={{
        position: 'relative',
        height: isLifted ? (cell?.h ?? SHRUNKEN_CARD_HEIGHT) : SHRUNKEN_CARD_HEIGHT,
        ...(colSpan > 1 ? { gridColumn: `span ${colSpan}` } : {}),
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
          ...(!isLifted ? { width: '100%', height: SHRUNKEN_CARD_HEIGHT } : {}),
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
        {/* Standard header — only when not using custom content */}
        {!useCustomContent && Icon && label && (
          <Group
            justify="space-between"
            align="flex-start"
            mb={spacing.md}
            style={{ flexShrink: 0 }}
          >
            <Group gap={spacing.md} align="flex-start">
              <Box
                style={{
                  width: SECONDARY_ICON_SIZE,
                  height: SECONDARY_ICON_SIZE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.gray[100],
                  borderRadius: spacing.xs,
                  flexShrink: 0,
                }}
              >
                <Icon size={20} color={colors.gray[600]} stroke={1.5} />
              </Box>
              <Text
                size="xs"
                fw={typography.fontWeight.medium}
                c={colors.text.secondary}
                tt="uppercase"
                style={{ letterSpacing: '0.05em', paddingTop: 8 }}
              >
                {label}
              </Text>
            </Group>
            {expandButton}
          </Group>
        )}

        {/* Content area */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Shrunken layer — always mounted, opacity-controlled, vertically centered */}
          <div
            style={{
              opacity: shrunkenContentOpacity,
              transition: `opacity ${FADE_MS}ms ease`,
              pointerEvents: phase === 'idle' ? 'auto' : 'none',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {useCustomContent ? (
              <div style={{ width: '100%' }}>{shrunkenContent}</div>
            ) : (
              <Stack gap={spacing.md} style={{ width: '100%' }}>
                <Box>{slides?.[safeIndex]}</Box>
                {slides && slides.length > 1 && (
                  <Group gap={spacing.xs} justify="center">
                    {slides.map((_, index) => (
                      <Box
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlideIndex(index);
                        }}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor:
                            index === safeIndex ? colors.primary[500] : colors.gray[300],
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                        }}
                      />
                    ))}
                  </Group>
                )}
              </Stack>
            )}
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
                overflow: 'auto',
              }}
            >
              {expandedContent}
            </div>
          )}
        </div>

        {/* Expand button for custom content mode — absolutely positioned */}
        {useCustomContent && expandButton && (
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>{expandButton}</div>
        )}
      </motion.div>
    </div>
  );
}
