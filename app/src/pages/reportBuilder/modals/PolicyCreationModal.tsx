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
import { IconChevronLeft, IconScale, IconX } from '@tabler/icons-react';
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
import { EditableLabel } from '@/pages/reportBuilder/components/EditableLabel';
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
import { BROWSE_MODAL_CONFIG, FONT_SIZES, INGREDIENT_COLORS } from '../constants';
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
import { SaveAsNewNameDialog } from './SaveAsNewNameDialog';

interface PolicyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onPolicyCreated: (policy: PolicyStateProps) => void;
  reportYear: string;
  simulationIndex: number;
  initialPolicy?: PolicyStateProps;
  initialEditorMode?: EditorMode;
  initialAssociationId?: string;
  forceReadOnly?: boolean;
}

type PendingUnnamedAction = 'create' | 'save-as-new' | 'update-existing' | null;

export function PolicyCreationModal({
  isOpen,
  onClose,
  onBack = onClose,
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
  // API hooks
  const normalizedPolicyLabel = policyLabel.trim();
  const { createPolicyWithLabel, isPending: isCreating } = useCreatePolicy(
    normalizedPolicyLabel || undefined
  );
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
  const modalTitle =
    effectiveEditorMode === 'display'
      ? 'Policy details'
      : effectiveEditorMode === 'edit'
        ? 'Edit policy'
        : 'Create new policy';

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

      const changes = p.values.map((interval, index) => ({
        index,
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

  const handleRemoveParamChange = useCallback(
    (paramName: string, indexToRemove: number) => {
      if (isReadOnly) {
        return;
      }

      setPolicyParameters((currentParameters) =>
        currentParameters
          .map((param) => {
            if (param.name !== paramName) {
              return param;
            }

            return {
              ...param,
              values: param.values.filter((_, index) => index !== indexToRemove),
            };
          })
          .filter((param) => param.values.length > 0)
      );
    },
    [isReadOnly]
  );

  // Handle policy creation
  const handleCreatePolicy = useCallback(
    async (labelOverride?: string | null) => {
      const resolvedLabel =
        labelOverride === undefined ? normalizedPolicyLabel : (labelOverride?.trim() ?? '');
      const policyData: Partial<Policy> = {
        parameters: policyParameters,
      };

      const payload: PolicyCreationPayload = PolicyAdapter.toCreationPayload(policyData as Policy);

      try {
        const result = await createPolicyWithLabel(payload, resolvedLabel || undefined);
        const createdPolicy: PolicyStateProps = {
          id: result.result.policy_id,
          label: resolvedLabel || null,
          parameters: policyParameters,
        };
        onPolicyCreated(createdPolicy);
        onClose();
      } catch (error) {
        console.error('Failed to create policy:', error);
      }
    },
    [normalizedPolicyLabel, policyParameters, createPolicyWithLabel, onPolicyCreated, onClose]
  );

  // Unnamed-policy warning for creating/saving without a name
  const [pendingUnnamedAction, setPendingUnnamedAction] = useState<PendingUnnamedAction>(null);
  const [saveAsNewNamePromptOpen, setSaveAsNewNamePromptOpen] = useState(false);

  const handleSaveAsNewPolicy = useCallback(() => {
    setSaveAsNewNamePromptOpen(true);
  }, []);

  // Handle updating an existing policy (create new base policy, update association)
  const handleUpdateExistingPolicy = useCallback(async () => {
    if (!initialAssociationId) {
      return;
    }
    setIsUpdating(true);

    const policyData: Partial<Policy> = { parameters: policyParameters };
    const payload: PolicyCreationPayload = PolicyAdapter.toCreationPayload(policyData as Policy);

    try {
      const result = await createPolicyApi(countryId, payload);
      const newPolicyId = result.result.policy_id;
      const desiredLabel = normalizedPolicyLabel || undefined;

      await updatePolicyAssociation.mutateAsync({
        userPolicyId: initialAssociationId,
        updates: { policyId: newPolicyId, label: desiredLabel },
        replacementPolicyCountryId: countryId,
        replacementPolicyPayload: payload,
      });

      onPolicyCreated({
        id: newPolicyId,
        associationId: initialAssociationId,
        label: desiredLabel ?? null,
        parameters: policyParameters,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update policy:', error);
      setIsUpdating(false);
    }
  }, [
    normalizedPolicyLabel,
    policyParameters,
    initialAssociationId,
    countryId,
    updatePolicyAssociation,
    onPolicyCreated,
    onClose,
  ]);

  const runPendingUnnamedAction = useCallback(() => {
    const action = pendingUnnamedAction;
    setPendingUnnamedAction(null);

    if (action === 'create') {
      void handleCreatePolicy();
    } else if (action === 'save-as-new') {
      void handleSaveAsNewPolicy();
    } else if (action === 'update-existing') {
      void handleUpdateExistingPolicy();
    }
  }, [handleCreatePolicy, handleSaveAsNewPolicy, handleUpdateExistingPolicy, pendingUnnamedAction]);

  const requestSaveAction = useCallback(
    (action: Exclude<PendingUnnamedAction, null>) => {
      const currentName = normalizedPolicyLabel;

      if (action === 'save-as-new') {
        handleSaveAsNewPolicy();
        return;
      }

      if (!currentName) {
        setPendingUnnamedAction(action);
        return;
      }

      if (action === 'create') {
        void handleCreatePolicy();
      } else {
        void handleUpdateExistingPolicy();
      }
    },
    [normalizedPolicyLabel, handleCreatePolicy, handleSaveAsNewPolicy, handleUpdateExistingPolicy]
  );

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
          showNamingCard={false}
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
                  isReadOnly={isReadOnly}
                  onRemoveChange={handleRemoveParamChange}
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
        className="tw:sm:max-w-none tw:p-0 tw:gap-0"
        style={{
          width: BROWSE_MODAL_CONFIG.width,
          maxWidth: BROWSE_MODAL_CONFIG.maxWidth,
          height: BROWSE_MODAL_CONFIG.height,
          maxHeight: BROWSE_MODAL_CONFIG.maxHeight,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DialogTitle className="tw:sr-only">{modalTitle}</DialogTitle>
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
            <Group gap="md" align="center" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
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
              <EditableLabel
                value={policyLabel}
                onChange={setPolicyLabel}
                placeholder="Enter policy name..."
                emptyStateText="Click to name your policy..."
                readOnly={isReadOnly}
                fitContentWhileEditing
                controlOutsideField
                showFieldWhenEmptyOrEditing
                fieldStyle={{
                  background: colors.gray[100],
                  borderBottom: `1px solid ${colors.border.light}`,
                  padding: `${spacing.xs} ${spacing.sm}`,
                }}
              />
            </Group>
            <Group gap="md" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
              <Group
                gap="xs"
                justify="center"
                align="center"
                wrap="nowrap"
                style={{ cursor: modificationCount > 0 ? 'pointer' : 'default' }}
                onClick={modificationCount > 0 ? () => setActiveTab('overview') : undefined}
              >
                {modificationCount > 0 && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: colors.primary[500],
                    }}
                  />
                )}
                <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[600] }}>
                  {modificationCount > 0
                    ? `${modificationCount} provision${modificationCount !== 1 ? 's' : ''}`
                    : 'No provisions yet'}
                </Text>
              </Group>
              <Button variant="ghost" size="icon-sm" onClick={onClose} style={{ flexShrink: 0 }}>
                <IconX size={18} />
              </Button>
            </Group>
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
            <Group gap="sm">
              <Button variant="ghost" onClick={onBack}>
                <IconChevronLeft size={16} />
                Back
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </Group>
            <div />
            <Group gap="sm" justify="end">
              {!forceReadOnly && effectiveEditorMode === 'create' && (
                <Button
                  onClick={() => requestSaveAction('create')}
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
                    onClick={() => requestSaveAction('update-existing')}
                    loading={isUpdating}
                    disabled={isCreating || modificationCount === 0}
                  />
                  <EditAndSaveNewButton
                    label="Save as new policy"
                    onClick={() => requestSaveAction('save-as-new')}
                    loading={isCreating}
                    disabled={isUpdating || modificationCount === 0}
                  />
                </>
              )}
            </Group>
          </div>
        </div>

        <SaveAsNewNameDialog
          open={saveAsNewNamePromptOpen}
          ingredientType="policy"
          currentName={policyLabel}
          isSaving={isCreating}
          onCancel={() => setSaveAsNewNamePromptOpen(false)}
          onKeepSameName={() => {
            setSaveAsNewNamePromptOpen(false);
            void handleCreatePolicy(policyLabel);
          }}
          onSaveWithName={(name) => {
            setSaveAsNewNamePromptOpen(false);
            void handleCreatePolicy(name);
          }}
        />

        {/* Unnamed policy warning modal */}
        <Dialog
          open={pendingUnnamedAction !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPendingUnnamedAction(null);
            }
          }}
        >
          <DialogContent>
            <DialogTitle>Unnamed policy</DialogTitle>
            <DialogDescription className="tw:sr-only">
              Confirm saving an unnamed policy
            </DialogDescription>
            <Stack gap="md">
              <Text size="sm">
                This policy has no name. Are you sure you want to save it without a name?
              </Text>
              <Group justify="end" gap="sm">
                <Button variant="outline" onClick={() => setPendingUnnamedAction(null)}>
                  Cancel
                </Button>
                <Button onClick={runPendingUnnamedAction}>Save anyway</Button>
              </Group>
            </Stack>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
