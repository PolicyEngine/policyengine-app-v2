import { useNavigate } from 'react-router-dom';
import { Card, Center, Container, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function ActionCards() {
  const countryId = useCurrentCountry();
  const navigate = useNavigate();

  return (
    <Container size="xl" pb={spacing['4xl']}>
      <Center>
        <Card
          shadow="sm"
          p={spacing.xl}
          radius={spacing.radius.md}
          withBorder
          onClick={() => navigate(`/${countryId}/reports`)}
          style={{
            backgroundColor: 'transparent',
            cursor: 'pointer',
            borderColor: colors.primary[500],
            borderWidth: 1.5,
            fontFamily: typography.fontFamily.primary,
          }}
        >
          <Text fw={typography.fontWeight.semibold} c={colors.primary[500]} size="xl">
            Start building
          </Text>
        </Card>
      </Center>
    </Container>
  );
}
