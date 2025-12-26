import { Card, Center, Container, Text } from '@mantine/core';
import { useCurrentCountry } from '@policyengine/shared';
import { CALCULATOR_URL } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';

export default function ActionCards() {
  const countryId = useCurrentCountry();

  return (
    <Container size="xl" pb={spacing['4xl']}>
      <Center>
        <Card
          component="a"
          href={`${CALCULATOR_URL}/${countryId}/reports`}
          shadow="sm"
          p={spacing.xl}
          radius={spacing.radius.md}
          withBorder
          style={{
            backgroundColor: 'transparent',
            cursor: 'pointer',
            borderColor: colors.primary[500],
            borderWidth: 1.5,
            fontFamily: typography.fontFamily.primary,
            textDecoration: 'none',
          }}
        >
          <Text fw={typography.fontWeight.semibold} c={colors.primary[500]} size="xl">
            Enter PolicyEngine
          </Text>
        </Card>
      </Center>
    </Container>
  );
}
