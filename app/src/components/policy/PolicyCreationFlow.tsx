import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Text,
  Title,
  Box,
  Group,
  Stack,
  Card,
  TextInput,
  NumberInput,
  Select,
  Paper,
  Flex,
  ScrollArea,
  ActionIcon,
  Checkbox,
  Collapse,
  Button,
  Badge,
  CloseButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCode,
  IconSearch,
  IconFilter,
  IconDots,
  IconChevronRight,
  IconChevronDown,
  IconInfoCircle,
  IconFolder,
  IconFolderOpen,
  IconSettings,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MultiStepModal, { ModalStep } from '@/components/shared/MultiStepModal';
import { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { parametersAPI, ParameterValueCreate } from '@/api/parameters';
import { policiesAPI, PolicyCreate } from '@/api/v2/policies';
import { AppDispatch, RootState } from '@/store';

interface PolicyCreationFlowProps {
  opened: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface Provision {
  parameterId: string;
  parameterName: string;
  value: number | string | boolean;
  startDate?: string;
  endDate?: string;
  baselineValue?: number | string | boolean;
}

export default function PolicyCreationFlow({
  opened,
  onClose,
  onComplete,
}: PolicyCreationFlowProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { countryId } = useParams<{ countryId: string }>();

  // Map country codes to model IDs (matching metadataReducer logic)
  const getModelId = (country: string) => {
    const modelIdMap: Record<string, string> = {
      'us': 'policyengine_us',
      'uk': 'policyengine_uk',
      'ca': 'policyengine_ca',
      'ng': 'policyengine_ng',
      'il': 'policyengine_il'
    };
    return modelIdMap[country] || `policyengine_${country}`;
  };

  // Step 1: Name policy
  const [policyName, setPolicyName] = useState('');
  const [policyDescription, setPolicyDescription] = useState('');

  // Step 2: Parameter selection
  const [selectedParamId, setSelectedParamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [baselineValues, setBaselineValues] = useState<Record<string, any>>({});
  const [loadingBaseline, setLoadingBaseline] = useState(false);
  const [showAllParameters, setShowAllParameters] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [provisions, setProvisions] = useState<Provision[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get metadata from Redux state
  const { parameters, loading, error, currentCountry } = useSelector(
    (state: RootState) => state.metadata
  );

  // Fetch metadata when component mounts or country changes
  useEffect(() => {
    if (countryId && !loading) {
      if (!currentCountry || countryId !== currentCountry || !parameters || Object.keys(parameters).length === 0) {
        dispatch(fetchMetadataThunk(countryId));
      }
    }
  }, [dispatch, countryId]);

  // Build tree structure from parameter names
  const buildParameterTree = () => {
    const tree: any = {};

    Object.entries(parameters || {}).forEach(([key, param]) => {
      // Filter out parameters without descriptions unless showAllParameters is true
      if (!showAllParameters && !param.description) {
        return;
      }

      // Filter based on search
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matches = key.toLowerCase().includes(searchLower) ||
          param.label?.toLowerCase().includes(searchLower) ||
          param.description?.toLowerCase().includes(searchLower);
        if (!matches) return;
      }

      const parts = key.split('.');
      let current = tree;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (i === parts.length - 1) {
          // Leaf node (actual parameter)
          if (!current._params) current._params = [];
          current._params.push({ key, ...param });
        } else {
          // Folder node
          if (!current[part]) {
            current[part] = { _isFolder: true };
          }
          current = current[part];
        }
      }
    });

    return tree;
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const parameterTree = buildParameterTree();
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
          limit: 10000
        });

        // Create a values object from baseline values
        const values: Record<string, any> = {};
        relevantBaselines.forEach((bv: any) => {
          // Ensure we have a proper date format
          let date = bv.start_date || '2024-01-01';
          if (!date.includes('-')) {
            date = `${date}-01-01`;
          }
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
          // Ensure we have a proper date format (YYYY-MM-DD)
          if (mostRecentDate.includes('-')) {
            setStartDate(mostRecentDate);
          } else {
            // If it's just a year, append -01-01 to make it a valid date
            setStartDate(`${mostRecentDate}-01-01`);
          }
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
        // Extract year from date, handling both YYYY and YYYY-MM-DD formats
        year: date.includes('-') ? date.split('-')[0] : date,
        value: typeof value === 'number' ? value : parseFloat(String(value)) || 0
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  };

  const chartData = getChartData();

  // Component to render tree structure
  const renderTree = (node: any, path: string = '') => {
    return Object.entries(node).map(([key, value]: [string, any]) => {
      if (key === '_params' || key === '_isFolder') return null;

      const currentPath = path ? `${path}.${key}` : key;
      const isExpanded = expandedFolders.has(currentPath);
      const hasChildren = Object.keys(value).some(k => k !== '_isFolder' && k !== '_params');
      const params = value._params || [];

      // Format folder names to be more readable
      const formatFolderName = (name: string) => {
        return name
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      };

      return (
        <div key={currentPath} style={{ marginLeft: path ? 16 : 0 }}>
          {hasChildren && (
            <>
              <Button
                variant="subtle"
                fullWidth
                justify="flex-start"
                leftSection={
                  isExpanded ? <IconFolderOpen size={14} /> : <IconFolder size={14} />
                }
                rightSection={
                  isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />
                }
                onClick={() => toggleFolder(currentPath)}
                styles={{
                  root: {
                    marginBottom: '4px',
                    height: '28px',
                    fontSize: '13px',
                  },
                  label: { fontWeight: 500 }
                }}
              >
                {formatFolderName(key)}
              </Button>
              <Collapse in={isExpanded}>
                {renderTree(value, currentPath)}
              </Collapse>
            </>
          )}
          {params.map((param: any) => (
            <Button
              key={param.key}
              variant={selectedParamId === param.key ? 'filled' : 'subtle'}
              color={selectedParamId === param.key ? 'teal' : 'gray'}
              fullWidth
              justify="flex-start"
              onClick={() => setSelectedParamId(param.key)}
              styles={{
                root: {
                  marginBottom: '2px',
                  marginLeft: hasChildren ? 20 : 0,
                  height: '26px',
                  fontSize: '12px',
                },
                inner: { justifyContent: 'flex-start' },
                label: { fontWeight: 400 }
              }}
            >
              <Text size="xs" truncate>
                {param.label || param.key.split('.').pop()}
              </Text>
            </Button>
          ))}
        </div>
      );
    });
  };

  const handleAddProvision = () => {
    if (selectedParamId && currentValue !== undefined) {
      const parameterName = selectedParamId.split('.').pop() || selectedParamId;
      // Try to find baseline value for the date or year
      const baselineValuesForParam = baselineValues[selectedParamId] || {};
      const baselineValue = baselineValuesForParam[startDate] ||
                           baselineValuesForParam[startDate.split('-')[0]] ||
                           0;

      // Check if provision already exists for this parameter
      const existingIndex = provisions.findIndex(p => p.parameterId === selectedParamId);

      const newProvision: Provision = {
        parameterId: selectedParamId,
        parameterName,
        value: currentValue,
        startDate: startDate,
        endDate: endDate,
        baselineValue,
      };

      if (existingIndex >= 0) {
        // Update existing provision
        const updatedProvisions = [...provisions];
        updatedProvisions[existingIndex] = newProvision;
        setProvisions(updatedProvisions);
      } else {
        // Add new provision
        setProvisions([...provisions, newProvision]);
      }

      // Reset selection but keep parameter selected for convenience
      setCurrentValue(0);
    }
  };

  const handleRemoveProvision = (parameterId: string) => {
    setProvisions(provisions.filter(p => p.parameterId !== parameterId));
  };

  const handleSubmitPolicy = async () => {
    if (!policyName.trim() || provisions.length === 0) {
      notifications.show({
        title: 'Missing information',
        message: 'Please provide a policy name and at least one provision',
        color: 'red',
        icon: <IconX size={16} />,
      });
      return false;
    }

    setIsSubmitting(true);
    try {
      // Create policy data
      const policyData: PolicyCreate = {
        name: policyName,
        description: policyDescription || undefined,
        country: countryId,
      };

      // Create parameter values from provisions
      const modelId = getModelId(countryId || 'us');
      const parameterValues: Omit<ParameterValueCreate, 'policy_id'>[] = provisions.map(provision => ({
        parameter_id: provision.parameterId,
        model_id: modelId,
        value: provision.value,
        start_date: provision.startDate,
        end_date: provision.endDate,
      }));

      // Submit to API
      const createdPolicy = await policiesAPI.createWithParameters(policyData, parameterValues);

      notifications.show({
        title: 'Policy created successfully',
        message: `Policy "${policyName}" has been created with ${provisions.length} provision${provisions.length !== 1 ? 's' : ''}`,
        color: 'teal',
        icon: <IconCheck size={16} />,
      });

      // Reset form
      setPolicyName('');
      setPolicyDescription('');
      setProvisions([]);

      if (onComplete) {
        onComplete();
      }

      onClose();
      return true;
    } catch (error) {
      console.error('Failed to create policy:', error);
      notifications.show({
        title: 'Failed to create policy',
        message: 'An error occurred while creating the policy. Please try again.',
        color: 'red',
        icon: <IconX size={16} />,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: ModalStep[] = [
    {
      id: 'name',
      title: 'Create a reform',
      description: 'Reform your baseline policy to model impact.',
      icon: <IconCode size={19} color="#666" />,
      size: 'sm',
      content: (
        <Stack gap="md">
          <TextInput
            label="Reform title"
            placeholder="Policy name"
            value={policyName}
            onChange={(event) => setPolicyName(event.currentTarget.value)}
            required
            styles={{
              label: {
                fontSize: 14,
                fontWeight: 500,
                color: '#344054',
              },
              input: {
                fontSize: 16,
                '&::placeholder': {
                  color: '#667085',
                },
              },
            }}
          />
          <TextInput
            label="Description (optional)"
            placeholder="Describe your policy reform"
            value={policyDescription}
            onChange={(event) => setPolicyDescription(event.currentTarget.value)}
            styles={{
              label: {
                fontSize: 14,
                fontWeight: 500,
                color: '#344054',
              },
              input: {
                fontSize: 14,
                '&::placeholder': {
                  color: '#667085',
                },
              },
            }}
          />
        </Stack>
      ),
      primaryButton: {
        label: 'Next',
        disabled: !policyName.trim(),
      },
      onNext: () => {
        return true;
      },
    },
    {
      id: 'parameters',
      title: 'Select parameters',
      description: policyName ? `Editing: ${policyName}` : 'Add provisions to your policy',
      icon: <IconSettings size={19} color="#666" />,
      size: '90%',
      content: (
        <Box style={{ height: '60vh' }}>
          <Flex h="100%" gap="md" style={{ margin: '-1.5rem' }}>
            {/* Left Sidebar */}
            <Box w={320} style={{ borderRight: '1px solid var(--mantine-color-gray-2)', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Stack h="100%" p="md" gap="sm">
                <TextInput
                  placeholder="Search parameters"
                  leftSection={<IconSearch size={14} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  styles={{
                    input: { fontSize: '13px' }
                  }}
                />

                <Group gap="xs">
                  <Checkbox
                    label="Show all parameters"
                    checked={showAllParameters}
                    onChange={(e) => setShowAllParameters(e.currentTarget.checked)}
                    size="xs"
                    styles={{
                      label: { fontSize: '12px' }
                    }}
                  />
                </Group>

                <ScrollArea style={{ flex: 1 }}>
                  <Stack gap="xs">
                    {loading ? (
                      <Text size="sm" c="dimmed">Loading parameters...</Text>
                    ) : Object.keys(parameterTree).length === 0 ? (
                      <Text size="sm" c="dimmed">
                        {searchQuery ? 'No parameters found' : 'No parameters with descriptions'}
                      </Text>
                    ) : (
                      renderTree(parameterTree)
                    )}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Box>

            {/* Right Content */}
            <Box style={{ flex: 1, overflowY: 'auto' }} p="xl">
              {/* Provisions List */}
              {provisions.length > 0 && (
                <Box mb="lg">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>Active provisions</Text>
                    <Badge color="teal" variant="light" size="sm">
                      {provisions.length}
                    </Badge>
                  </Group>
                  <Stack gap={4}>
                    {provisions.map((provision) => (
                      <Card key={provision.parameterId} withBorder radius="sm" p="xs">
                        <Group justify="space-between">
                          <div>
                            <Text size="xs" fw={500}>
                              {provision.parameterName}
                            </Text>
                            <Group gap="xs">
                              <Text size="xs" c="teal">
                                {typeof provision.value === 'number'
                                  ? provision.value.toLocaleString()
                                  : String(provision.value)}
                              </Text>
                              {provision.baselineValue !== undefined && provision.baselineValue !== provision.value && (
                                <Text size="xs" c="dimmed">
                                  from {typeof provision.baselineValue === 'number'
                                    ? provision.baselineValue.toLocaleString()
                                    : String(provision.baselineValue)}
                                </Text>
                              )}
                            </Group>
                          </div>
                          <CloseButton
                            size="xs"
                            onClick={() => handleRemoveProvision(provision.parameterId)}
                          />
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {selectedParam ? (
                <Stack gap="lg">
                  <div>
                    <Title order={3} fw={600} mb="xs">
                      {selectedParam.label || selectedParamId?.split('.').pop() || 'Parameter'}
                    </Title>
                    <Text size="xs" c="dimmed" mb="lg">
                      {selectedParamId || ''}
                    </Text>

                    {/* Description */}
                    {selectedParam?.description && (
                      <Card withBorder radius="md" p="md" mb="md">
                        <Text size="sm" lh={1.5}>
                          {selectedParam.description}
                        </Text>
                      </Card>
                    )}
                  </div>

                  {/* Current Value */}
                  <Card withBorder radius="md" p="md">
                    <Stack gap="md">
                      <Text size="sm" fw={500}>Set value</Text>
                      <Group align="end" gap="sm">
                        {selectedParam?.unit?.includes('currency') && (
                          <Text size="lg" c="dimmed">$</Text>
                        )}
                        <NumberInput
                          value={currentValue}
                          onChange={(val) => setCurrentValue(val as number)}
                          decimalScale={2}
                          fixedDecimalScale
                          w={120}
                          size="sm"
                        />
                        <TextInput
                          label="Start date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.currentTarget.value)}
                          placeholder="YYYY-MM-DD"
                          w={140}
                          size="sm"
                        />
                        <Button
                          variant="filled"
                          color="teal"
                          onClick={handleAddProvision}
                          size="sm"
                        >
                          Add provision
                        </Button>
                      </Group>
                    </Stack>
                  </Card>

                  {/* Historical Values */}
                  {chartData.length > 0 && (
                    <Card withBorder radius="md" p="md">
                      <Text size="sm" fw={500} mb="sm">Historical values</Text>
                      <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis
                              dataKey="year"
                              stroke="#666"
                              style={{ fontSize: '12px' }}
                            />
                            <YAxis
                              stroke="#666"
                              style={{ fontSize: '12px' }}
                              tickFormatter={(value: number) => {
                                const unit = selectedParam?.unit || '';
                                if (unit === 'currency-USD' || unit.includes('currency')) {
                                  return `$${value.toLocaleString()}`;
                                }
                                return value.toLocaleString();
                              }}
                            />
                            <Tooltip
                              formatter={(value: number) => {
                                const unit = selectedParam?.unit || '';
                                if (unit === 'currency-USD' || unit.includes('currency')) {
                                  return `$${value.toLocaleString()}`;
                                }
                                return value.toLocaleString();
                              }}
                              labelFormatter={(label) => `Year: ${label}`}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#319795"
                              strokeWidth={2}
                              dot={{ fill: '#319795', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                    </Card>
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
        </Box>
      ),
      footer: (
        <Group justify="space-between" w="100%">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Group>
            <Text size="sm" c="dimmed">
              {provisions.length === 0 ? 'No provisions' : `${provisions.length} provision${provisions.length !== 1 ? 's' : ''}`}
            </Text>
            <Button
              onClick={handleSubmitPolicy}
              loading={isSubmitting}
              disabled={provisions.length === 0}
            >
              Create policy
            </Button>
          </Group>
        </Group>
      ),
      hideFooter: false,
      primaryButton: undefined,
      secondaryButton: undefined,
    }
  ];

  return (
    <MultiStepModal
      opened={opened}
      onClose={onClose}
      steps={steps}
      onComplete={onComplete}
    />
  );
}