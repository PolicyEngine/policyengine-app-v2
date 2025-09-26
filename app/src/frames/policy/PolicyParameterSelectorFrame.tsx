import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Modal,
  Text,
  Title,
  Box,
  Group,
  Button,
  Stack,
  Card,
  TextInput,
  NumberInput,
  Select,
  Paper,
  Flex,
  ScrollArea,
  ActionIcon,
} from '@mantine/core';
import { IconSearch, IconFilter, IconDots, IconChevronRight, IconInfoCircle } from '@tabler/icons-react';
import { LineChart } from '@mantine/charts';
import { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { parametersAPI } from '@/api/parameters';
import { AppDispatch, RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function PolicyParameterSelectorFrame({
  onNavigate,
  onReturn,
  flowConfig,
  isInSubflow,
  flowDepth,
}: FlowComponentProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { countryId } = useParams<{ countryId: string }>();
  const [selectedParamId, setSelectedParamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [startDate, setStartDate] = useState('2025');
  const [baselineValues, setBaselineValues] = useState<Record<string, any>>({});
  const [loadingBaseline, setLoadingBaseline] = useState(false);

  // Get metadata from Redux state
  const { parameters, loading, error, currentCountry } = useSelector(
    (state: RootState) => state.metadata
  );

  // Get current policy from Redux
  const { policies, currentPosition } = useSelector((state: RootState) => state.policy);
  const currentPolicy = policies[currentPosition];

  // Fetch metadata when component mounts or country changes
  useEffect(() => {
    if (countryId && !loading) {
      if (!currentCountry || countryId !== currentCountry || !parameters || Object.keys(parameters).length === 0) {
        dispatch(fetchMetadataThunk(countryId));
      }
    }
  }, [dispatch, countryId]);

  // Group parameters by category
  const parameterCategories = Object.entries(parameters || {}).reduce((acc, [key, param]) => {
    const category = param.category || 'Parameters';
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key, ...param });
    return acc;
  }, {} as Record<string, any[]>);

  // Filter parameters based on search
  const filteredCategories = Object.entries(parameterCategories).reduce((acc, [category, params]) => {
    const filtered = params.filter((param: any) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        param.key.toLowerCase().includes(searchLower) ||
        param.label?.toLowerCase().includes(searchLower) ||
        param.description?.toLowerCase().includes(searchLower)
      );
    });
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, any[]>);

  const selectedParam = selectedParamId ? parameters[selectedParamId] : null;

  // Fetch baseline values when a parameter is selected
  useEffect(() => {
    const fetchBaselineForParameter = async () => {
      if (!selectedParamId) return;

      setLoadingBaseline(true);
      try {
        // Only fetch baseline values for this specific parameter using the API filter
        const relevantBaselines = await parametersAPI.listBaselineParameterValues({
          parameter_id: selectedParamId,
          limit: 1000
        });

        // Create a values object from baseline values
        const values: Record<string, any> = {};
        relevantBaselines.forEach((bv: any) => {
          const date = bv.start_date || '2024';
          values[date] = bv.value;
        });

        setBaselineValues(prev => ({
          ...prev,
          [selectedParamId]: values
        }));

        // Set current value from baseline
        if (Object.keys(values).length > 0) {
          const dates = Object.keys(values).sort();
          const mostRecentDate = dates[dates.length - 1];
          const value = values[mostRecentDate];
          setCurrentValue(typeof value === 'number' ? value : parseFloat(String(value)) || 0);
          setStartDate(mostRecentDate.split('-')[0] || '2025');
        }
      } catch (error) {
        console.error('Failed to fetch baseline values:', error);
      } finally {
        setLoadingBaseline(false);
      }
    };

    fetchBaselineForParameter();
  }, [selectedParamId]);

  // Get historical values for the chart
  const getChartData = () => {
    if (!selectedParamId || !baselineValues[selectedParamId]) {
      return [];
    }

    // Convert values object to chart data
    return Object.entries(baselineValues[selectedParamId])
      .map(([date, value]) => ({
        year: date.split('-')[0], // Extract year from date
        value: typeof value === 'number' ? value : parseFloat(String(value)) || 0
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  };

  const chartData = getChartData();

  return (
    <Modal
      opened={true}
      onClose={onReturn}
      size="90%"
      padding={0}
      withCloseButton={false}
      centered
      styles={{
        content: { maxWidth: '1200px', height: '85vh', maxHeight: '800px' },
        body: { padding: 0, height: '100%' }
      }}
    >
      <Stack h="100%" gap={0}>
        {/* Header */}
        <Paper p="md" radius={0} style={{ borderBottom: '1px solid #e0e0e0' }}>
          <Group justify="space-between">
            <Button variant="subtle" onClick={onReturn}>
              Cancel
            </Button>
            <Stack gap={0} align="center">
              <Title order={4}>Reform Policy #{currentPolicy?.id || '0001'}</Title>
              <Text size="sm" c="dimmed">Baseline: Current Law</Text>
            </Stack>
            <Button
              variant="subtle"
              onClick={() => onNavigate('next')}
              rightSection={<IconChevronRight size={16} />}
            >
              Next
            </Button>
          </Group>
        </Paper>

        {/* Main Content */}
        <Flex h="calc(100% - 120px)" style={{ overflow: 'hidden' }}>
          {/* Left Sidebar */}
          <Paper w={300} p="md" style={{ borderRight: '1px solid #e0e0e0', overflowY: 'hidden' }}>
            <Stack h="100%">
              <div>
                <Title order={5}>Select Parameters</Title>
                <Text size="sm" c="dimmed">Make changes and provisions to your policy.</Text>
              </div>

              <TextInput
                placeholder="Search"
                leftSection={<IconSearch size={16} />}
                rightSection={
                  <Button size="xs" variant="subtle" leftSection={<IconFilter size={14} />}>
                    Filter
                  </Button>
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
              />

              <ScrollArea style={{ flex: 1 }}>
                <Stack gap="xs">
                  {loading ? (
                    <Text size="sm" c="dimmed">Loading parameters...</Text>
                  ) : Object.keys(filteredCategories).length === 0 ? (
                    <Text size="sm" c="dimmed">No parameters found</Text>
                  ) : (
                    Object.entries(filteredCategories).map(([category, params]) => (
                      <div key={category}>
                        <Text size="sm" fw={600} c="dimmed" mb="xs">{category}</Text>
                        {params.map((param: any) => (
                          <Button
                            key={param.key}
                            variant={selectedParamId === param.key ? 'light' : 'subtle'}
                            fullWidth
                            justify="space-between"
                            rightSection={<IconChevronRight size={16} />}
                            onClick={() => setSelectedParamId(param.key)}
                            styles={{
                              root: { marginBottom: '4px' },
                              inner: { justifyContent: 'flex-start' },
                              label: { fontWeight: 400 }
                            }}
                          >
                            {param.key}
                          </Button>
                        ))}
                      </div>
                    ))
                  )}
                </Stack>
              </ScrollArea>
            </Stack>
          </Paper>

          {/* Right Content */}
          <Box style={{ flex: 1, overflowY: 'auto' }} p="xl">
            {selectedParam ? (
              <Stack gap="xl">
                <div>
                  <Title order={2} mb="md">
                    {selectedParamId}
                  </Title>

                  {/* Policy Summary */}
                  {selectedParam?.summary && (
                    <Card withBorder radius="md" p="md" mb="lg">
                      <Group gap="xs" mb="sm">
                        <IconInfoCircle size={16} color="var(--mantine-color-blue-6)" />
                        <Text size="sm" fw={600}>Policy Summary</Text>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {selectedParam.summary}
                      </Text>
                    </Card>
                  )}

                  {/* Description */}
                  {selectedParam?.description && (
                    <div>
                      <Title order={5} mb="sm">Description</Title>
                      <Text>{selectedParam.description}</Text>
                    </div>
                  )}
                </div>

                {/* Current Value */}
                <div>
                  <Title order={5} mb="md">Current Value</Title>
                  <Group align="end" gap="md">
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed">From</Text>
                      <TextInput
                        value={startDate}
                        onChange={(e) => setStartDate(e.currentTarget.value)}
                        rightSection={<IconDots size={16} />}
                        w={120}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed">Onward</Text>
                      <Group gap="xs">
                        {selectedParam?.unit?.includes('currency') && <Text size="lg">$</Text>}
                        <NumberInput
                          value={currentValue}
                          onChange={(val) => setCurrentValue(val as number)}
                          decimalScale={2}
                          fixedDecimalScale
                          w={100}
                        />
                        {selectedParam?.unit && (
                          <Select
                            value={selectedParam.unit.split('-')[1] || 'USD'}
                            data={['USD', 'EUR', 'GBP']}
                            w={90}
                          />
                        )}
                        <ActionIcon variant="subtle">
                          <IconDots size={16} />
                        </ActionIcon>
                        <Button variant="light">Add</Button>
                      </Group>
                    </Stack>
                  </Group>
                </div>

                {/* Historical Values */}
                {chartData.length > 0 && (
                  <div>
                    <Title order={5} mb="md">Historical Values</Title>
                    <Text size="sm" c="dimmed" mb="md">
                      {selectedParamId} over time
                    </Text>
                    <Card withBorder p="md">
                      <LineChart
                        h={200}
                        data={chartData}
                        dataKey="year"
                        series={[{ name: 'value', color: 'teal' }]}
                        yAxisProps={{
                          tickFormatter: (value: number) => {
                            const unit = selectedParam?.unit || '';
                            if (unit === 'currency-USD' || unit.includes('currency')) {
                              return `$${value.toFixed(2)}`;
                            }
                            return value.toString();
                          }
                        }}
                        gridAxis="y"
                        withDots={false}
                      />
                    </Card>
                  </div>
                )}
              </Stack>
            ) : (
              <Flex align="center" justify="center" h="100%">
                <Stack align="center">
                  <Title order={3} c="dimmed">No parameter selected</Title>
                  <Text c="dimmed">Select a parameter from the list to view and edit its details</Text>
                </Stack>
              </Flex>
            )}
          </Box>
        </Flex>

        {/* Footer */}
        <Paper p="md" radius={0} style={{ borderTop: '1px solid #e0e0e0' }}>
          <Group justify="space-between">
            <Button variant="default" onClick={onReturn}>
              Cancel
            </Button>
            <Group>
              <Text size="sm" c="dimmed">No Provisions</Text>
              <Button onClick={() => onNavigate('next')}>
                Next
              </Button>
            </Group>
          </Group>
        </Paper>
      </Stack>
    </Modal>
  );
}