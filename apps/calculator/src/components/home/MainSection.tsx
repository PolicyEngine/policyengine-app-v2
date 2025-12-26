import { Container, Stack, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
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
        <Title
          size={48}
          fw={typography.fontWeight.bold}
          ta="center"
          c={colors.primary[800]}
          style={{
            lineHeight: typography.lineHeight.tight,
            fontFamily: typography.fontFamily.primary,
          }}
        >
          Start simulating
        </Title>

        <Text
          size={typography.fontSize['2xl']}
          c="#132F46"
          ta="center"
          fw={typography.fontWeight.normal}
          style={{
            lineHeight: typography.lineHeight.normal,
            fontFamily: typography.fontFamily.primary,
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
      </Stack>
    </Container>
  );
}
