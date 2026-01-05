/**
 * PolicyCreationModal - Standalone policy creation modal
 *
 * This modal provides:
 * - Parameter tree navigation
 * - Value setter components
 * - Policy creation with API integration
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Modal,
  Box,
  Group,
  Stack,
  Text,
  TextInput,
  Button,
  UnstyledButton,
  Divider,
  ScrollArea,
  Skeleton,
  NavLink,
  Title,
  ActionIcon,
  Autocomplete,
} from '@mantine/core';
import {
  IconScale,
  IconPencil,
  IconChevronRight,
  IconX,
  IconSearch,
} from '@tabler/icons-react';

import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { RootState } from '@/store';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { PolicyAdapter } from '@/adapters';
import { ParameterTreeNode } from '@/types/metadata';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { Policy } from '@/types/ingredients/Policy';
import { PolicyCreationPayload } from '@/types/payloads';
import { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval, ValueIntervalCollection, ValuesList } from '@/types/subIngredients/valueInterval';
import { getDateRange, selectSearchableParameters } from '@/libs/metadataUtils';
import { getHierarchicalLabels, formatLabelParts } from '@/utils/parameterLabels';
import { formatParameterValue } from '@/utils/policyTableHelpers';
import { formatPeriod } from '@/utils/dateUtils';
import { countPolicyModifications } from '@/utils/countParameterChanges';
import { capitalize } from '@/utils/stringUtils';
import { ValueSetterComponents, ValueSetterMode, ModeSelectorButton } from '@/pathways/report/components/valueSetters';
import HistoricalValues from '@/pathways/report/components/policyParameterSelector/HistoricalValues';

import { FONT_SIZES, INGREDIENT_COLORS } from '../constants';

interface PolicyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPolicyCreated: (policy: PolicyStateProps) => void;
  simulationIndex: number;
}

export function PolicyCreationModal({
  isOpen,
  onClose,
  onPolicyCreated,
  simulationIndex,
}: PolicyCreationModalProps) {
  const renderCount = useRef(0);
  renderCount.current++;
  const renderStart = performance.now();
  console.log('[PolicyCreationModal] Render #' + renderCount.current + ' START (isOpen=' + isOpen + ')');

  const countryId = useCurrentCountry() as 'us' | 'uk';

  // Get metadata from Redux state
  const { parameterTree, parameters, loading: metadataLoading } = useSelector(
    (state: RootState) => state.metadata
  );
  const { minDate, maxDate } = useSelector(getDateRange);

  // Local policy state
  const [policyLabel, setPolicyLabel] = useState<string>('New policy');
  const [policyParameters, setPolicyParameters] = useState<Parameter[]>([]);
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  // Parameter selection state
  const [selectedParam, setSelectedParam] = useState<ParameterMetadata | null>(null);
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set());

  // Value setter state
  const [valueSetterMode, setValueSetterMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);
  const [intervals, setIntervals] = useState<ValueInterval[]>([]);
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');

  // Changes panel expanded state
  const [changesExpanded, setChangesExpanded] = useState(false);

  // Parameter search state
  const [parameterSearch, setParameterSearch] = useState('');

  // API hook for creating policy
  const { createPolicy, isPending: isCreating } = useCreatePolicy(policyLabel || undefined);

  // Suppress unused variable warnings
  void countryId;
  void simulationIndex;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPolicyLabel('New policy');
      setPolicyParameters([]);
      setSelectedParam(null);
      setExpandedMenuItems(new Set());
      setIntervals([]);
      setParameterSearch('');
    }
  }, [isOpen]);

  // Create local policy state object for components
  const localPolicy: PolicyStateProps = useMemo(() => ({
    label: policyLabel,
    parameters: policyParameters,
  }), [policyLabel, policyParameters]);

  // Count modifications
  const modificationCount = countPolicyModifications(localPolicy);

  // Get modified parameter data for the Changes section - grouped by parameter with multiple changes each
  const modifiedParams = useMemo(() => {
    return policyParameters.map(p => {
      const metadata = parameters[p.name];

      // Get full hierarchical label for the parameter (no compacting) - same as report builder
      const hierarchicalLabels = getHierarchicalLabels(p.name, parameters);
      const displayLabel = hierarchicalLabels.length > 0
        ? formatLabelParts(hierarchicalLabels)
        : p.name.split('.').pop() || p.name;

      // Build changes array for this parameter
      const changes = p.values.map((interval) => ({
        period: formatPeriod(interval.startDate, interval.endDate),
        value: formatParameterValue(interval.value, metadata?.unit),
      }));

      return {
        paramName: p.name,
        label: displayLabel,
        changes,
      };
    });
  }, [policyParameters, parameters]);

  // Get searchable parameters from memoized selector (computed once when metadata loads)
  const searchableParameters = useSelector(selectSearchableParameters);

  // Handle search selection - expand tree path and select parameter
  const handleSearchSelect = useCallback((paramName: string) => {
    const param = parameters[paramName];
    if (!param || param.type !== 'parameter') return;

    // Expand all parent nodes in the tree path
    const pathParts = paramName.split('.');
    const newExpanded = new Set(expandedMenuItems);
    let currentPath = '';
    for (let i = 0; i < pathParts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}.${pathParts[i]}` : pathParts[i];
      newExpanded.add(currentPath);
    }
    setExpandedMenuItems(newExpanded);

    // Select the parameter
    setSelectedParam(param);
    setIntervals([]);
    setValueSetterMode(ValueSetterMode.DEFAULT);

    // Clear search
    setParameterSearch('');
  }, [parameters, expandedMenuItems]);

  // Handle menu item click
  const handleMenuItemClick = useCallback((paramName: string) => {
    const param = parameters[paramName];
    if (param && param.type === 'parameter') {
      setSelectedParam(param);
      // Reset value setter state when selecting new parameter
      setIntervals([]);
      setValueSetterMode(ValueSetterMode.DEFAULT);
    }
    // Toggle expansion for non-leaf nodes
    setExpandedMenuItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paramName)) {
        newSet.delete(paramName);
      } else {
        newSet.add(paramName);
      }
      return newSet;
    });
  }, [parameters]);

  // Handle value submission
  const handleValueSubmit = useCallback(() => {
    if (!selectedParam || intervals.length === 0) return;

    const updatedParameters = [...policyParameters];
    let existingParam = updatedParameters.find(p => p.name === selectedParam.parameter);

    if (!existingParam) {
      existingParam = { name: selectedParam.parameter, values: [] };
      updatedParameters.push(existingParam);
    }

    // Use ValueIntervalCollection to properly merge intervals
    const paramCollection = new ValueIntervalCollection(existingParam.values);
    intervals.forEach(interval => {
      paramCollection.addInterval(interval);
    });

    existingParam.values = paramCollection.getIntervals();
    setPolicyParameters(updatedParameters);
    setIntervals([]);
  }, [selectedParam, intervals, policyParameters]);

  // Handle policy creation
  const handleCreatePolicy = useCallback(async () => {
    if (!policyLabel.trim()) {
      return;
    }

    const policyData: Partial<Policy> = {
      parameters: policyParameters,
    };

    const payload: PolicyCreationPayload = PolicyAdapter.toCreationPayload(policyData as Policy);

    try {
      const result = await createPolicy(payload);
      const createdPolicy: PolicyStateProps = {
        id: result.result.policy_id,
        label: policyLabel,
        parameters: policyParameters,
      };
      onPolicyCreated(createdPolicy);
      onClose();
    } catch (error) {
      console.error('Failed to create policy:', error);
    }
  }, [policyLabel, policyParameters, createPolicy, onPolicyCreated, onClose]);

  // Render nested menu recursively - memoized to prevent expensive re-renders
  const renderMenuItems = useCallback((items: ParameterTreeNode[]): React.ReactNode => {
    return items
      .filter(item => !item.name.includes('pycache'))
      .map(item => (
        <NavLink
          key={item.name}
          label={item.label}
          active={selectedParam?.parameter === item.name}
          opened={expandedMenuItems.has(item.name)}
          onClick={() => handleMenuItemClick(item.name)}
          childrenOffset={16}
          style={{
            borderRadius: spacing.radius.sm,
          }}
        >
          {item.children && expandedMenuItems.has(item.name) && renderMenuItems(item.children)}
        </NavLink>
      ));
  }, [selectedParam?.parameter, expandedMenuItems, handleMenuItemClick]);

  // Memoize the rendered tree to avoid expensive re-renders on unrelated state changes
  const renderedMenuTree = useMemo(() => {
    if (metadataLoading || !parameterTree) return null;
    return renderMenuItems(parameterTree.children || []);
  }, [metadataLoading, parameterTree, renderMenuItems]);

  // Get base and reform values for chart
  const getChartValues = () => {
    if (!selectedParam) return { baseValues: null, reformValues: null };

    const baseValues = new ValueIntervalCollection(selectedParam.values as ValuesList);
    const reformValues = new ValueIntervalCollection(baseValues);

    const paramToChart = policyParameters.find(p => p.name === selectedParam.parameter);
    if (paramToChart && paramToChart.values && paramToChart.values.length > 0) {
      const userIntervals = new ValueIntervalCollection(paramToChart.values as ValuesList);
      for (const interval of userIntervals.getIntervals()) {
        reformValues.addInterval(interval);
      }
    }

    return { baseValues, reformValues };
  };

  const { baseValues, reformValues } = getChartValues();
  const colorConfig = INGREDIENT_COLORS.policy;

  const ValueSetterToRender = ValueSetterComponents[valueSetterMode];

  console.log('[PolicyCreationModal] About to return JSX, took', (performance.now() - renderStart).toFixed(2) + 'ms');

  // Dock styles matching ReportMetaPanel
  const dockStyles = {
    dock: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: spacing.radius.lg,
      border: `1px solid ${modificationCount > 0 ? colorConfig.border : colors.border.light}`,
      boxShadow: modificationCount > 0
        ? `0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px ${colorConfig.border}`
        : `0 2px 12px ${colors.shadow.light}`,
      padding: `${spacing.sm} ${spacing.lg}`,
      transition: 'all 0.3s ease',
      margin: spacing.md,
      marginBottom: 0,
    },
    divider: {
      width: '1px',
      height: '24px',
      background: colors.gray[200],
      flexShrink: 0,
    },
    changesPanel: {
      background: colors.white,
      borderRadius: spacing.radius.md,
      border: `1px solid ${colors.border.light}`,
      marginTop: spacing.sm,
      overflow: 'hidden',
    },
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      withCloseButton={false}
      size="90vw"
      radius="lg"
      styles={{
        content: {
          maxWidth: '1400px',
          height: '85vh',
          maxHeight: '800px',
          display: 'flex',
          flexDirection: 'column',
        },
        header: {
          padding: spacing.md,
          paddingLeft: spacing.xl,
          paddingRight: spacing.xl,
          borderBottom: `1px solid ${colors.border.light}`,
        },
        title: {
          flex: 1,
        },
        body: {
          padding: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
      title={
        <Box style={{ width: '100%' }}>
          <Group justify="space-between" align="center" wrap="nowrap">
            {/* Left side: Policy icon and name */}
            <Group gap={spacing.md} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
              {/* Policy icon */}
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: spacing.radius.md,
                  background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colors.white} 100%)`,
                  border: `1px solid ${colorConfig.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconScale size={18} color={colorConfig.icon} />
              </Box>

              {/* Editable policy name */}
              <Box style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                {isEditingLabel ? (
                  <TextInput
                    value={policyLabel}
                    onChange={(e) => setPolicyLabel(e.currentTarget.value)}
                    onBlur={() => setIsEditingLabel(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingLabel(false);
                      if (e.key === 'Escape') setIsEditingLabel(false);
                    }}
                    autoFocus
                    size="xs"
                    style={{ width: 250 }}
                    styles={{
                      input: {
                        fontFamily: typography.fontFamily.primary,
                        fontWeight: 600,
                        fontSize: FONT_SIZES.normal,
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                      },
                    }}
                  />
                ) : (
                  <>
                    <Text
                      fw={600}
                      style={{
                        fontFamily: typography.fontFamily.primary,
                        fontSize: FONT_SIZES.normal,
                        color: colors.gray[800],
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {policyLabel || 'New policy'}
                    </Text>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      onClick={() => setIsEditingLabel(true)}
                      style={{ flexShrink: 0 }}
                    >
                      <IconPencil size={14} />
                    </ActionIcon>
                  </>
                )}
              </Box>
            </Group>

            {/* Right side: Modification count, View changes, Close */}
            <Group gap={spacing.md} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
              {/* Modification count */}
              <Group gap={spacing.xs} style={{ flexShrink: 0 }}>
                {modificationCount > 0 ? (
                  <>
                    <Box
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: colors.primary[500],
                      }}
                    />
                    <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[600] }}>
                      {modificationCount} parameter{modificationCount !== 1 ? 's' : ''} modified
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[400] }}>
                    No changes yet
                  </Text>
                )}
              </Group>

              {/* Divider */}
              <Box style={dockStyles.divider} />

              {/* View Changes button */}
              <UnstyledButton
                onClick={() => setChangesExpanded(!changesExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: spacing.radius.md,
                  background: changesExpanded ? colorConfig.bg : 'transparent',
                  border: `1px solid ${changesExpanded ? colorConfig.border : 'transparent'}`,
                  transition: 'all 0.1s ease',
                }}
              >
                <Text
                  fw={500}
                  style={{
                    fontSize: FONT_SIZES.small,
                    color: changesExpanded ? colorConfig.icon : colors.gray[600],
                  }}
                >
                  View changes
                </Text>
                <IconChevronRight
                  size={14}
                  color={changesExpanded ? colorConfig.icon : colors.gray[400]}
                  style={{
                    transform: changesExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.1s ease',
                  }}
                />
              </UnstyledButton>

              {/* Close button */}
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={onClose}
                style={{ flexShrink: 0 }}
              >
                <IconX size={18} />
              </ActionIcon>
            </Group>
          </Group>

          {/* Expandable changes panel */}
          {changesExpanded && (
            <Box style={dockStyles.changesPanel}>
              <Box style={{ maxHeight: 250, overflow: 'auto' }}>
                {modifiedParams.length === 0 ? (
                  <Box style={{ padding: spacing.md }}>
                    <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                      No parameters have been modified yet. Select a parameter from the menu to make changes.
                    </Text>
                  </Box>
                ) : (
                  <>
                    {/* Header row */}
                    <Box
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 180px',
                        gap: spacing.md,
                        padding: `${spacing.sm} ${spacing.md}`,
                        borderBottom: `1px solid ${colors.border.light}`,
                        background: colors.gray[50],
                      }}
                    >
                      <Text fw={600} style={{ fontSize: FONT_SIZES.small, color: colors.gray[600] }}>
                        Parameter
                      </Text>
                      <Text fw={600} style={{ fontSize: FONT_SIZES.small, color: colors.gray[600], textAlign: 'right' }}>
                        Changes
                      </Text>
                    </Box>
                    {/* Data rows - one per parameter with multiple change lines */}
                    <Stack gap={0}>
                      {modifiedParams.map((param) => (
                        <UnstyledButton
                          key={param.paramName}
                          onClick={() => {
                            const metadata = parameters[param.paramName];
                            if (metadata) {
                              setSelectedParam(metadata);
                              setChangesExpanded(false);
                            }
                          }}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 180px',
                            gap: spacing.md,
                            padding: `${spacing.sm} ${spacing.md}`,
                            borderBottom: `1px solid ${colors.border.light}`,
                            background: selectedParam?.parameter === param.paramName ? colorConfig.bg : colors.white,
                            alignItems: 'start',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: FONT_SIZES.small,
                              color: colors.gray[700],
                              lineHeight: 1.5,
                            }}
                          >
                            {param.label}
                          </Text>
                          <Box style={{ textAlign: 'right' }}>
                            {param.changes.map((change, idx) => (
                              <Text
                                key={idx}
                                style={{
                                  fontSize: FONT_SIZES.small,
                                  lineHeight: 1.5,
                                }}
                              >
                                <Text component="span" style={{ color: colors.gray[500] }}>
                                  {change.period}:
                                </Text>{' '}
                                <Text component="span" fw={500} style={{ color: colors.primary[600] }}>
                                  {change.value}
                                </Text>
                              </Text>
                            ))}
                          </Box>
                        </UnstyledButton>
                      ))}
                    </Stack>
                  </>
                )}
              </Box>
            </Box>
          )}
        </Box>
      }
    >
      {/* Main content area */}
      <Group align="stretch" gap={0} style={{ flex: 1, overflow: 'hidden' }} wrap="nowrap">
        {/* Left Sidebar - Parameter Tree */}
        <Box
          style={{
            width: 280,
            borderRight: `1px solid ${colors.border.light}`,
            display: 'flex',
            flexDirection: 'column',
            background: colors.gray[50],
          }}
        >
          {/* Parameter Tree */}
          <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border.light}` }}>
              <Text fw={600} style={{ fontSize: FONT_SIZES.small, color: colors.gray[600], marginBottom: spacing.sm }}>
                PARAMETERS
              </Text>
              <Autocomplete
                placeholder="Search parameters..."
                value={parameterSearch}
                onChange={setParameterSearch}
                onOptionSubmit={handleSearchSelect}
                data={searchableParameters}
                limit={20}
                leftSection={<IconSearch size={14} color={colors.gray[400]} />}
                styles={{
                  input: {
                    fontSize: FONT_SIZES.small,
                    height: 32,
                    minHeight: 32,
                  },
                  dropdown: {
                    maxHeight: 300,
                  },
                  option: {
                    fontSize: FONT_SIZES.small,
                    padding: `${spacing.xs} ${spacing.sm}`,
                  },
                }}
                size="xs"
              />
            </Box>
            <ScrollArea style={{ flex: 1 }} offsetScrollbars>
              <Box style={{ padding: spacing.sm }}>
                {metadataLoading || !parameterTree ? (
                  <Stack gap={spacing.xs}>
                    <Skeleton height={32} />
                    <Skeleton height={32} />
                    <Skeleton height={32} />
                  </Stack>
                ) : (
                  renderedMenuTree
                )}
              </Box>
            </ScrollArea>
          </Box>
        </Box>

        {/* Main Content - Parameter Editor */}
        <Box style={{ flex: 1, overflow: 'auto', background: colors.white }}>
          {!selectedParam ? (
            <Box
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing.xl,
              }}
            >
              <Stack align="center" gap={spacing.md}>
                <Box
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: spacing.radius.lg,
                    background: colors.gray[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconScale size={32} color={colors.gray[400]} />
                </Box>
                <Text ta="center" style={{ fontSize: FONT_SIZES.normal, color: colors.gray[600], maxWidth: 400 }}>
                  Select a parameter from the menu to modify its value for your policy reform.
                </Text>
              </Stack>
            </Box>
          ) : (
            <Box style={{ padding: spacing.xl }}>
              <Stack gap={spacing.lg}>
                {/* Parameter Header */}
                <Box>
                  <Title order={3} style={{ marginBottom: spacing.sm }}>
                    {capitalize(selectedParam.label || 'Label unavailable')}
                  </Title>
                  {selectedParam.description && (
                    <Text style={{ fontSize: FONT_SIZES.normal, color: colors.gray[600] }}>
                      {selectedParam.description}
                    </Text>
                  )}
                </Box>

                {/* Value Setter */}
                <Box
                  style={{
                    background: colors.gray[50],
                    border: `1px solid ${colors.border.light}`,
                    borderRadius: spacing.radius.md,
                    padding: spacing.lg,
                  }}
                >
                  <Stack gap={spacing.md}>
                    <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>Set new value</Text>
                    <Divider />
                    <Group align="flex-end" wrap="nowrap">
                      <Box style={{ flex: 1 }}>
                        <ValueSetterToRender
                          minDate={minDate}
                          maxDate={maxDate}
                          param={selectedParam}
                          policy={localPolicy}
                          intervals={intervals}
                          setIntervals={setIntervals}
                          startDate={startDate}
                          setStartDate={setStartDate}
                          endDate={endDate}
                          setEndDate={setEndDate}
                        />
                      </Box>
                      <ModeSelectorButton setMode={(mode) => {
                        setIntervals([]);
                        setValueSetterMode(mode);
                      }} />
                      <Button
                        onClick={handleValueSubmit}
                        disabled={intervals.length === 0}
                        color="teal"
                      >
                        Add change
                      </Button>
                    </Group>
                  </Stack>
                </Box>

                {/* Historical Values Chart */}
                {baseValues && reformValues && (
                  <Box>
                    <HistoricalValues
                      param={selectedParam}
                      baseValues={baseValues}
                      reformValues={reformValues}
                      policyLabel={policyLabel}
                      policyId={null}
                    />
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </Box>
      </Group>

      {/* Footer */}
      <Box
        style={{
          borderTop: `1px solid ${colors.border.light}`,
          padding: spacing.md,
          paddingLeft: spacing.xl,
          paddingRight: spacing.xl,
          background: colors.white,
        }}
      >
        <Group justify="flex-end">
          <Group gap={spacing.sm}>
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color="teal"
              onClick={handleCreatePolicy}
              loading={isCreating}
            >
              Create policy
            </Button>
          </Group>
        </Group>
      </Box>
    </Modal>
  );
}
