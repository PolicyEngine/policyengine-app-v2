import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import {
  getOrgsForCountry,
  Organization,
  CountryId,
} from '@/data/organizations';

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

export default function OrgLogos() {
  const countryId = useCurrentCountry() as CountryId;

  // Get and shuffle logos for current country
  const shuffledOrgs = useMemo(() => {
    const orgs = getOrgsForCountry(countryId);
    return shuffleArray(orgs);
  }, [countryId]);

  // Track which logo index each slot is showing and its transition state
  const [slotIndices, setSlotIndices] = useState<number[]>([]);
  const [transitioningSlot, setTransitioningSlot] = useState<number | null>(
    null
  );
  const lastSlotRef = useRef<number>(-1);
  const nextLogoRef = useRef<number>(NUM_VISIBLE);

  // Initialize slots with first N logos
  useEffect(() => {
    if (shuffledOrgs.length === 0) {
      return;
    }
    const initial = shuffledOrgs.slice(0, NUM_VISIBLE).map((_, i) => i);
    setSlotIndices(initial);
    nextLogoRef.current = NUM_VISIBLE;
    lastSlotRef.current = -1;
  }, [shuffledOrgs]);

  // Cycle slots using golden ratio step for visually scattered but deterministic pattern
  // Step of 4 with 7 slots creates: 0, 4, 1, 5, 2, 6, 3, 0, 4...
  const GOLDEN_STEP = 4;

  const cycleNextSlot = useCallback(() => {
    if (shuffledOrgs.length <= NUM_VISIBLE) {
      return;
    }

    // Use golden ratio stepping for an unexpected but non-random pattern
    const nextSlot = (lastSlotRef.current + GOLDEN_STEP) % NUM_VISIBLE;
    lastSlotRef.current = nextSlot;

    // Start fade out
    setTransitioningSlot(nextSlot);

    setTimeout(() => {
      setSlotIndices((prev) => {
        const next = [...prev];
        const oldLogoIndex = prev[nextSlot]; // The logo being replaced
        const currentlyVisible = new Set(prev);

        // Find next logo that isn't already visible AND isn't the one being replaced
        let newLogoIndex = nextLogoRef.current % shuffledOrgs.length;
        let attempts = 0;
        while (
          (currentlyVisible.has(newLogoIndex) || newLogoIndex === oldLogoIndex) &&
          attempts < shuffledOrgs.length
        ) {
          newLogoIndex = (newLogoIndex + 1) % shuffledOrgs.length;
          attempts++;
        }

        next[nextSlot] = newLogoIndex;
        nextLogoRef.current = newLogoIndex + 1;
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

    const interval = setInterval(cycleNextSlot, CYCLE_INTERVAL);

    return () => clearInterval(interval);
  }, [shuffledOrgs.length, slotIndices.length, cycleNextSlot]);

  if (shuffledOrgs.length === 0 || slotIndices.length === 0) {
    return null;
  }

  const visibleOrgs = slotIndices
    .map((idx) => shuffledOrgs[idx])
    .filter(Boolean) as Organization[];

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
        {countryId === 'us'
          ? 'Trusted by researchers, policy organizations, and benefit platforms'
          : 'Trusted by researchers and policy organizations'}
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
                title={org.name}
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
