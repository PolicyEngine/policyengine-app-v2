import { Box, Container, Stack, Text } from '@mantine/core';
import { spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function MainSection() {
  const countryId = useCurrentCountry();

  return (
    <Container size="xl" py={spacing['5xl']}>
      <Stack
        align="center"
        gap={spacing['3xl']}
        style={{
          margin: '0 auto',
          maxWidth: spacing.layout.container,
        }}
      >
        {/* Editorial headline with serif font */}
        <Box
          style={{
            opacity: 0,
            animation: 'fadeInUp 1s ease-out forwards',
          }}
        >
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 'clamp(48px, 8vw, 88px)',
              fontWeight: 400,
              lineHeight: 1.1,
              textAlign: 'center',
              margin: 0,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            Simulate the
            <br />
            <span
              style={{
                color: '#4FD1C5',
              }}
            >
              future of policy
            </span>
          </h1>
        </Box>

        {/* Subtitle with animation delay */}
        <Box
          style={{
            opacity: 0,
            animation: 'fadeInUp 1s ease-out 0.2s forwards',
          }}
        >
          <Text
            size={typography.fontSize['2xl']}
            ta="center"
            fw={typography.fontWeight.normal}
            style={{
              lineHeight: typography.lineHeight.normal,
              fontFamily: typography.fontFamily.primary,
              color: 'rgba(255, 255, 255, 0.8)',
              maxWidth: '600px',
            }}
          >
            Free, open-source tax and benefit analysis.
            <br />
            {countryId === 'uk'
              ? 'Model policy reforms across the UK.'
              : 'Model policy reforms across all 50 states.'}
            <br />
            Power benefit access tools with accurate rules.
          </Text>
        </Box>
      </Stack>
    </Container>
  );
}
