import { Card } from '@mantine/core';
import { Container, Text } from '@/components/ui';
import { CALCULATOR_URL } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function ActionCards() {
  const countryId = useCurrentCountry();

  return (
    <Container size="xl" style={{ paddingBottom: spacing['4xl'] }}>
      <div className="tw:flex tw:items-center tw:justify-center">
        <Card
          component="a"
          href={`${CALCULATOR_URL}/${countryId}/reports`}
          shadow="sm"
          p={spacing.xl}
          radius={spacing.radius.container}
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
      </div>
    </Container>
  );
}
