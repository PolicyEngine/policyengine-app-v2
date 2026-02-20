/**
 * PolicyCreationModal - Standalone policy creation modal
 *
 * This modal provides:
 * - Parameter tree navigation (sidebar) with "Policy overview" menu item
 *   - Overview shows naming, param grid, and action buttons in main area
 *   - Selecting a parameter shows the value setter / chart editor in main area
 * - Policy creation with API integration
 */

import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { IconDeviceFloppy, IconRefresh, IconScale, IconX } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { ActionIcon, Box, Button, Group, Modal, Stack, Text, Tooltip } from '@mantine/core';
import { PolicyAdapter } from '@/adapters';
import { colors, spacing } from '@/designTokens';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getDateRange, selectSearchableParameters } from '@/libs/metadataUtils';
import { ValueSetterMode } from '@/pathways/report/components/valueSetters';
import { RootState } from '@/store';
import { Policy } from '@/types/ingredients/Policy';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { PolicyCreationPayload } from '@/types/payloads';
import { Parameter } from '@/types/subIngredients/parameter';
import {
  ValueInterval,
  ValueIntervalCollection,
  ValuesList,
} from '@/types/subIngredients/valueInterval';
import { countPolicyModifications } from '@/utils/countParameterChanges';
import { formatPeriod } from '@/utils/dateUtils';
import { formatLabelParts, getHierarchicalLabels } from '@/utils/parameterLabels';
import { formatParameterValue } from '@/utils/policyTableHelpers';
import { EditableLabel } from '../components/EditableLabel';
import { FONT_SIZES, INGREDIENT_COLORS } from '../constants';
import {
  ChangesCard,
  EmptyParameterState,
  HistoricalValuesCard,
  ModifiedParam,
  ParameterHeaderCard,
  ParameterSidebar,
  SidebarTab,
  ValueSetterCard,
} from './policyCreation';

interface PolicyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPolicyCreated: (policy: PolicyStateProps) => void;
  simulationIndex: number;
  initialPolicy?: PolicyStateProps;
}

export function PolicyCreationModal({
  isOpen,
  onClose,
  onPolicyCreated,
  simulationIndex,
  initialPolicy,
}: PolicyCreationModalProps) {
  const countryId = useCurrentCountry() as 'us' | 'uk';

  // Get metadata from Redux state
  const {
    parameterTree,
    parameters,
    loading: metadataLoading,
  } = useSelector((state: RootState) => state.metadata);
  const { minDate, maxDate } = useSelector(getDateRange);

  // Local policy state
  const [policyLabel, setPolicyLabel] = useState<string>('');
  const [policyParameters, setPolicyParameters] = useState<Parameter[]>([]);

  // Sidebar tab state — controls main content area
  const [activeTab, setActiveTab] = useState<SidebarTab>('overview');

  // Parameter selection state
  const [selectedParam, setSelectedParam] = useState<ParameterMetadata | null>(null);
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set());

  // Value setter state
  const [valueSetterMode, setValueSetterMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);
  const [intervals, setIntervals] = useState<ValueInterval[]>([]);
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');

  // Parameter search state
  const [parameterSearch, setParameterSearch] = useState('');

  // API hook for creating policy
  const { createPolicy, isPending: isCreating } = useCreatePolicy(policyLabel || undefined);

  // Suppress unused variable warnings
  void countryId;
  void simulationIndex;

  const isEditMode = !!initialPolicy;
  const colorConfig = INGREDIENT_COLORS.policy;

  // Reset state when modal opens; pre-populate from initialPolicy when editing
  useEffect(() => {
    if (isOpen) {
      setPolicyLabel(initialPolicy?.label || '');
      setPolicyParameters(initialPolicy?.parameters || []);
      setActiveTab('overview');
      setSelectedParam(null);
      setExpandedMenuItems(new Set());
      setIntervals([]);
      setParameterSearch('');
    }
  }, [isOpen]); // initialPolicy intentionally not in deps — only read on open transition

  // Create local policy state object for components
  const localPolicy: PolicyStateProps = useMemo(
    () => ({
      label: policyLabel,
      parameters: policyParameters,
    }),
    [policyLabel, policyParameters]
  );

  // Count modifications
  const modificationCount = countPolicyModifications(localPolicy);

  // Get modified parameter data for the Changes section
  const modifiedParams: ModifiedParam[] = useMemo(() => {
    return policyParameters.map((p) => {
      const metadata = parameters[p.name];
      const hierarchicalLabels = getHierarchicalLabels(p.name, parameters);
      const displayLabel =
        hierarchicalLabels.length > 0
          ? formatLabelParts(hierarchicalLabels)
          : p.name.split('.').pop() || p.name;

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

  // Get searchable parameters from memoized selector
  const searchableParameters = useSelector(selectSearchableParameters);

  // Handle search selection - expand tree path and select parameter
  const handleSearchSelect = useCallback(
    (paramName: string) => {
      const param = parameters[paramName];
      if (!param || param.type !== 'parameter') {
        return;
      }

      const pathParts = paramName.split('.');
      const newExpanded = new Set(expandedMenuItems);
      let currentPath = '';
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}.${pathParts[i]}` : pathParts[i];
        newExpanded.add(currentPath);
      }
      setExpandedMenuItems(newExpanded);
      setSelectedParam(param);
      setIntervals([]);
      setValueSetterMode(ValueSetterMode.DEFAULT);
      setParameterSearch('');
      // Auto-switch to parameters tab when selecting from search
      setActiveTab('parameters');
    },
    [parameters, expandedMenuItems]
  );

  // Handle menu item click
  const handleMenuItemClick = useCallback(
    (paramName: string) => {
      const param = parameters[paramName];
      if (param && param.type === 'parameter') {
        setSelectedParam(param);
        setIntervals([]);
        setValueSetterMode(ValueSetterMode.DEFAULT);
        // Auto-switch to parameters tab when selecting a parameter
        setActiveTab('parameters');
      }
      setExpandedMenuItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(paramName)) {
          newSet.delete(paramName);
        } else {
          newSet.add(paramName);
        }
        return newSet;
      });
    },
    [parameters]
  );

  // Handle parameter selection from changes card
  const handleSelectParam = useCallback(
    (paramName: string) => {
      const metadata = parameters[paramName];
      if (metadata) {
        setSelectedParam(metadata);
      }
    },
    [parameters]
  );

  // Handle value submission
  const handleValueSubmit = useCallback(() => {
    if (!selectedParam || intervals.length === 0) {
      return;
    }

    const updatedParameters = [...policyParameters];
    let existingParam = updatedParameters.find((p) => p.name === selectedParam.parameter);

    if (!existingParam) {
      existingParam = { name: selectedParam.parameter, values: [] };
      updatedParameters.push(existingParam);
    }

    const paramCollection = new ValueIntervalCollection(existingParam.values);
    intervals.forEach((interval) => {
      paramCollection.addInterval(interval);
    });

    existingParam.values = paramCollection.getIntervals();
    setPolicyParameters(updatedParameters);
    setIntervals([]);
  }, [selectedParam, intervals, policyParameters]);

  // Handle policy creation
  const handleCreatePolicy = useCallback(async () => {
    const policyData: Partial<Policy> = {
      parameters: policyParameters,
    };

    const payload: PolicyCreationPayload = PolicyAdapter.toCreationPayload(policyData as Policy);

    try {
      const result = await createPolicy(payload);
      const createdPolicy: PolicyStateProps = {
        id: result.result.policy_id,
        label: policyLabel || null,
        parameters: policyParameters,
      };
      onPolicyCreated(createdPolicy);
      onClose();
    } catch (error) {
      console.error('Failed to create policy:', error);
    }
  }, [policyLabel, policyParameters, createPolicy, onPolicyCreated, onClose]);

  // Get base and reform values for chart
  const getChartValues = () => {
    if (!selectedParam) {
      return { baseValues: null, reformValues: null };
    }

    const baseValues = new ValueIntervalCollection(selectedParam.values as ValuesList);
    const reformValues = new ValueIntervalCollection(baseValues);

    const paramToChart = policyParameters.find((p) => p.name === selectedParam.parameter);
    if (paramToChart && paramToChart.values && paramToChart.values.length > 0) {
      const userIntervals = new ValueIntervalCollection(paramToChart.values as ValuesList);
      for (const interval of userIntervals.getIntervals()) {
        reformValues.addInterval(interval);
      }
    }

    return { baseValues, reformValues };
  };

  const { baseValues, reformValues } = getChartValues();

  // =========================================================================
  // OVERVIEW CONTENT — shown when "Policy overview" tab is active
  // =========================================================================

  const renderOverviewContent = () => (
    <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', background: colors.gray[50] }}>
      <Box style={{ flex: 1, overflow: 'auto', padding: spacing.xl }}>
        <Stack gap={spacing.lg}>
          {/* Naming card — mirrors PopulationStatusHeader */}
          <Box
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: spacing.radius.lg,
              border: `1px solid ${modificationCount > 0 ? colorConfig.border : colors.border.light}`,
              boxShadow:
                modificationCount > 0
                  ? `0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px ${colorConfig.border}`
                  : `0 2px 12px rgba(0, 0, 0, 0.04)`,
              padding: `${spacing.sm} ${spacing.lg}`,
              transition: 'all 0.3s ease',
            }}
          >
            <Group justify="space-between" align="center" wrap="nowrap">
              <Group gap={spacing.md} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
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
                <EditableLabel
                  value={policyLabel}
                  onChange={setPolicyLabel}
                  placeholder="Enter policy name..."
                  emptyStateText="Click to name your policy..."
                />
              </Group>
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
            </Group>
          </Box>

          {/* Parameter / Period / Value grid */}
          {modifiedParams.length === 0 ? (
            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing.xl,
                gap: spacing.sm,
              }}
            >
              <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[400] }}>
                No parameter changes yet
              </Text>
              <Text
                ta="center"
                style={{ fontSize: FONT_SIZES.tiny, color: colors.gray[400], maxWidth: 280 }}
              >
                Switch to the Parameters tab to start modifying values.
              </Text>
            </Box>
          ) : (
            <Box
              style={{
                background: colors.white,
                borderRadius: spacing.radius.lg,
                border: `1px solid ${colors.border.light}`,
                overflow: 'hidden',
              }}
            >
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 0,
                }}
              >
                {/* Column headers */}
                <Text
                  fw={600}
                  style={{
                    fontSize: FONT_SIZES.tiny,
                    color: colors.gray[500],
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderBottom: `1px solid ${colors.gray[200]}`,
                    background: colors.gray[50],
                  }}
                >
                  Parameter
                </Text>
                <Text
                  fw={600}
                  style={{
                    fontSize: FONT_SIZES.tiny,
                    color: colors.gray[500],
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderBottom: `1px solid ${colors.gray[200]}`,
                    background: colors.gray[50],
                    textAlign: 'right',
                  }}
                >
                  Period
                </Text>
                <Text
                  fw={600}
                  style={{
                    fontSize: FONT_SIZES.tiny,
                    color: colors.gray[500],
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderBottom: `1px solid ${colors.gray[200]}`,
                    background: colors.gray[50],
                    textAlign: 'right',
                  }}
                >
                  Value
                </Text>

                {modifiedParams.map((param) => (
                  <Fragment key={param.paramName}>
                    <Box
                      style={{
                        padding: `${spacing.sm} ${spacing.md}`,
                        borderBottom: `1px solid ${colors.gray[100]}`,
                      }}
                    >
                      <Tooltip label={param.paramName} multiline w={300} withArrow>
                        <Text
                          style={{
                            fontSize: FONT_SIZES.small,
                            color: colors.gray[700],
                            lineHeight: 1.4,
                          }}
                        >
                          {param.label}
                        </Text>
                      </Tooltip>
                    </Box>
                    <Box
                      style={{
                        padding: `${spacing.sm} ${spacing.md}`,
                        borderBottom: `1px solid ${colors.gray[100]}`,
                        textAlign: 'right',
                      }}
                    >
                      {param.changes.map((c, i) => (
                        <Text
                          key={i}
                          style={{
                            fontSize: FONT_SIZES.small,
                            color: colors.gray[500],
                            lineHeight: 1.4,
                          }}
                        >
                          {c.period}
                        </Text>
                      ))}
                    </Box>
                    <Box
                      style={{
                        padding: `${spacing.sm} ${spacing.md}`,
                        borderBottom: `1px solid ${colors.gray[100]}`,
                        textAlign: 'right',
                      }}
                    >
                      {param.changes.map((c, i) => (
                        <Text
                          key={i}
                          fw={500}
                          style={{
                            fontSize: FONT_SIZES.small,
                            color: colorConfig.icon,
                            lineHeight: 1.4,
                          }}
                        >
                          {c.value}
                        </Text>
                      ))}
                    </Box>
                  </Fragment>
                ))}
              </Box>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Action buttons — pinned to bottom */}
      <Box
        style={{
          padding: `${spacing.md} ${spacing.xl}`,
          borderTop: `1px solid ${colors.border.light}`,
          background: colors.white,
          flexShrink: 0,
        }}
      >
        <Group gap={spacing.sm}>
          <Button
            variant="filled"
            color="teal"
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleCreatePolicy}
            loading={isCreating}
          >
            Save as new policy
          </Button>
          <Button
            variant="default"
            leftSection={<IconRefresh size={16} />}
            onClick={() => console.info('[PolicyCreationModal] Replace existing policy')}
          >
            Replace existing policy
          </Button>
        </Group>
      </Box>
    </Box>
  );

  // =========================================================================
  // PARAMETERS CONTENT — shown when "Parameters" tab is active
  // =========================================================================

  const renderParametersContent = () => (
    <Box style={{ flex: 1, overflow: 'auto', background: colors.gray[50] }}>
      {!selectedParam ? (
        <EmptyParameterState />
      ) : (
        <Box style={{ padding: spacing.xl }}>
          <Stack gap={spacing.lg}>
            <ParameterHeaderCard
              label={selectedParam.label || ''}
              description={selectedParam.description ?? undefined}
            />
            <Group gap={spacing.lg} align="flex-start" wrap="nowrap">
              <Stack gap={spacing.lg} style={{ flex: 1, minWidth: 0 }}>
                <ValueSetterCard
                  selectedParam={selectedParam}
                  localPolicy={localPolicy}
                  minDate={minDate}
                  maxDate={maxDate}
                  valueSetterMode={valueSetterMode}
                  intervals={intervals}
                  startDate={startDate}
                  endDate={endDate}
                  onModeChange={setValueSetterMode}
                  onIntervalsChange={setIntervals}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onSubmit={handleValueSubmit}
                />
                <ChangesCard
                  modifiedParams={modifiedParams.filter(
                    (p) => p.paramName === selectedParam?.parameter
                  )}
                  modificationCount={modificationCount}
                  selectedParamName={selectedParam?.parameter}
                  onSelectParam={handleSelectParam}
                />
              </Stack>
              <HistoricalValuesCard
                selectedParam={selectedParam}
                baseValues={baseValues}
                reformValues={reformValues}
                policyLabel={policyLabel}
              />
            </Group>
          </Stack>
        </Box>
      )}
    </Box>
  );

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
        <Group justify="space-between" align="center" wrap="nowrap" style={{ width: '100%' }}>
          <Group gap={spacing.md} align="center" wrap="nowrap">
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
            <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
              {isEditMode ? 'Edit policy' : 'Policy editor'}
            </Text>
          </Group>
          <ActionIcon variant="subtle" color="gray" onClick={onClose} style={{ flexShrink: 0 }}>
            <IconX size={18} />
          </ActionIcon>
        </Group>
      }
    >
      {/* Main content area */}
      <Group align="stretch" gap={0} style={{ flex: 1, overflow: 'hidden' }} wrap="nowrap">
        {/* Left Sidebar - Parameter Tree with tabs */}
        <ParameterSidebar
          parameterTree={parameterTree}
          metadataLoading={metadataLoading}
          selectedParam={selectedParam}
          expandedMenuItems={expandedMenuItems}
          parameterSearch={parameterSearch}
          searchableParameters={searchableParameters}
          onSearchChange={setParameterSearch}
          onSearchSelect={handleSearchSelect}
          onMenuItemClick={handleMenuItemClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content — switches based on active tab */}
        {activeTab === 'overview' ? renderOverviewContent() : renderParametersContent()}
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
            <Button color="teal" onClick={handleCreatePolicy} loading={isCreating}>
              {isEditMode ? 'Save as new policy' : 'Create policy'}
            </Button>
          </Group>
        </Group>
      </Box>
    </Modal>
  );
}
