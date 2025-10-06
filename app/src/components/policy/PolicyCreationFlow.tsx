import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
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
  IconInfoCircle,
  IconSettings,
  IconCheck,
  IconX,
  IconChevronRight,
} from '@tabler/icons-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import BaseModal from '@/components/shared/BaseModal';
import ParameterSelectionModal from '@/components/shared/ParameterSelectionModal';
import YearRangeSelector from '@/components/shared/YearRangeSelector';
import { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { parametersAPI, ParameterValueCreate } from '@/api/parameters';
import { policiesAPI, PolicyCreate } from '@/api/v2/policies';
import { userPoliciesAPI } from '@/api/v2/userPolicies';
import { AppDispatch, RootState } from '@/store';
import { useCurrentModel } from '@/hooks/useCurrentModel';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { MOCK_USER_ID } from '@/constants';

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
  const queryClient = useQueryClient();
  const { modelId } = useCurrentModel();
  const countryId = useCurrentCountry();
  const [currentStep, setCurrentStep] = useState<'name' | 'parameters'>('name');

  // Step 1: Name policy
  const [policyName, setPolicyName] = useState('');
  const [policyDescription, setPolicyDescription] = useState('');

  // Step 2: Parameter selection
  const [selectedParamId, setSelectedParamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [startDate, setStartDate] = useState('2025');
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [baselineValues, setBaselineValues] = useState<Record<string, any>>({});
  const [, setLoadingBaseline] = useState(false);
  const showAllParameters = true; // Always show all parameters like in Figma
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [provisions, setProvisions] = useState<Provision[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get metadata from Redux state
  const { parameters, loading, currentCountry } = useSelector(
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

    // Collect all parameters to process
    const paramsToProcess: Array<[string, any]> = [];

    Object.entries(parameters || {}).forEach(([key, param]) => {
      // Filter out parameters without labels unless showAllParameters is true
      if (!showAllParameters && !param.label) {
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

      paramsToProcess.push([key, param]);
    });

    // Build tree from all parameters
    paramsToProcess.forEach(([key, param]) => {
      // Parse the key to handle brackets and dots
      const parts = key.split(/(\[[^\]]+\])/).filter(p => p).reduce((acc: string[], part) => {
        if (part.startsWith('[')) {
          acc.push(part);
        } else {
          acc.push(...part.split('.').filter(p => p));
        }
        return acc;
      }, []);

      let current = tree;

      // Navigate/create the tree structure
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (!current[part]) {
          current[part] = {};
        }

        if (isLast) {
          // Mark as parameter and store data
          current[part]._isParam = true;
          // Keep the original parameter data as-is
          current[part]._data = { ...param, key };
        } else {
          // Navigate deeper
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

        // Set current value from baseline at the start date or most recent, skipping infinity values
        if (Object.keys(values).length > 0) {
          const dates = Object.keys(values).sort();

          // Find value at current start date or closest earlier date
          let valueToSet = 0;

          // Check if we have a value for the current start date
          const startYear = startDate.includes('-') ? startDate.split('-')[0] : startDate;
          const startKey = values[startDate] !== undefined ? startDate :
                          values[startYear] !== undefined ? startYear : null;

          if (startKey) {
            const candidateValue = values[startKey];
            const numValue = typeof candidateValue === 'number' ? candidateValue : parseFloat(String(candidateValue)) || 0;
            if (isFinite(numValue)) {
              valueToSet = numValue;
            }
          }

          // If we didn't find a finite value at start date, find the most recent finite value before start date
          if (valueToSet === 0) {
            for (let i = dates.length - 1; i >= 0; i--) {
              const date = dates[i];
              const year = date.includes('-') ? date.split('-')[0] : date;
              if (parseInt(year) <= parseInt(startYear)) {
                const candidateValue = values[date];
                const numValue = typeof candidateValue === 'number' ? candidateValue : parseFloat(String(candidateValue)) || 0;
                if (isFinite(numValue)) {
                  valueToSet = numValue;
                  break;
                }
              }
            }
          }

          setCurrentValue(valueToSet);
        }
      } catch (error) {
        console.error('Failed to fetch baseline values:', error);
      } finally {
        setLoadingBaseline(false);
      }
    };

    fetchBaselineForParameter();
  }, [selectedParamId, startDate]);

  // Get historical values for the chart
  const getChartData = () => {
    console.log('getChartData called with:', {
      selectedParamId,
      provisions: provisions,
      provisionsLength: provisions.length
    });

    // Create data for 2010-2040 range
    const chartData = [];
    const startYear = 2010;
    const endYear = 2040;

    // Get baseline values if available
    const baselineVals = selectedParamId && baselineValues[selectedParamId] ? baselineValues[selectedParamId] : {};

    // Create entries for each year
    for (let year = startYear; year <= endYear; year++) {
      const yearStr = String(year);
      let baselineValue = null;

      // Check for baseline value at this year
      if (baselineVals[yearStr]) {
        baselineValue = baselineVals[yearStr];
      } else if (baselineVals[`${yearStr}-01-01`]) {
        baselineValue = baselineVals[`${yearStr}-01-01`];
      } else {
        // Find most recent baseline value before this year
        const sortedDates = Object.keys(baselineVals).sort();
        for (let i = sortedDates.length - 1; i >= 0; i--) {
          const date = sortedDates[i];
          const dateYear = parseInt(date.includes('-') ? date.split('-')[0] : date);
          if (dateYear <= year) {
            baselineValue = baselineVals[date];
            break;
          }
        }
      }

      // Convert baselineValue and filter out infinity
      const numericBaseline = baselineValue !== null ?
        (typeof baselineValue === 'number' ? baselineValue : parseFloat(String(baselineValue)) || null) : null;

      chartData.push({
        year: yearStr,
        baseline: numericBaseline !== null && isFinite(numericBaseline) ? numericBaseline : null,
        provision: null as number | null
      });
    }

    // Build complete alternate history from all provisions for this parameter
    const paramProvisions = provisions
      .filter(p => p.parameterId === selectedParamId)
      .sort((a, b) => {
        // Sort by start date chronologically
        const dateA = a.startDate || '';
        const dateB = b.startDate || '';
        return dateA.localeCompare(dateB);
      });

    if (paramProvisions.length > 0) {
      console.log('Building alternate history from provisions:', paramProvisions);

      // Start with baseline as the default provision line
      chartData.forEach(point => {
        point.provision = point.baseline;
      });

      // Find the earliest provision to determine branch point
      let earliestStartYear = 2040;
      paramProvisions.forEach(provision => {
        if (provision.startDate) {
          const year = parseInt(provision.startDate.includes('-')
            ? provision.startDate.split('-')[0]
            : provision.startDate);
          if (year < earliestStartYear) {
            earliestStartYear = year;
          }
        }
      });

      // Apply each provision sequentially to build alternate timeline
      paramProvisions.forEach(provision => {
        if (!provision.startDate) return;

        const startYear = parseInt(provision.startDate.includes('-')
          ? provision.startDate.split('-')[0]
          : provision.startDate);

        const endYear = provision.endDate
          ? parseInt(provision.endDate.includes('-') ? provision.endDate.split('-')[0] : provision.endDate)
          : 2040;

        const provisionValue = typeof provision.value === 'number'
          ? provision.value
          : parseFloat(String(provision.value)) || 0;

        console.log('Applying provision:', {
          startYear,
          endYear,
          value: provisionValue
        });

        // Apply this provision to the timeline
        chartData.forEach(point => {
          const year = parseInt(point.year);
          if (year >= startYear && year <= endYear) {
            point.provision = provisionValue;
          }
        });
      });

      // Ensure branch point connection (year before earliest provision)
      const branchYear = earliestStartYear - 1;
      const branchPoint = chartData.find(p => parseInt(p.year) === branchYear);
      if (branchPoint && branchPoint.baseline !== null) {
        branchPoint.provision = branchPoint.baseline;
      }

      const provisionPoints = chartData.filter(d => d.provision !== null);
      console.log('Alternate history built:', provisionPoints.length, 'points');
      console.log('Sample timeline:', provisionPoints.slice(earliestStartYear - 2011, earliestStartYear - 2011 + 5));
    } else {
      console.log('No provisions found for parameter:', selectedParamId);
    }

    return chartData;
  };

  const chartData = getChartData();

  // Format values based on unit type (kept for potential future use)
  // const formatValueWithUnit = (value: number, unit?: string | null): { prefix?: string; value: string; suffix?: string } => {
  //   if (!unit) return { value: value.toString() };
  //
  //   // Handle percentage
  //   if (unit === '/1') {
  //     return { value: (value * 100).toFixed(2), suffix: '%' };
  //   }
  //
  //   // Handle currency
  //   const currencyMap: Record<string, string> = {
  //     'currency-USD': '$',
  //     'currency-GBP': '£',
  //     'currency-EUR': '€',
  //     'USD': '$',
  //     'GBP': '£',
  //     'EUR': '€',
  //   };
  //
  //   if (currencyMap[unit]) {
  //     return { prefix: currencyMap[unit], value: value.toFixed(2) };
  //   }
  //
  //   // Handle year
  //   if (unit === 'year') {
  //     return { value: value.toString() };
  //   }
  //
  //   // Default
  //   return { value: value.toString(), suffix: unit };
  // };

  // Get the unit display components
  const getUnitDisplay = (param: any) => {
    const unit = param?.unit;
    if (!unit) return { showPrefix: false, prefix: '', showSuffix: false, suffix: '' };

    if (unit === '/1') {
      return { showPrefix: false, prefix: '', showSuffix: true, suffix: '%' };
    }

    const currencyMap: Record<string, string> = {
      'currency-USD': '$',
      'currency-GBP': '£',
      'currency-EUR': '€',
      'USD': '$',
      'GBP': '£',
      'EUR': '€',
    };

    if (currencyMap[unit]) {
      return { showPrefix: true, prefix: currencyMap[unit], showSuffix: false, suffix: '' };
    }

    return { showPrefix: false, prefix: '', showSuffix: true, suffix: unit };
  };

  // Format parameter/folder names to be more readable (sentence case)
  const formatName = (name: string, isLabel: boolean = false) => {
    // If it's already a label, preserve it as-is
    if (isLabel && name) {
      return name;
    }

    // Handle bracket indices
    if (name.startsWith('[') && name.endsWith(']')) {
      const index = parseInt(name.slice(1, -1));
      const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
      if (index >= 0 && index < ordinals.length) {
        return `${ordinals[index]} bracket`;
      }
      return `Bracket ${index + 1}`;
    }

    // Replace underscores with spaces and use sentence case (only first letter capitalized)
    const formatted = name.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  };

  // Component to render tree structure
  const renderTree = (node: any, path: string = '') => {
    return Object.entries(node).map(([key, value]: [string, any]) => {
      if (key === '_isParam' || key === '_data') return null;

      const currentPath = path ? `${path}.${key}` : key;
      const isParameter = value._isParam;
      const paramData = value._data;
      const hasChildren = Object.keys(value).some(k => k !== '_isParam' && k !== '_data');

      // IMPORTANT: Check for children first - if it has children, it's always a folder
      if (hasChildren) {
        // It's a folder (regardless of whether it also has _isParam)
        const isExpanded = expandedFolders.has(currentPath);
        return (
          <div key={currentPath}>
            <Box
              onClick={() => toggleFolder(currentPath)}
              style={{
                cursor: 'pointer',
                padding: '10px 14px',
                marginBottom: '4px',
                borderRadius: '6px',
                backgroundColor: isExpanded ? 'var(--mantine-color-gray-1)' : 'transparent',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isExpanded) {
                  e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isExpanded) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                <Text size="sm" fw={400} style={{ color: 'var(--mantine-color-gray-8)' }}>
                  {formatName(key)}
                </Text>
                <IconChevronRight
                  size={14}
                  style={{
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    color: 'var(--mantine-color-gray-6)'
                  }}
                />
              </Group>
            </Box>
            {isExpanded && (
              <Box style={{ paddingLeft: '24px', marginTop: '4px' }}>
                {renderTree(value, currentPath)}
              </Box>
            )}
          </div>
        );
      }

      // It's a leaf parameter (no children)
      if (isParameter && paramData) {
        const isSelected = selectedParamId === paramData.key;
        return (
          <Box
            key={paramData.key}
            onClick={() => setSelectedParamId(paramData.key)}
            style={{
              cursor: 'pointer',
              padding: '10px 14px',
              marginBottom: '4px',
              borderRadius: '6px',
              backgroundColor: isSelected ? 'var(--mantine-color-gray-1)' : 'transparent',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {isSelected && (
              <Box
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--mantine-color-teal-6)',
                  flexShrink: 0,
                }}
              />
            )}
            <Text size="sm" fw={400} style={{ color: 'var(--mantine-color-gray-8)' }}>
              {paramData.label || formatName(key)}
            </Text>
          </Box>
        );
      }

      // Should never reach here since all nodes are either folders or parameters
      return null;
    });
  };

  const handleAddProvision = () => {
    if (selectedParamId && currentValue !== undefined) {
      const selectedParam = parameters[selectedParamId];
      const parameterName = formatName(selectedParam?.label || selectedParamId.split('.').pop() || selectedParamId, !!selectedParam?.label);
      // Try to find baseline value for the date or year
      const baselineValuesForParam = baselineValues[selectedParamId] || {};
      const baselineValue = baselineValuesForParam[startDate] ||
                           baselineValuesForParam[startDate.split('-')[0]] ||
                           0;

      // Convert year to date format if needed
      const formattedStartDate = startDate.length === 4 ? `${startDate}-01-01` : startDate;
      const formattedEndDate = endDate ? (endDate.length === 4 ? `${endDate}-12-31` : endDate) : undefined;

      // Check if provision already exists for this exact parameter and date range
      const existingIndex = provisions.findIndex(p =>
        p.parameterId === selectedParamId &&
        p.startDate === formattedStartDate &&
        p.endDate === formattedEndDate
      );

      const newProvision: Provision = {
        parameterId: selectedParamId,
        parameterName,
        value: currentValue,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        baselineValue,
      };
      console.log('Creating provision:', newProvision);

      if (existingIndex >= 0) {
        // Update existing provision for same date range
        const updatedProvisions = [...provisions];
        updatedProvisions[existingIndex] = newProvision;
        setProvisions(updatedProvisions);
      } else {
        // Add new provision (allows multiple provisions per parameter at different dates)
        setProvisions([...provisions, newProvision]);
      }

      // Reset selection but keep parameter selected for convenience
      setCurrentValue(0);
    }
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
        model_id: modelId,
      };

      // Create parameter values from provisions
      const parameterValues: Omit<ParameterValueCreate, 'policy_id'>[] = provisions.map(provision => ({
        parameter_id: provision.parameterId,
        model_id: modelId,
        value: provision.value,
        start_date: provision.startDate,
        end_date: provision.endDate,
      }));

      // Submit to API
      const createdPolicy = await policiesAPI.createWithParameters(policyData, parameterValues);

      // Create user association
      await userPoliciesAPI.create({
        user_id: MOCK_USER_ID,
        policy_id: createdPolicy.id,
        custom_name: null,
      });

      // Invalidate queries to refresh the list
      // Note: usePolicies uses ['policies', modelId] so we need to invalidate all policies queries
      queryClient.invalidateQueries({ queryKey: ['policies'] }); // This will match ['policies', modelId]
      queryClient.invalidateQueries({ queryKey: ['userPolicies'] }); // Match all userPolicies queries

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

  const handleProceedToParameters = () => {
    setCurrentStep('parameters');
  };

  const handleBackToName = () => {
    setCurrentStep('name');
    // Reset provisions when going back
    setProvisions([]);
  };

  const parameterSelectionContent = (
        <Box style={{ position: 'relative', height: '100%' }}>
          {/* Provisions badge and remove all button in top right */}
          {provisions.length > 0 && (
            <Group
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 10,
              }}
              gap="xs"
            >
              <Badge
                variant="filled"
                color="gray"
                radius="md"
                size="md"
                style={{
                  backgroundColor: 'var(--mantine-color-gray-2)',
                  color: 'var(--mantine-color-gray-8)',
                  textTransform: 'none',
                }}
              >
                {provisions.length} provision{provisions.length === 1 ? '' : 's'}
              </Badge>
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                onClick={() => setProvisions([])}
                styles={{
                  root: {
                    padding: '4px 8px',
                    height: 'auto',
                  }
                }}
              >
                Remove all
              </Button>
            </Group>
          )}
          <Flex h="100%" gap="0">
            {/* Left Sidebar */}
            <Box w={360} style={{ borderRight: '1px solid var(--mantine-color-gray-2)', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fafafa' }}>
              <Stack h="100%" style={{ padding: '24px', gap: '20px', overflow: 'hidden' }}>
                <Box>
                  <Text size="md" fw={600} mb="xs">Select parameters</Text>
                  <Text size="xs" c="dimmed">Make changes and provisions to your policy.</Text>
                </Box>

                <TextInput
                  placeholder="Search"
                  leftSection={<IconSearch size={14} />}
                  rightSection={
                    <Button
                      size="xs"
                      variant="subtle"
                      leftSection={<IconFilter size={12} />}
                      styles={{
                        root: { height: '20px', padding: '0 6px', fontSize: '11px' }
                      }}
                    >
                      Filter
                    </Button>
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  size="sm"
                  styles={{
                    input: { fontSize: '13px', height: '32px' }
                  }}
                />

                <ScrollArea style={{ flex: 1, marginRight: '-8px', paddingRight: '8px' }}>
                  <Box style={{ paddingBottom: '12px' }}>
                    {loading ? (
                      <Text size="sm" c="dimmed">Loading parameters...</Text>
                    ) : Object.keys(parameterTree).length === 0 ? (
                      <Text size="sm" c="dimmed">
                        {searchQuery ? 'No parameters found' : 'No parameters with labels'}
                      </Text>
                    ) : (
                      <Stack gap="xs">
                        {renderTree(parameterTree)}
                      </Stack>
                    )}
                  </Box>
                </ScrollArea>
              </Stack>
            </Box>

            {/* Right Content */}
            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <Box style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>

              {selectedParamId && parameters[selectedParamId] ? (
                <Stack style={{ gap: '32px', paddingBottom: '32px' }}>
                  <div>
                    <Title order={2} fw={600} mb="xl">
                      {parameters[selectedParamId]?.label ||
                       formatName(selectedParamId.split('.').pop() || 'Parameter')}
                    </Title>

                    {/* Policy Summary */}
                    {parameters[selectedParamId]?.summary && (
                      <Card withBorder radius="md" p="lg" mb="xl" style={{ borderLeft: '4px solid #319795' }}>
                        <Group gap="xs" mb="xs">
                          <IconInfoCircle size={16} color="#319795" />
                          <Text size="sm" fw={500}>Policy summary</Text>
                        </Group>
                        <Text size="sm" c="dimmed" lh={1.5}>
                          {parameters[selectedParamId].summary}
                        </Text>
                      </Card>
                    )}

                    {/* Description */}
                    {parameters[selectedParamId]?.description && (
                      <div style={{ marginTop: '24px' }}>
                        <Title order={5} mb="md">Description</Title>
                        <Text size="sm" lh={1.6}>
                          {parameters[selectedParamId].description}
                        </Text>
                      </div>
                    )}
                  </div>

                  {/* Current Value */}
                  <Box>
                    <Title order={5} style={{ marginBottom: '16px' }}>Current value</Title>
                    <Box style={{ padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                      <YearRangeSelector
                        startValue={startDate}
                        endValue={endDate}
                        onStartChange={setStartDate}
                        onEndChange={setEndDate}
                      >
                        <Group gap="xs" style={{ width: '100%' }} align="center">
                          {parameters[selectedParamId] && getUnitDisplay(parameters[selectedParamId]).showPrefix && (
                            <Text size="lg" c="dimmed" style={{ lineHeight: 1 }}>
                              {getUnitDisplay(parameters[selectedParamId]).prefix}
                            </Text>
                          )}
                          <NumberInput
                            value={parameters[selectedParamId]?.unit === '/1' ? currentValue * 100 : currentValue}
                            onChange={(val) => {
                              const numVal = val as number;
                              setCurrentValue(parameters[selectedParamId]?.unit === '/1' ? numVal / 100 : numVal);
                            }}
                            allowDecimal={parameters[selectedParamId]?.data_type !== 'int'}
                            decimalScale={parameters[selectedParamId]?.data_type === 'int' ? 0 : (parameters[selectedParamId]?.unit === '/1' ? 1 : 2)}
                            fixedDecimalScale={parameters[selectedParamId]?.data_type === 'int' ? false : true}
                            style={{ flex: 1 }}
                            placeholder={parameters[selectedParamId]?.unit === '/1' ? "50.0" : "7.25"}
                          />
                          {parameters[selectedParamId] && getUnitDisplay(parameters[selectedParamId]).showSuffix && (
                            <Text size="sm" c="dimmed" style={{ lineHeight: 1 }}>
                              {getUnitDisplay(parameters[selectedParamId]).suffix}
                            </Text>
                          )}
                          <Button
                            variant="light"
                            color="teal"
                            onClick={handleAddProvision}
                          >
                            Add
                          </Button>
                        </Group>
                      </YearRangeSelector>
                    </Box>
                  </Box>

                  {/* Historical Values */}
                  {chartData.length > 0 && (
                    <div>
                      <Title order={5} mb="md">Historical values</Title>
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart key={selectedParamId} data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#319795" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#319795" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorProvision" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#319795" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#319795" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                              dataKey="year"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#666', fontSize: 11 }}
                              domain={['2010', '2040']}
                              ticks={['2010', '2015', '2020', '2025', '2030', '2035', '2040']}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#666', fontSize: 11 }}
                              tickFormatter={(value: number) => {
                                const unit = parameters[selectedParamId]?.unit || '';
                                if (unit === 'currency-USD' || unit.includes('currency')) {
                                  return `$${value}`;
                                }
                                return value.toString();
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                              formatter={(value: number) => {
                                const unit = parameters[selectedParamId]?.unit || '';
                                if (unit === 'currency-USD' || unit.includes('currency')) {
                                  return `$${value.toFixed(2)}`;
                                }
                                return value.toFixed(2);
                              }}
                              labelFormatter={(label) => `${label}`}
                            />
                            <Area
                              type="stepAfter"
                              dataKey="baseline"
                              stroke="#319795"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#colorValue)"
                              dot={false}
                              activeDot={{ r: 4, fill: '#319795' }}
                              connectNulls={true}
                            />
                            {/* Always render provision areas if data exists */}
                            {/* Provision line (dashed, connects to baseline) */}
                            <Area
                              type="stepAfter"
                              dataKey="provision"
                              stroke="#319795"
                              strokeWidth={2}
                              strokeDasharray="8 4"
                              fillOpacity={0}
                              fill="none"
                              dot={false}
                              activeDot={{ r: 4, fill: '#319795' }}
                              connectNulls={true}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
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
            </Box>
          </Flex>
        </Box>
  );

  return (
    <>
      {/* Step 1: Name Policy Modal */}
      <BaseModal
        opened={opened && currentStep === 'name'}
        onClose={onClose}
        title="Create a reform"
        description="Reform your baseline policy to model impact."
        icon={<IconCode size={19} color="#666" />}
        size="sm"
        primaryButton={{
          label: 'Next',
          onClick: handleProceedToParameters,
          disabled: !policyName.trim(),
        }}
      >
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
      </BaseModal>

      {/* Step 2: Parameter Selection Modal */}
      <ParameterSelectionModal
        opened={opened && currentStep === 'parameters'}
        onClose={onClose}
        onCancel={handleBackToName}
        onNext={handleSubmitPolicy}
        title={`Reform policy #${Date.now().toString().slice(-4)}`}
        baseline="Baseline: Current law"
        nextDisabled={provisions.length === 0}
      >
        {parameterSelectionContent}
      </ParameterSelectionModal>
    </>
  );
}