import { Center, Container, Text } from '@mantine/core';
import { spacing, typography } from '@/designTokens';

export default function TransformationStatement() {
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
          Transforming how policy professionals analyze and implement
        </Text>
      </Center>
    </Container>
  );
}
