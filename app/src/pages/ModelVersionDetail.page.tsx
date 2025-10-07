import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Paper,
  Divider,
  Loader,
  Center,
} from '@mantine/core';
import { IconChevronLeft } from '@tabler/icons-react';
import { modelVersionsAPI } from '@/api/v2/modelVersions';
import { formatDateTime } from '@/utils/datetime';

export default function ModelVersionDetailPage() {
  const { modelVersionId } = useParams<{ modelVersionId: string }>();
  const navigate = useNavigate();

  const { data: modelVersion, isLoading } = useQuery({
    queryKey: ['modelVersion', modelVersionId],
    queryFn: () => modelVersionsAPI.get(modelVersionId!),
    enabled: !!modelVersionId,
  });

  if (!modelVersionId) {
    return (
      <Container>
        <Text>Invalid model version ID</Text>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container py="xl">
        <Center>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (!modelVersion) {
    return (
      <Container>
        <Text>Model version not found</Text>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconChevronLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </Group>

        <Stack gap="md">
          <Title order={2}>Model version {modelVersion.version}</Title>
        </Stack>

        <Divider />

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <div>
              <Text size="sm" fw={600} mb="xs">
                Model version ID
              </Text>
              <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                {modelVersion.id}
              </Text>
            </div>

            <div>
              <Text size="sm" fw={600} mb="xs">
                Model ID
              </Text>
              <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                {modelVersion.model_id}
              </Text>
            </div>

            <div>
              <Text size="sm" fw={600} mb="xs">
                Version
              </Text>
              <Text size="sm">{modelVersion.version}</Text>
            </div>

            {modelVersion.created_at && (
              <>
                <Divider />
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    Created: {formatDateTime(modelVersion.created_at)}
                  </Text>
                  {modelVersion.updated_at && (
                    <>
                      <Text size="xs" c="dimmed">
                        •
                      </Text>
                      <Text size="xs" c="dimmed">
                        Updated: {formatDateTime(modelVersion.updated_at)}
                      </Text>
                    </>
                  )}
                </Group>
              </>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
