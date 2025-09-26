import { useEffect, useState } from 'react';
import { Badge, Button, Code, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { parametersAPI } from '@/api/parameters';
import { datasetsAPI } from '@/api/v2/datasets';
import { policiesAPI } from '@/api/v2/policies';
import { simulationsAPI } from '@/api/v2/simulations';

export default function TestPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testAPIs() {
      const testResults: any = {};

      try {
        // Test simulations API
        console.log('Testing simulations API...');
        const simulations = await simulationsAPI.list({ limit: 5 });
        testResults.simulations = { success: true, count: simulations.length, data: simulations };
      } catch (error) {
        console.error('Simulations API error:', error);
        testResults.simulations = { success: false, error: String(error) };
      }

      try {
        // Test policies API
        console.log('Testing policies API...');
        const policies = await policiesAPI.list({ limit: 5 });
        testResults.policies = { success: true, count: policies.length, data: policies };
      } catch (error) {
        console.error('Policies API error:', error);
        testResults.policies = { success: false, error: String(error) };
      }

      try {
        // Test parameters API
        console.log('Testing parameters API...');
        const parameters = await parametersAPI.listParameters({ limit: 5 });
        testResults.parameters = { success: true, count: parameters.length, data: parameters };
      } catch (error) {
        console.error('Parameters API error:', error);
        testResults.parameters = { success: false, error: String(error) };
      }

      try {
        // Test datasets API
        console.log('Testing datasets API...');
        const datasets = await datasetsAPI.listDatasets({ limit: 5 });
        testResults.datasets = { success: true, count: datasets.length, data: datasets };
      } catch (error) {
        console.error('Datasets API error:', error);
        testResults.datasets = { success: false, error: String(error) };
      }

      setResults(testResults);
      setLoading(false);
    }

    testAPIs();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Container size="lg" mt="xl">
        <Title order={1}>Testing API Integration...</Title>
      </Container>
    );
  }

  return (
    <Container size="lg" mt="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={1}>API Integration Test</Title>
          <Button onClick={handleRefresh}>Refresh</Button>
        </Group>

        <Text size="sm" c="dimmed">
          Testing connection to API at: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
        </Text>

        {Object.entries(results).map(([endpoint, result]: [string, any]) => (
          <Paper key={endpoint} shadow="xs" p="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Title order={3}>{endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}</Title>
              <Badge color={result.success ? 'green' : 'red'}>
                {result.success ? 'SUCCESS' : 'FAILED'}
              </Badge>
            </Group>

            {result.success ? (
              <>
                <Text size="sm" c="dimmed" mb="xs">
                  Fetched {result.count} items
                </Text>
                <Code block style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(result.data, null, 2)}
                </Code>
              </>
            ) : (
              <Text c="red" size="sm">
                Error: {result.error}
              </Text>
            )}
          </Paper>
        ))}
      </Stack>
    </Container>
  );
}
