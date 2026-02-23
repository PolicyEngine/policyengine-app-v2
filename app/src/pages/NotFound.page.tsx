import { Link, useParams } from 'react-router-dom';
import { Button, Container, Stack, Text, Title } from '@/components/ui';
import { colors } from '@/designTokens';

export default function NotFoundPage() {
  const { countryId } = useParams<{ countryId: string }>();

  return (
    <Container variant="guttered">
      <Title order={2} variant="colored">
        Page not found
      </Title>
      <Text className="tw:mb-sm" style={{ color: colors.gray[500] }}>
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <hr className="tw:border-border-light tw:my-sm" />

      <Stack className="tw:items-center tw:justify-center tw:py-20">
        <Text
          size="xl"
          fw={700}
          style={{ fontSize: '72px', lineHeight: 1, color: colors.primary[500] }}
        >
          404
        </Text>
        <Text size="sm" className="tw:mt-md" style={{ color: colors.gray[500] }}>
          Check the URL or head back to your reports.
        </Text>
        <Button className="tw:mt-md" asChild>
          <Link to={`/${countryId || 'us'}/reports`}>Go to reports</Link>
        </Button>
      </Stack>
    </Container>
  );
}
