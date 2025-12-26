import { Container, Divider, Loader, Stack, Text, Title } from '@mantine/core';

interface MetadataLoadingExperienceProps {
  /** Country code (us or uk) */
  countryId: string;
}

/**
 * MetadataLoadingExperience - Simple loading screen for metadata fetch
 *
 * Matches the PathwayView design pattern used in create pages.
 * Shows a large centered loader within the app shell.
 */
export function MetadataLoadingExperience({ countryId }: MetadataLoadingExperienceProps) {
  const countryName = countryId === 'uk' ? 'United Kingdom' : 'United States';

  return (
    <Container variant="guttered">
      <Title order={2} variant="colored">
        Loading
      </Title>
      <Text c="dimmed" mb="sm">
        Fetching {countryName} policy data
      </Text>
      <Divider my="sm" />

      <Stack align="center" justify="center" py={80}>
        <Loader size={48} color="teal" />
        <Text size="sm" c="dimmed" mt="md">
          This may take a moment for first-time loads
        </Text>
      </Stack>
    </Container>
  );
}
