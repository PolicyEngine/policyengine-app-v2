/**
 * PolicyBrowseModal - Full-featured policy browsing and creation modal
 *
 * Uses BrowseModalTemplate for visual layout and delegates to sub-components:
 * - Browse mode: PolicyBrowseContent for main content
 * - Creation mode: PolicyCreationContent + PolicyParameterTree
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconChevronRight,
  IconFolder,
  IconPlus,
  IconScale,
  IconStar,
  IconUsers,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { Box, Button, Group, Modal, Paper, Stack, Text } from '@mantine/core';
import { PolicyAdapter } from '@/adapters';
import { createPolicy as createPolicyApi } from '@/api/policy';
import {
  EditAndSaveNewButton,
  EditAndUpdateButton,
  EditDefaultButton,
} from '@/components/common/ActionButtons';
import { MOCK_USER_ID } from '@/constants';
import { colors, spacing } from '@/designTokens';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUpdatePolicyAssociation, useUserPolicies } from '@/hooks/useUserPolicy';
import { getDateRange } from '@/libs/metadataUtils';
import { ValueSetterMode } from '@/pathways/report/components/valueSetters';
import { RootState } from '@/store';
import { Policy } from '@/types/ingredients/Policy';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { PolicyCreationPayload } from '@/types/payloads';
import { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { countPolicyModifications } from '@/utils/countParameterChanges';
import { formatPeriod } from '@/utils/dateUtils';
import {
  formatLabelParts,
  getHierarchicalLabels,
  getHierarchicalLabelsFromTree,
} from '@/utils/parameterLabels';
import { formatParameterValue } from '@/utils/policyTableHelpers';
import { FONT_SIZES, INGREDIENT_COLORS } from '../constants';
import { createCurrentLawPolicy } from '../currentLaw';
import { BrowseModalTemplate } from './BrowseModalTemplate';
import {
  PolicyBrowseContent,
  PolicyCreationContent,
  PolicyDetailsDrawer,
  PolicyParameterTree,
} from './policy';
import { PolicyOverviewContent } from './policyCreation';
import type { EditorMode, ModifiedParam, SidebarTab } from './policyCreation/types';

interface PolicyBrowseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (policy: PolicyStateProps) => void;
}

export function PolicyBrowseModal({ isOpen, onClose, onSelect }: PolicyBrowseModalProps) {
  const countryId = useCurrentCountry();
  const userId = MOCK_USER_ID.toString();
  const { data: policies, isLoading } = useUserPolicies(userId);
  const {
    parameterTree,
    parameters,
    loading: metadataLoading,
  } = useSelector((state: RootState) => state.metadata);
  const { minDate, maxDate } = useSelector(getDateRange);
  const updatePolicyAssociation = useUpdatePolicyAssociation();

  // Browse mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<
    'frequently-selected' | 'my-policies' | 'public'
  >('frequently-selected');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [drawerPolicyId, setDrawerPolicyId] = useState<string | null>(null);

  // Creation/editor mode state
  const [isCreationMode, setIsCreationMode] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [editingAssociationId, setEditingAssociationId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('overview');
  const [policyLabel, setPolicyLabel] = useState<string>('');
  const [policyParameters, setPolicyParameters] = useState<Parameter[]>([]);
  const [selectedParam, setSelectedParam] = useState<ParameterMetadata | null>(null);
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set());
  const [valueSetterMode, setValueSetterMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);
  const [intervals, setIntervals] = useState<ValueInterval[]>([]);
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');
  const [parameterSearch, setParameterSearch] = useState('');
  const [hoveredParamName, setHoveredParamName] = useState<string | null>(null);
  const [footerHovered, setFooterHovered] = useState(false);
  const [originalLabel, setOriginalLabel] = useState('');
  const [showSameNameWarning, setShowSameNameWarning] = useState(false);

  // API hook for creating policy
  const { createPolicy, isPending: isCreating } = useCreatePolicy(policyLabel || undefined);

  const isReadOnly = editorMode === 'display';

  // editingAssociationId tracks the UserPolicy association being edited
  // for "Update existing policy" functionality

  // Reset state on mount
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveSection('frequently-selected');
      setSelectedPolicyId(null);
      setDrawerPolicyId(null);
      setIsCreationMode(false);
      setEditorMode('create');

      setEditingAssociationId(null);
      setIsUpdating(false);
      setActiveTab('overview');
      setPolicyLabel('');
      setPolicyParameters([]);
      setSelectedParam(null);
      setExpandedMenuItems(new Set());
      setIntervals([]);
      setParameterSearch('');
    }
  }, [isOpen]);

  // Transform policies data, sorted by most recent
  const userPolicies = useMemo(() => {
    return (policies || [])
      .map((p) => {
        const policyId = p.association.policyId.toString();
        const label = p.association.label || `Policy #${policyId}`;
        return {
          id: policyId,
          associationId: p.association.id,
          label,
          paramCount: countPolicyModifications(p.policy),
          parameters: p.policy?.parameters || [],
          createdAt: p.association.createdAt,
          updatedAt: p.association.updatedAt,
        };
      })
      .sort((a, b) => {
        const aTime = a.updatedAt || a.createdAt || '';
        const bTime = b.updatedAt || b.createdAt || '';
        return bTime.localeCompare(aTime);
      });
  }, [policies]);

  // Filter policies based on search
  const filteredPolicies = useMemo(() => {
    let result = userPolicies;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => {
        if (p.label.toLowerCase().includes(query)) {
          return true;
        }
        const paramDisplayNames = p.parameters
          .map((param) => {
            const hierarchicalLabels = getHierarchicalLabelsFromTree(param.name, parameterTree);
            return hierarchicalLabels.length > 0
              ? formatLabelParts(hierarchicalLabels)
              : param.name.split('.').pop() || param.name;
          })
          .join(' ')
          .toLowerCase();
        if (paramDisplayNames.includes(query)) {
          return true;
        }
        return false;
      });
    }
    return result;
  }, [userPolicies, searchQuery, parameterTree]);

  // Get policies for current section
  const displayedPolicies = useMemo(() => {
    if (activeSection === 'public') {
      return [];
    }
    return filteredPolicies;
  }, [activeSection, filteredPolicies]);

  // Get section title
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'my-policies':
        return 'My policies';
      case 'public':
        return 'User-created policies';
      default:
        return 'Policies';
    }
  };

  // Handle policy selection
  const handleSelectPolicy = (policy: {
    id: string;
    label: string;
    paramCount: number;
    associationId?: string;
  }) => {
    if (policy.associationId) {
      updatePolicyAssociation.mutate({
        userPolicyId: policy.associationId,
        updates: {},
      });
    }
    onSelect({ id: policy.id, label: policy.label, parameters: Array(policy.paramCount).fill({}) });
    onClose();
  };

  // Handle current law selection
  const handleSelectCurrentLaw = () => {
    onSelect(createCurrentLawPolicy());
    onClose();
  };

  // ========== Creation Mode Logic ==========

  // Create local policy state object
  const localPolicy: PolicyStateProps = useMemo(
    () => ({
      label: policyLabel,
      parameters: policyParameters,
    }),
    [policyLabel, policyParameters]
  );

  // Count modifications
  const modificationCount = countPolicyModifications(localPolicy);

  // Get modified parameter data for the overview tab grid
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
      return { paramName: p.name, label: displayLabel, changes };
    });
  }, [policyParameters, parameters]);

  // Handle search selection
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

  // Handle entering creation mode (new policy)
  const handleEnterCreationMode = useCallback(() => {
    setPolicyLabel('');
    setPolicyParameters([]);
    setSelectedParam(null);
    setExpandedMenuItems(new Set());
    setIntervals([]);
    setParameterSearch('');
    setActiveTab('overview');
    setEditorMode('create');
    setEditingAssociationId(null);
    setIsUpdating(false);
    setIsCreationMode(true);
  }, []);

  // Handle opening an existing policy in the editor (display mode)
  const handleOpenInEditor = useCallback(
    (policy: { id: string; associationId?: string; label: string; parameters: Parameter[] }) => {
      setDrawerPolicyId(null);
      setPolicyLabel(policy.label);
      setOriginalLabel(policy.label);
      setPolicyParameters(policy.parameters);
      setSelectedParam(null);
      setExpandedMenuItems(new Set());
      setIntervals([]);
      setParameterSearch('');
      setActiveTab('overview');
      setEditorMode('display');
      setEditingAssociationId(policy.associationId || null);
      setIsCreationMode(true);
    },
    []
  );

  // Exit editor / creation mode
  const handleExitCreationMode = useCallback(() => {
    setIsCreationMode(false);
    setPolicyLabel('');
    setPolicyParameters([]);
    setSelectedParam(null);
    setExpandedMenuItems(new Set());
    setIntervals([]);
    setParameterSearch('');
    setEditorMode('create');

    setEditingAssociationId(null);
    setIsUpdating(false);
  }, []);

  // Handle policy creation
  const handleCreatePolicy = useCallback(async () => {
    if (!policyLabel.trim()) {
      return;
    }
    const policyData: Partial<Policy> = { parameters: policyParameters };
    const payload: PolicyCreationPayload = PolicyAdapter.toCreationPayload(policyData as Policy);
    try {
      const result = await createPolicy(payload);
      const createdPolicy: PolicyStateProps = {
        id: result.result.policy_id,
        label: policyLabel,
        parameters: policyParameters,
      };
      onSelect(createdPolicy);
      onClose();
    } catch (error) {
      console.error('Failed to create policy:', error);
    }
  }, [policyLabel, policyParameters, createPolicy, onSelect, onClose]);

  // Same-name guard for "Save as new policy"
  const handleSaveAsNewPolicy = useCallback(() => {
    const currentName = (policyLabel || '').trim();
    const origName = (originalLabel || '').trim();
    if (editorMode === 'edit' && currentName && currentName === origName) {
      setShowSameNameWarning(true);
    } else {
      handleCreatePolicy();
    }
  }, [policyLabel, originalLabel, editorMode, handleCreatePolicy]);

  // Handle updating an existing policy (create new base policy, update association)
  const handleUpdateExistingPolicy = useCallback(async () => {
    if (!policyLabel.trim() || !editingAssociationId) {
      return;
    }
    setIsUpdating(true);

    const policyData: Partial<Policy> = { parameters: policyParameters };
    const payload: PolicyCreationPayload = PolicyAdapter.toCreationPayload(policyData as Policy);

    try {
      const result = await createPolicyApi(countryId, payload);
      const newPolicyId = result.result.policy_id;

      await updatePolicyAssociation.mutateAsync({
        userPolicyId: editingAssociationId,
        updates: { policyId: newPolicyId, label: policyLabel },
      });

      onSelect({
        id: newPolicyId,
        label: policyLabel,
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
    editingAssociationId,
    countryId,
    updatePolicyAssociation,
    onSelect,
    onClose,
  ]);

  // Policy for drawer preview
  const drawerPolicy = useMemo(() => {
    if (!drawerPolicyId) {
      return null;
    }
    return userPolicies.find((p) => p.id === drawerPolicyId) || null;
  }, [drawerPolicyId, userPolicies]);

  const colorConfig = INGREDIENT_COLORS.policy;

  // ========== Sidebar Rendering ==========

  // Browse mode sidebar sections
  const browseSidebarSections = useMemo(
    () => [
      {
        id: 'library',
        label: 'Library',
        items: [
          {
            id: 'frequently-selected',
            label: 'Frequently selected',
            icon: <IconStar size={16} />,
            isActive: activeSection === 'frequently-selected',
            onClick: () => setActiveSection('frequently-selected'),
          },
          {
            id: 'my-policies',
            label: 'My policies',
            icon: <IconFolder size={16} />,
            badge: userPolicies.length,
            isActive: activeSection === 'my-policies',
            onClick: () => setActiveSection('my-policies'),
          },
          {
            id: 'public',
            label: 'User-created policies',
            icon: <IconUsers size={16} />,
            isActive: activeSection === 'public',
            onClick: () => setActiveSection('public'),
          },
          {
            id: 'create-new',
            label: 'Create new policy',
            icon: <IconPlus size={16} />,
            isActive: isCreationMode,
            onClick: handleEnterCreationMode,
          },
        ],
      },
    ],
    [activeSection, userPolicies.length, isCreationMode, handleEnterCreationMode]
  );

  // Creation mode custom sidebar
  const renderCreationSidebar = () => (
    <PolicyParameterTree
      parameterTree={parameterTree}
      parameters={parameters}
      metadataLoading={metadataLoading}
      selectedParam={selectedParam}
      expandedMenuItems={expandedMenuItems}
      parameterSearch={parameterSearch}
      setParameterSearch={setParameterSearch}
      onMenuItemClick={handleMenuItemClick}
      onSearchSelect={handleSearchSelect}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );

  // ========== Main Content Rendering ==========

  // Overview content for creation mode — naming, param grid, action buttons
  const renderOverviewContent = () => (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box style={{ flex: 1, overflow: 'auto', padding: spacing.lg }}>
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
      </Box>
    </Box>
  );

  const renderMainContent = () => {
    if (isCreationMode) {
      if (activeTab === 'overview') {
        return renderOverviewContent();
      }
      return (
        <PolicyCreationContent
          selectedParam={selectedParam}
          localPolicy={localPolicy}
          policyLabel={policyLabel}
          policyParameters={policyParameters}
          setPolicyParameters={setPolicyParameters}
          minDate={minDate}
          maxDate={maxDate}
          intervals={intervals}
          setIntervals={setIntervals}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          valueSetterMode={valueSetterMode}
          setValueSetterMode={setValueSetterMode}
          onValueSubmit={handleValueSubmit}
          isReadOnly={isReadOnly}
        />
      );
    }

    if (activeSection === 'frequently-selected') {
      return (
        <Stack gap={spacing.lg} style={{ height: '100%' }}>
          <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
            Frequently selected
          </Text>
          <Paper
            style={{
              background: colors.white,
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.lg,
              padding: spacing.lg,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative' as const,
              overflow: 'hidden',
              maxWidth: 340,
            }}
            onClick={handleSelectCurrentLaw}
          >
            <Box
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, ${colorConfig.accent}, ${colorConfig.icon})`,
              }}
            />
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={spacing.xs} style={{ flex: 1, minWidth: 0 }}>
                <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}>
                  Current law
                </Text>
                <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                  No parameter changes
                </Text>
              </Stack>
              <IconChevronRight size={16} color={colors.gray[400]} />
            </Group>
          </Paper>
        </Stack>
      );
    }

    return (
      <>
        <PolicyBrowseContent
          displayedPolicies={displayedPolicies}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeSection={activeSection}
          isLoading={isLoading}
          selectedPolicyId={selectedPolicyId}
          onSelectPolicy={(policy) => {
            setSelectedPolicyId(policy.id);
            handleSelectPolicy(policy);
          }}
          onPolicyInfoClick={(policyId) => setDrawerPolicyId(policyId)}
          onEnterCreationMode={handleEnterCreationMode}
          getSectionTitle={getSectionTitle}
        />
        <PolicyDetailsDrawer
          policy={drawerPolicy}
          parameters={parameters}
          parameterTree={parameterTree}
          onClose={() => setDrawerPolicyId(null)}
          onSelect={() => {
            if (drawerPolicy) {
              handleSelectPolicy(drawerPolicy);
              setDrawerPolicyId(null);
            }
          }}
          onEdit={() => {
            if (drawerPolicy) {
              handleOpenInEditor(drawerPolicy);
            }
          }}
        />
      </>
    );
  };

  // ========== Render ==========

  // Header title based on editor mode
  const getEditorHeaderTitle = () => {
    if (editorMode === 'display') {
      return 'Policy details';
    }
    if (editorMode === 'edit') {
      return 'Edit policy';
    }
    return 'Policy editor';
  };

  return (
    <>
      <BrowseModalTemplate
        isOpen={isOpen}
        onClose={onClose}
        headerIcon={<IconScale size={20} color={colorConfig.icon} />}
        headerTitle={isCreationMode ? getEditorHeaderTitle() : 'Select policy'}
        headerSubtitle={
          isCreationMode ? undefined : 'Choose an existing policy or create a new one'
        }
        colorConfig={colorConfig}
        sidebarSections={isCreationMode ? undefined : browseSidebarSections}
        renderSidebar={isCreationMode ? renderCreationSidebar : undefined}
        sidebarWidth={isCreationMode ? 280 : undefined}
        renderMainContent={renderMainContent}
        footer={
          isCreationMode ? (
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Button variant="subtle" color="gray" onClick={handleExitCreationMode}>
                Cancel
              </Button>
              <Box style={{ textAlign: 'center' }}>
                {modificationCount > 0 && (
                  <Group
                    gap={spacing.xs}
                    justify="center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveTab('overview')}
                    onMouseEnter={() => setFooterHovered(true)}
                    onMouseLeave={() => setFooterHovered(false)}
                  >
                    <Box
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
              </Box>
              <Group gap={spacing.sm} justify="flex-end">
                {editorMode === 'create' && (
                  <Button
                    color="teal"
                    onClick={handleCreatePolicy}
                    loading={isCreating}
                    disabled={!policyLabel.trim()}
                  >
                    Create policy
                  </Button>
                )}
                {editorMode === 'display' && (
                  <EditDefaultButton
                    label="Edit this policy"
                    color="teal"
                    variant="filled"
                    onClick={() => setEditorMode('edit')}
                  />
                )}
                {editorMode === 'edit' && (
                  <>
                    <EditAndUpdateButton
                      label="Update existing policy"
                      variant="light"
                      onClick={handleUpdateExistingPolicy}
                      loading={isUpdating}
                      disabled={!policyLabel.trim() || isCreating}
                    />
                    <EditAndSaveNewButton
                      label="Save as new policy"
                      color="teal"
                      variant="filled"
                      onClick={handleSaveAsNewPolicy}
                      loading={isCreating}
                      disabled={isUpdating}
                    />
                  </>
                )}
              </Group>
            </Box>
          ) : undefined
        }
        contentPadding={isCreationMode ? 0 : undefined}
      />

      <Modal
        opened={showSameNameWarning}
        onClose={() => setShowSameNameWarning(false)}
        title="Same name"
        centered
        size="sm"
      >
        <Stack gap={spacing.md}>
          <Text size="sm">
            Both the original and new policy will have the name &quot;{policyLabel.trim()}&quot;.
            Are you sure you want to save?
          </Text>
          <Group justify="flex-end" gap={spacing.sm}>
            <Button variant="subtle" color="gray" onClick={() => setShowSameNameWarning(false)}>
              Cancel
            </Button>
            <Button
              color="teal"
              onClick={() => {
                setShowSameNameWarning(false);
                handleCreatePolicy();
              }}
            >
              Save anyway
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
