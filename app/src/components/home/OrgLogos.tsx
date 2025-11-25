import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Flex, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

interface Organization {
  name: string;
  logo: string;
  link: string;
}

interface OrgData {
  uk: Record<string, Organization>;
  us: Record<string, Organization>;
}

interface OrgLogosProps {
  logos: OrgData;
}

const NUM_VISIBLE = 7;
const MIN_DURATION = 3000; // 3 seconds
const MAX_DURATION = 6000; // 6 seconds

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomDuration() {
  return MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
}

export default function OrgLogos({ logos }: OrgLogosProps) {
  const countryId = useCurrentCountry();
  const countryOrgs = logos[countryId as keyof OrgData];

  // Shuffle logos once on mount
  const shuffledOrgs = useMemo(() => {
    if (!countryOrgs) {
      return [];
    }
    return shuffleArray(Object.values(countryOrgs));
  }, [countryOrgs]);

  // Track which logo index each slot is showing and its transition state
  const [slotIndices, setSlotIndices] = useState<number[]>([]);
  const [transitioning, setTransitioning] = useState<boolean[]>([]);

  // Initialize slots with first N logos
  useEffect(() => {
    if (shuffledOrgs.length === 0) {
      return;
    }
    const initial = shuffledOrgs.slice(0, NUM_VISIBLE).map((_, i) => i);
    setSlotIndices(initial);
    setTransitioning(new Array(NUM_VISIBLE).fill(false));
  }, [shuffledOrgs]);

  // Cycle a single slot to the next available logo
  const cycleSlot = useCallback(
    (slotIndex: number) => {
      if (shuffledOrgs.length <= NUM_VISIBLE) {
        return;
      }

      setTransitioning((prev) => {
        const next = [...prev];
        next[slotIndex] = true;
        return next;
      });

      setTimeout(() => {
        setSlotIndices((prev) => {
          const next = [...prev];
          // Find the next logo that isn't currently visible
          const currentlyVisible = new Set(prev);
          let nextIndex = (Math.max(...prev) + 1) % shuffledOrgs.length;

          // Keep looking until we find one not in current view
          let attempts = 0;
          while (currentlyVisible.has(nextIndex) && attempts < shuffledOrgs.length) {
            nextIndex = (nextIndex + 1) % shuffledOrgs.length;
            attempts++;
          }

          next[slotIndex] = nextIndex;
          return next;
        });

        setTransitioning((prev) => {
          const next = [...prev];
          next[slotIndex] = false;
          return next;
        });
      }, 300);
    },
    [shuffledOrgs.length]
  );

  // Set up independent timers for each slot
  useEffect(() => {
    if (shuffledOrgs.length <= NUM_VISIBLE || slotIndices.length === 0) {
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    const scheduleSlot = (slotIndex: number) => {
      const timer = setTimeout(() => {
        cycleSlot(slotIndex);
        scheduleSlot(slotIndex); // Reschedule with new random duration
      }, getRandomDuration());
      timers[slotIndex] = timer;
    };

    // Stagger initial starts
    for (let i = 0; i < NUM_VISIBLE; i++) {
      setTimeout(() => scheduleSlot(i), i * 500 + Math.random() * 1000);
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [shuffledOrgs.length, slotIndices.length, cycleSlot]);

  if (!countryOrgs || shuffledOrgs.length === 0 || slotIndices.length === 0) {
    return null;
  }

  const visibleOrgs = slotIndices.map((idx) => shuffledOrgs[idx]).filter(Boolean);

  return (
    <Box mt={spacing['4xl']} mb={spacing['4xl']}>
      <Text
        ta="center"
        size="lg"
        c={colors.primary[600]}
        fw={typography.fontWeight.medium}
        mb={spacing.xl}
        style={{ fontFamily: typography.fontFamily.primary }}
      >
        Trusted by researchers and policy organizations
      </Text>

      <Box
        style={{
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          overflowX: 'hidden',
        }}
      >
        <Flex
          justify="center"
          align="center"
          gap={spacing['5xl']}
          wrap="nowrap"
          px={spacing['4xl']}
          style={{ minWidth: 'max-content' }}
        >
          {visibleOrgs.map((org, i) => (
            <Box
              key={`slot-${i}`}
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                width: '120px',
                height: '100px',
                opacity: transitioning[i] ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out',
              }}
            >
              <button
                type="button"
                onClick={() => window.open(org.link, '_blank')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                }}
              >
                <img
                  src={org.logo}
                  alt={org.name}
                  style={{
                    maxWidth: '120px',
                    maxHeight: '100px',
                    width: 'auto',
                    height: 'auto',
                  }}
                />
              </button>
            </Box>
          ))}
        </Flex>
      </Box>
    </Box>
  );
}
