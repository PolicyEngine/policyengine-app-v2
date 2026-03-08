import { useEffect, useState } from 'react';
import { Box, Container, Stack, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const HEADLINE_WORDS = ['Start', 'simulating', 'policy.'];

/**
 * Hero section with Apple-style word-by-word animated headline.
 * Words animate in sequentially using CSS @keyframes on mount.
 */
export default function MainSection() {
  const countryId = useCurrentCountry();
  const [started, setStarted] = useState(false);

  // Delay animation start slightly so the page has painted
  useEffect(() => {
    const t = requestAnimationFrame(() => setStarted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const sublineCountry =
    countryId === 'uk'
      ? 'Model policy reforms across the UK.'
      : 'Model policy reforms across all 50 states.';

  return (
    <Container size="xl" py={spacing['5xl']}>
      <Stack
        align="center"
        gap={spacing['2xl']}
        style={{ margin: '0 auto', maxWidth: spacing.layout.container }}
      >
        {/* Animated headline */}
        <h1
          style={{
            fontSize: 'clamp(42px, 7vw, 80px)',
            fontWeight: typography.fontWeight.bold,
            lineHeight: typography.lineHeight.tight,
            fontFamily: typography.fontFamily.primary,
            color: colors.primary[800],
            textAlign: 'center',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {HEADLINE_WORDS.map((word, i) => (
            <span
              key={word}
              className={started ? 'hero-word' : ''}
              style={{
                animationDelay: started ? `${i * 0.14}s` : undefined,
                marginRight: i < HEADLINE_WORDS.length - 1 ? '0.3em' : 0,
              }}
            >
              {word}
            </span>
          ))}
        </h1>

        {/* Sub-headline — fades in after headline */}
        <Box
          className={started ? 'hero-word' : ''}
          style={{
            animationDelay: started ? `${HEADLINE_WORDS.length * 0.14 + 0.1}s` : undefined,
            textAlign: 'center',
          }}
        >
          <Text
            size={typography.fontSize.xl}
            c={colors.gray[600]}
            ta="center"
            fw={typography.fontWeight.normal}
            style={{
              lineHeight: typography.lineHeight.relaxed,
              fontFamily: typography.fontFamily.primary,
              maxWidth: 540,
            }}
          >
            Free, open-source tax and benefit analysis.
            <br />
            {sublineCountry}
            <br />
            Power benefit access tools with accurate rules.
          </Text>
        </Box>
      </Stack>
    </Container>
  );
}
