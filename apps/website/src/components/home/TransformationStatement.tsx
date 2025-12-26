import { Center, Container, Text } from '@mantine/core';
import { useCurrentCountry } from '@policyengine/shared';
import { spacing, typography } from '@/designTokens';

export default function TransformationStatement() {
  const countryId = useCurrentCountry();

  const statement =
    countryId === 'uk'
      ? 'Free, open-source, and trusted by researchers, think tanks, and benefit access tools across the UK.'
      : 'Free, open-source, and trusted by NBER, the Federal Reserve, and benefit access tools nationwide.';

  return (
    <Container size="xl" py={spacing['4xl']} mt={spacing['2xl']}>
      <Center>
        <Text
          size="xl"
          fw={typography.fontWeight.semibold}
          c="#132F46"
          ta="center"
          style={{ fontFamily: typography.fontFamily.primary }}
        >
          {statement}
        </Text>
      </Center>
    </Container>
  );
}
