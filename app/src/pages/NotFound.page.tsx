import { Link, useParams } from 'react-router-dom';
import { Button, Container, Divider, Stack, Text, Title } from '@mantine/core';
import { colors } from '@/designTokens';

export default function NotFoundPage() {
  const { countryId } = useParams<{ countryId: string }>();

  return (
    <Container variant="guttered">
      <Title order={2} variant="colored">
        Page not found
      </Title>
      <Text c="dimmed" mb="sm">
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <Divider my="sm" />

      <Stack align="center" justify="center" py={80}>
        <Text size="72px" fw={700} c={colors.primary[500]} style={{ lineHeight: 1 }}>
          404
        </Text>
        <Text size="sm" c="dimmed" mt="md">
          Check the URL or head back to your reports.
        </Text>
        <Button component={Link} to={`/${countryId || 'us'}/reports`} mt="md" color="teal">
          Go to reports
        </Button>
      </Stack>
    </Container>
  );
}
