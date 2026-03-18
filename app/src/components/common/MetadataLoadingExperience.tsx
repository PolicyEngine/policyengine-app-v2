import { Container, Spinner, Stack, Text, Title } from '@/components/ui';
import { colors } from '@/designTokens';

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
    <Container>
      <Title order={2}>Loading</Title>
      <Text className="tw:mb-sm" style={{ color: colors.gray[600] }}>
        Fetching {countryName} policy data
      </Text>
      <hr className="tw:border-border-light tw:my-sm" />

      <Stack className="tw:items-center tw:justify-center tw:py-20">
        <Spinner size="lg" />
        <Text size="sm" className="tw:mt-md" style={{ color: colors.gray[600] }}>
          This may take a moment for first-time loads
        </Text>
      </Stack>
    </Container>
  );
}
