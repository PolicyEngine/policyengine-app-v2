/**
 * OrgLogos - Editorial Social Proof Section
 *
 * Refined organization logo display with sophisticated animations
 * and editorial-style presentation. Clean, minimal styling.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Container, Text } from '@mantine/core';
import { CountryId, getOrgsForCountry, Organization } from '@/data/organizations';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const NUM_VISIBLE = 7;
const CYCLE_INTERVAL = 2500;

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

  const shuffledOrgs = useMemo(() => {
    const orgs = getOrgsForCountry(countryId);
    return shuffleArray(orgs);
  }, [countryId]);

  const [slotIndices, setSlotIndices] = useState<number[]>([]);
  const [transitioningSlot, setTransitioningSlot] = useState<number | null>(null);
  const lastSlotRef = useRef<number>(-1);
  const nextLogoRef = useRef<number>(NUM_VISIBLE);

  useEffect(() => {
    if (shuffledOrgs.length === 0) {
      return;
    }
    const initial = shuffledOrgs.slice(0, NUM_VISIBLE).map((_, i) => i);
    setSlotIndices(initial);
    nextLogoRef.current = NUM_VISIBLE;
    lastSlotRef.current = -1;
  }, [shuffledOrgs]);

  const GOLDEN_STEP = 4;

  const cycleNextSlot = useCallback(() => {
    if (shuffledOrgs.length <= NUM_VISIBLE) {
      return;
    }

    const nextSlot = (lastSlotRef.current + GOLDEN_STEP) % NUM_VISIBLE;
    lastSlotRef.current = nextSlot;

    setTransitioningSlot(nextSlot);

    setTimeout(() => {
      setSlotIndices((prev) => {
        const next = [...prev];
        const oldLogoIndex = prev[nextSlot];
        const currentlyVisible = new Set(prev);

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

      setTransitioningSlot(null);
    }, 350);
  }, [shuffledOrgs.length]);

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

  const visibleOrgs = slotIndices.map((idx) => shuffledOrgs[idx]).filter(Boolean) as Organization[];

  return (
    <Box
      component="section"
      style={{
        backgroundColor: colors.background.editorial,
        paddingTop: spacing['5xl'],
        paddingBottom: spacing['5xl'],
        borderTop: `1px solid ${colors.border.light}`,
      }}
    >
      <Container size="xl">
        {/* Section Label */}
        <Text
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            letterSpacing: typography.letterSpacing.widest,
            textTransform: 'uppercase',
            color: colors.text.tertiary,
            textAlign: 'center',
            marginBottom: spacing['3xl'],
          }}
        >
          Trusted by leading institutions
        </Text>

        {/* Logo Grid */}
        <Box
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: spacing['4xl'],
          }}
        >
          {visibleOrgs.map((org, i) => (
            <Box
              key={`slot-${i}`}
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '140px',
                height: '70px',
                opacity: transitioningSlot === i ? 0 : 0.7,
                transform: transitioningSlot === i ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 350ms ease-out',
                filter: 'grayscale(100%)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.filter = 'grayscale(0%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.filter = 'grayscale(100%)';
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
                    maxWidth: '130px',
                    maxHeight: '60px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                />
              </button>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
