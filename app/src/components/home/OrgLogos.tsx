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
const CYCLE_INTERVAL = 2000; // 2 seconds between each change

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
  const [transitioningSlot, setTransitioningSlot] = useState<number | null>(null);
  const [nextLogoIndex, setNextLogoIndex] = useState(NUM_VISIBLE);

  // Initialize slots with first N logos
  useEffect(() => {
    if (shuffledOrgs.length === 0) {
      return;
    }
    const initial = shuffledOrgs.slice(0, NUM_VISIBLE).map((_, i) => i);
    setSlotIndices(initial);
    setNextLogoIndex(NUM_VISIBLE);
  }, [shuffledOrgs]);

  // Cycle a random slot
  const cycleRandomSlot = useCallback(() => {
    if (shuffledOrgs.length <= NUM_VISIBLE) {
      return;
    }

    // Pick a random slot
    const randomSlot = Math.floor(Math.random() * NUM_VISIBLE);

    // Start fade out
    setTransitioningSlot(randomSlot);

    setTimeout(() => {
      // Update the slot with next logo in queue
      setSlotIndices((prev) => {
        const next = [...prev];
        setNextLogoIndex((prevNext) => {
          next[randomSlot] = prevNext % shuffledOrgs.length;
          return prevNext + 1;
        });
        return next;
      });

      // Fade back in
      setTransitioningSlot(null);
    }, 300);
  }, [shuffledOrgs.length]);

  // Set up single interval timer
  useEffect(() => {
    if (shuffledOrgs.length <= NUM_VISIBLE || slotIndices.length === 0) {
      return;
    }

    const interval = setInterval(cycleRandomSlot, CYCLE_INTERVAL);

    return () => clearInterval(interval);
  }, [shuffledOrgs.length, slotIndices.length, cycleRandomSlot]);

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
                opacity: transitioningSlot === i ? 0 : 1,
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
