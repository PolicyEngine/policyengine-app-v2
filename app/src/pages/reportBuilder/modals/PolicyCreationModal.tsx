/**
 * PolicyCreationModal - Standalone policy creation modal
 *
 * This modal provides:
 * - Parameter tree navigation (sidebar) with "Policy overview" menu item
 *   - Overview shows naming, param grid, and action buttons in main area
 *   - Selecting a parameter shows the value setter / chart editor in main area
 * - Policy creation with API integration
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IconScale, IconX } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { PolicyAdapter } from '@/adapters';
import { createPolicy as createPolicyApi } from '@/api/policy';
import {
  EditAndSaveNewButton,
  EditAndUpdateButton,
  EditDefaultButton,
} from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Group } from '@/components/ui/Group';
import { Spinner } from '@/components/ui/Spinner';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/designTokens';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUpdatePolicyAssociation } from '@/hooks/useUserPolicy';
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
import { FONT_SIZES, INGREDIENT_COLORS } from '../constants';
import { getReportYearDateBounds } from '../utils/reportYearDates';
import {
  ChangesCard,
  EditorMode,
  EmptyParameterState,
  HistoricalValuesCard,
  ModifiedParam,
  ParameterHeaderCard,
  ParameterSidebar,
  PolicyOverviewContent,
  SidebarTab,
  ValueSetterCard,
} from './policyCreation';

interface PolicyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPolicyCreated: (policy: PolicyStateProps) => void;
  reportYear: string;
  simulationIndex: number;
  initialPolicy?: PolicyStateProps;
  initialEditorMode?: EditorMode;
  initialAssociationId?: string;
  forceReadOnly?: boolean;
}

export function PolicyCreationModal({
  isOpen,
  onClose,
  onPolicyCreated,
  reportYear,
  simulationIndex,
  initialPolicy,
  initialEditorMode,
  initialAssociationId,
  forceReadOnly = false,
}: PolicyCreationModalProps) {
  const countryId = useCurrentCountry();

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

  // Sidebar tab state -- controls main content area
  const [activeTab, setActiveTab] = useState<SidebarTab>('overview');

  // Parameter selection state
  const [selectedParam, setSelectedParam] = useState<ParameterMetadata | null>(null);
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set());

  // Value setter state
  const [valueSetterMode, setValueSetterMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);
  const [intervals, setIntervals] = useState<ValueInterval[]>([]);
  const {
    reportYear: resolvedReportYear,
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  } = getReportYearDateBounds(reportYear);
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);

  // Parameter search state
  const [parameterSearch, setParameterSearch] = useState('');
  const [hoveredParamName, setHoveredParamName] = useState<string | null>(null);
  const [footerHovered, setFooterHovered] = useState(false);

  // API hooks
  const { createPolicy, isPending: isCreating } = useCreatePolicy(policyLabel || undefined);
  const updatePolicyAssociation = useUpdatePolicyAssociation();
  const [isUpdating, setIsUpdating] = useState(false);

  // Suppress unused variable warning
  void simulationIndex;

  // Editor mode: create (new policy), display (read-only existing), edit (modifying existing)
  const resolvedInitialEditorMode: EditorMode = forceReadOnly
    ? 'display'
    : initialEditorMode || (initialPolicy ? 'edit' : 'create');
  const [editorMode, setEditorMode] = useState<EditorMode>(resolvedInitialEditorMode);
  const effectiveEditorMode: EditorMode = forceReadOnly ? 'display' : editorMode;
  const isReadOnly = effectiveEditorMode === 'display';
  const colorConfig = INGREDIENT_COLORS.policy;

  // Reset state when modal opens; pre-populate from initialPolicy when editing
  useEffect(() => {
    if (isOpen) {
      setPolicyLabel(initialPolicy?.label || '');
      setPolicyParameters(initialPolicy?.parameters || []);
      setEditorMode(resolvedInitialEditorMode);
      setActiveTab('overview');
      setSelectedParam(null);
      setExpandedMenuItems(new Set());
      setIntervals([]);
      setStartDate(defaultStartDate);
      setEndDate(defaultEndDate);
      setParameterSearch('');
    }
  }, [isOpen, initialPolicy, resolvedInitialEditorMode, defaultStartDate, defaultEndDate]);

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

  // Same-name warning for "Save as new" when name matches original
  const [showSameNameWarning, setShowSameNameWarning] = useState(false);

  // Unnamed-policy warning for creating/saving without a name
  const [showUnnamedWarning, setShowUnnamedWarning] = useState(false);

  const handleSaveAsNewPolicy = useCallback(() => {
    const currentName = (policyLabel || '').trim();
    const originalName = (initialPolicy?.label || '').trim();
    if (effectiveEditorMode === 'edit' && currentName && currentName === originalName) {
      setShowSameNameWarning(true);
    } else {
      handleCreatePolicy();
    }
  }, [policyLabel, initialPolicy?.label, effectiveEditorMode, handleCreatePolicy]);

  // Handle updating an existing policy (create new base policy, update association)
  const handleUpdateExistingPolicy = useCallback(async () => {
    if (!policyLabel.trim() || !initialAssociationId) {
      return;
    }
    setIsUpdating(true);

    const policyData: Partial<Policy> = { parameters: policyParameters };
    const payload: PolicyCreationPayload = PolicyAdapter.toCreationPayload(policyData as Policy);

    try {
      const result = await createPolicyApi(countryId, payload);
      const newPolicyId = result.result.policy_id;

      await updatePolicyAssociation.mutateAsync({
        userPolicyId: initialAssociationId,
        updates: { policyId: newPolicyId, label: policyLabel },
      });

      onPolicyCreated({
        id: newPolicyId,
        label: policyLabel || null,
        parameters: policyParameters,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update policy:', error);
      setIsUpdating(false);
    }
  }, [
    policyLabel,
    policyParameters,
    initialAssociationId,
    countryId,
    updatePolicyAssociation,
    onPolicyCreated,
    onClose,
  ]);

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
  // OVERVIEW CONTENT -- shown when "Policy overview" tab is active
  // =========================================================================

  const renderOverviewContent = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: colors.gray[50] }}>
      <div style={{ flex: 1, overflow: 'auto', padding: spacing.xl }}>
        <PolicyOverviewContent
          policyLabel={policyLabel}
          onLabelChange={setPolicyLabel}
          isReadOnly={isReadOnly}
          modificationCount={modificationCount}
          modifiedParams={modifiedParams}
          hoveredParamName={hoveredParamName}
          onHoverParam={setHoveredParamName}
          onClickParam={handleSearchSelect}
        />
      </div>
    </div>
  );

  // =========================================================================
  // PARAMETERS CONTENT -- shown when "Parameters" tab is active
  // =========================================================================

  const renderParametersContent = () => (
    <div style={{ flex: 1, overflow: 'auto', background: colors.gray[50] }}>
      {!selectedParam ? (
        <EmptyParameterState
          message={isReadOnly ? 'Select a parameter from the menu to view its details.' : undefined}
        />
      ) : (
        <div style={{ padding: spacing.xl }}>
          <Stack gap="lg">
            <ParameterHeaderCard
              label={selectedParam.label || ''}
              description={selectedParam.description ?? undefined}
            />
            <Group gap="lg" align="start" wrap="nowrap">
              <Stack gap="lg" style={{ flex: 1, minWidth: 0 }}>
                {!isReadOnly && (
                  <ValueSetterCard
                    selectedParam={selectedParam}
                    localPolicy={localPolicy}
                    reportYear={resolvedReportYear}
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
                )}
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
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="tw:sm:max-w-[90vw] tw:p-0"
        style={{
          maxWidth: '1400px',
          height: '85vh',
          maxHeight: '800px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DialogTitle className="tw:sr-only">
          {effectiveEditorMode === 'display'
            ? 'Policy details'
            : effectiveEditorMode === 'edit'
              ? 'Edit policy'
              : 'Policy editor'}
        </DialogTitle>
        <DialogDescription className="tw:sr-only">
          Create or edit a policy reform by modifying parameter values.
        </DialogDescription>
        {/* Header */}
        <div
          style={{
            padding: spacing.md,
            paddingLeft: spacing.xl,
            paddingRight: spacing.xl,
            borderBottom: `1px solid ${colors.border.light}`,
          }}
        >
          <Group justify="space-between" align="center" wrap="nowrap" style={{ width: '100%' }}>
            <Group gap="md" align="center" wrap="nowrap">
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: spacing.radius.container,
                  background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colors.white} 100%)`,
                  border: `1px solid ${colorConfig.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconScale size={18} color={colorConfig.icon} />
              </div>
              <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
                {effectiveEditorMode === 'display'
                  ? 'Policy details'
                  : effectiveEditorMode === 'edit'
                    ? 'Edit policy'
                    : 'Policy editor'}
              </Text>
            </Group>
            <Button variant="ghost" size="icon-sm" onClick={onClose} style={{ flexShrink: 0 }}>
              <IconX size={18} />
            </Button>
          </Group>
        </div>

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
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

          {/* Main Content -- switches based on active tab */}
          {activeTab === 'overview' ? renderOverviewContent() : renderParametersContent()}
        </div>

        {/* Footer -- unified mode bar */}
        <div
          style={{
            borderTop: `1px solid ${colors.border.light}`,
            padding: spacing.md,
            paddingLeft: spacing.xl,
            paddingRight: spacing.xl,
            background: colors.white,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <div style={{ textAlign: 'center' }}>
              {modificationCount > 0 && (
                <Group
                  gap="xs"
                  justify="center"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTab('overview')}
                  onMouseEnter={() => setFooterHovered(true)}
                  onMouseLeave={() => setFooterHovered(false)}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: colors.primary[500],
                    }}
                  />
                  <Text
                    style={{
                      fontSize: FONT_SIZES.small,
                      color: footerHovered ? colors.primary[600] : colors.gray[600],
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {modificationCount} parameter{modificationCount !== 1 ? 's' : ''} modified
                  </Text>
                </Group>
              )}
            </div>
            <Group gap="sm" justify="end">
              {!forceReadOnly && effectiveEditorMode === 'create' && (
                <Button
                  onClick={() => {
                    if (!policyLabel.trim()) {
                      setShowUnnamedWarning(true);
                    } else {
                      handleCreatePolicy();
                    }
                  }}
                  disabled={isCreating || modificationCount === 0}
                >
                  {isCreating && <Spinner size="sm" />}
                  Create policy
                </Button>
              )}
              {!forceReadOnly && effectiveEditorMode === 'display' && (
                <EditDefaultButton
                  label="Edit this policy"
                  onClick={() => {
                    if (!forceReadOnly) {
                      setEditorMode('edit');
                    }
                  }}
                />
              )}
              {!forceReadOnly && effectiveEditorMode === 'edit' && (
                <>
                  <EditAndUpdateButton
                    label="Update existing policy"
                    onClick={handleUpdateExistingPolicy}
                    loading={isUpdating}
                    disabled={!policyLabel.trim() || isCreating || modificationCount === 0}
                  />
                  <EditAndSaveNewButton
                    label="Save as new policy"
                    onClick={() => {
                      if (!policyLabel.trim()) {
                        setShowUnnamedWarning(true);
                      } else {
                        handleSaveAsNewPolicy();
                      }
                    }}
                    loading={isCreating}
                    disabled={isUpdating || modificationCount === 0}
                  />
                </>
              )}
            </Group>
          </div>
        </div>

        {/* Same-name warning modal */}
        <Dialog
          open={showSameNameWarning}
          onOpenChange={(open) => {
            if (!open) {
              setShowSameNameWarning(false);
            }
          }}
        >
          <DialogContent>
            <DialogTitle>
              <strong>Same name</strong>
            </DialogTitle>
            <DialogDescription className="tw:sr-only">
              Confirm saving a policy with the same name
            </DialogDescription>
            <Stack gap="md">
              <Text size="sm">
                Both the original and new policy will have the name &ldquo;
                {policyLabel}&rdquo;. Are you sure you want to save?
              </Text>
              <Group justify="end" gap="sm">
                <Button variant="outline" onClick={() => setShowSameNameWarning(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowSameNameWarning(false);
                    handleCreatePolicy();
                  }}
                >
                  Save anyway
                </Button>
              </Group>
            </Stack>
          </DialogContent>
        </Dialog>

        {/* Unnamed policy warning modal */}
        <Dialog
          open={showUnnamedWarning}
          onOpenChange={(open) => {
            if (!open) {
              setShowUnnamedWarning(false);
            }
          }}
        >
          <DialogContent>
            <DialogTitle>
              <strong>Unnamed policy</strong>
            </DialogTitle>
            <DialogDescription className="tw:sr-only">
              Confirm saving an unnamed policy
            </DialogDescription>
            <Stack gap="md">
              <Text size="sm">
                This policy has no name. Are you sure you want to save it without a name?
              </Text>
              <Group justify="end" gap="sm">
                <Button variant="outline" onClick={() => setShowUnnamedWarning(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowUnnamedWarning(false);
                    handleCreatePolicy();
                  }}
                >
                  Save anyway
                </Button>
              </Group>
            </Stack>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
