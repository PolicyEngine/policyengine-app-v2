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
import { Box, Group, Paper, Stack, Text } from '@mantine/core';
import { PolicyAdapter } from '@/adapters';
import { MOCK_USER_ID } from '@/constants';
import { colors, spacing } from '@/designTokens';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
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
import { formatLabelParts, getHierarchicalLabelsFromTree } from '@/utils/parameterLabels';
import { EditableLabel } from '../components/EditableLabel';
import { FONT_SIZES, INGREDIENT_COLORS } from '../constants';
import { createCurrentLawPolicy } from '../currentLaw';
import { BrowseModalTemplate, CreationModeFooter } from './BrowseModalTemplate';
import {
  PolicyBrowseContent,
  PolicyCreationContent,
  PolicyDetailsDrawer,
  PolicyParameterTree,
} from './policy';

interface PolicyBrowseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (policy: PolicyStateProps) => void;
}

export function PolicyBrowseModal({ isOpen, onClose, onSelect }: PolicyBrowseModalProps) {
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

  // Creation mode state
  const [isCreationMode, setIsCreationMode] = useState(false);
  const [policyLabel, setPolicyLabel] = useState<string>('');
  const [policyParameters, setPolicyParameters] = useState<Parameter[]>([]);
  const [selectedParam, setSelectedParam] = useState<ParameterMetadata | null>(null);
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set());
  const [valueSetterMode, setValueSetterMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);
  const [intervals, setIntervals] = useState<ValueInterval[]>([]);
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');
  const [parameterSearch, setParameterSearch] = useState('');

  // API hook for creating policy
  const { createPolicy, isPending: isCreating } = useCreatePolicy(policyLabel || undefined);

  // Reset state on mount
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveSection('frequently-selected');
      setSelectedPolicyId(null);
      setDrawerPolicyId(null);
      setIsCreationMode(false);
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

  // Handle entering creation mode
  const handleEnterCreationMode = useCallback(() => {
    setPolicyLabel('');
    setPolicyParameters([]);
    setSelectedParam(null);
    setExpandedMenuItems(new Set());
    setIntervals([]);
    setParameterSearch('');
    setIsCreationMode(true);
  }, []);

  // Exit creation mode
  const handleExitCreationMode = useCallback(() => {
    setIsCreationMode(false);
    setPolicyLabel('');
    setPolicyParameters([]);
    setSelectedParam(null);
    setExpandedMenuItems(new Set());
    setIntervals([]);
    setParameterSearch('');
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
    />
  );

  // ========== Main Content Rendering ==========

  const renderMainContent = () => {
    if (isCreationMode) {
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
        />
      </>
    );
  };

  // ========== Render ==========

  // Custom header title for creation mode - just the editable label
  const creationModeHeaderTitle = (
    <EditableLabel
      value={policyLabel}
      onChange={setPolicyLabel}
      placeholder="Enter policy name..."
      emptyStateText="Click to name your policy..."
    />
  );

  // Modification count for right side of header
  const creationModeHeaderRight = (
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
        <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[400] }}>No changes yet</Text>
      )}
    </Group>
  );

  return (
    <BrowseModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      headerIcon={<IconScale size={20} color={colorConfig.icon} />}
      headerTitle={isCreationMode ? creationModeHeaderTitle : 'Select policy'}
      headerSubtitle={isCreationMode ? undefined : 'Choose an existing policy or create a new one'}
      headerRightContent={isCreationMode ? creationModeHeaderRight : undefined}
      colorConfig={colorConfig}
      sidebarSections={isCreationMode ? undefined : browseSidebarSections}
      renderSidebar={isCreationMode ? renderCreationSidebar : undefined}
      sidebarWidth={isCreationMode ? 280 : undefined}
      renderMainContent={renderMainContent}
      footer={
        isCreationMode ? (
          <CreationModeFooter
            onBack={handleExitCreationMode}
            onSubmit={handleCreatePolicy}
            isLoading={isCreating}
            submitDisabled={!policyLabel.trim()}
            submitLabel="Create policy"
          />
        ) : undefined
      }
      contentPadding={isCreationMode ? 0 : undefined}
    />
  );
}
