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
  Badge,
  Loader,
  Center,
  Code,
} from '@mantine/core';
import { IconChevronLeft } from '@tabler/icons-react';
import { variablesAPI } from '@/api/v2/variables';

export default function VariableDetailPage() {
  const { variableName, countryId } = useParams<{ variableName: string; countryId: string }>();
  const navigate = useNavigate();

  const { data: variable, isLoading } = useQuery({
    queryKey: ['variable', variableName],
    queryFn: () => variablesAPI.get(variableName!),
    enabled: !!variableName,
  });

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!variable) {
    return (
      <Container size="md" py="xl">
        <Text>Variable not found</Text>
      </Container>
    );
  }

  const capitalizeFirst = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const displayLabel = capitalizeFirst(variable.label || variable.name);

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
          <Group gap="sm">
            <Title order={2}>{displayLabel}</Title>
            {variable.unit && (
              <Badge variant="light" size="lg">
                {variable.unit}
              </Badge>
            )}
          </Group>

          {variable.description && (
            <Text size="sm" c="dimmed">
              {variable.description}
            </Text>
          )}

          <Divider />

          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Group>
                <Text size="sm" fw={600} c="dimmed">
                  Variable name:
                </Text>
                <Code>{variable.name}</Code>
              </Group>

              {variable.entity && (
                <Group>
                  <Text size="sm" fw={600} c="dimmed">
                    Entity:
                  </Text>
                  <Badge variant="outline">{variable.entity}</Badge>
                </Group>
              )}

              {variable.value_type && (
                <Group>
                  <Text size="sm" fw={600} c="dimmed">
                    Type:
                  </Text>
                  <Badge variant="outline">{variable.value_type}</Badge>
                </Group>
              )}

              {variable.definition_period && (
                <Group>
                  <Text size="sm" fw={600} c="dimmed">
                    Period:
                  </Text>
                  <Badge variant="outline">{variable.definition_period}</Badge>
                </Group>
              )}

              {variable.documentation && (
                <Stack gap="xs">
                  <Text size="sm" fw={600} c="dimmed">
                    Documentation:
                  </Text>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {variable.documentation}
                  </Text>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Container>
  );
}
