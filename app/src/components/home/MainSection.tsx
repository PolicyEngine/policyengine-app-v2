import { Container, Stack, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export default function MainSection() {
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
          Computing Public Policy
          <br />
          for Everyone
        </Title>

        <Text
          size={typography.fontSize['2xl']}
          c="#132F46"
          ta="center"
          fw={typography.fontWeight.normal}
          style={{
            lineHeight: typography.lineHeight.normal,
            fontFamily: typography.fontFamily.secondary,
          }}
        >
          Understand and analyze the impacts of tax and benefit policies
          <br /> on budgets, economic growth, poverty, and inequality.
        </Text>
      </Stack>
    </Container>
  );
}
