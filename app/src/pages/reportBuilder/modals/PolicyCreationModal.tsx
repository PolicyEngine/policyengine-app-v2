/**
 * PolicyCreationModal - Standalone policy creation modal
 *
 * This modal provides:
 * - Parameter tree navigation
 * - Value setter components
 * - Policy creation with API integration
 */


import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Button, Group, Modal, Stack } from '@mantine/core';
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
import {
  ChangesCard,
  EmptyParameterState,
  HistoricalValuesCard,
  ModifiedParam,
  ParameterHeaderCard,
  ParameterSidebar,
  PolicyCreationHeader,
  ValueSetterCard,
} from './policyCreation';

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
  console.log(`[PolicyCreationModal] Render #${renderCount.current} START (isOpen=${isOpen})`);

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
  const [isEditingLabel, setIsEditingLabel] = useState(false);

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPolicyLabel('');
      setPolicyParameters([]);
      setSelectedParam(null);
      setExpandedMenuItems(new Set());
      setIntervals([]);
      setParameterSearch('');
    }
  }, [isOpen]);

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

  console.log(
    '[PolicyCreationModal] About to return JSX, took',
    `${(performance.now() - renderStart).toFixed(2)}ms`
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
        <PolicyCreationHeader
          policyLabel={policyLabel}
          isEditingLabel={isEditingLabel}
          modificationCount={modificationCount}
          onLabelChange={setPolicyLabel}
          onEditingChange={setIsEditingLabel}
          onClose={onClose}
        />
      }
    >
      {/* Main content area */}
      <Group align="stretch" gap={0} style={{ flex: 1, overflow: 'hidden' }} wrap="nowrap">
        {/* Left Sidebar - Parameter Tree */}
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
        />

        {/* Main Content - Parameter Editor */}
        <Box style={{ flex: 1, overflow: 'auto', background: colors.gray[50] }}>
          {!selectedParam ? (
            <EmptyParameterState />
          ) : (
            <Box style={{ padding: spacing.xl }}>
              <Stack gap={spacing.lg}>
                {/* Parameter Header Card */}
                <ParameterHeaderCard
                  label={selectedParam.label || ''}
                  description={selectedParam.description ?? undefined}
                />

                {/* 50/50 Split Content */}
                <Group gap={spacing.lg} align="flex-start" wrap="nowrap">
                  {/* Left Column: Setter + Changes */}
                  <Stack gap={spacing.lg} style={{ flex: 1, minWidth: 0 }}>
                    {/* Value Setter Card */}
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

                    {/* Changes Card */}
                    <ChangesCard
                      modifiedParams={modifiedParams}
                      modificationCount={modificationCount}
                      selectedParamName={selectedParam?.parameter}
                      onSelectParam={handleSelectParam}
                    />
                  </Stack>

                  {/* Right Column: Chart */}
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
              Create policy
            </Button>
          </Group>
        </Group>
      </Box>
    </Modal>
  );
}
