/**
 * Concept 6: Live parameter editor
 *
 * Combines the browse modal, tabbed detail view, and live parameter editor
 * into a single navigable experience. Three modes:
 *
 * 1. Browse — sidebar sections + policy card grid (mirrors PolicyBrowseModal)
 * 2. Detail — tabbed view (Overview / Edit / History) for a selected policy
 * 3. Edit  — full parameter editor with real ParameterSidebar, ValueSetterCard,
 *            ChangesCard, HistoricalValuesCard, etc.
 *
 * Uses real imported components wherever possible; sample data fills the browse
 * grid since we are not inside a modal context with live API data.
 */

import { Fragment, useCallback, useMemo, useState } from 'react';
import {
  IconChartLine,
  IconChevronLeft,
  IconChevronRight,
  IconDeviceFloppy,
  IconEye,
  IconFolder,
  IconInfoCircle,
  IconListDetails,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconScale,
  IconSearch,
  IconStar,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import {
  ActionIcon,
  Autocomplete,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
  Transition,
  UnstyledButton,
} from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getDateRange, selectSearchableParameters } from '@/libs/metadataUtils';
import { EditableLabel } from '@/pages/reportBuilder/components/EditableLabel';
import {
  BROWSE_MODAL_CONFIG,
  FONT_SIZES,
  INGREDIENT_COLORS,
} from '@/pages/reportBuilder/constants';
import {
  ChangesCard,
  EmptyParameterState,
  HistoricalValuesCard,
  ParameterHeaderCard,
  ValueSetterCard,
  type ModifiedParam,
} from '@/pages/reportBuilder/modals/policyCreation';
import { ValueSetterMode } from '@/pathways/report/components/valueSetters';
import { RootState } from '@/store';
import { ParameterTreeNode } from '@/types/metadata';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyStateProps } from '@/types/pathwayState';
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
import { ConceptShell } from './ConceptShell';
import { SAMPLE_DISPLAY_PARAMS, SAMPLE_SAVED_POLICIES, type SamplePolicy } from './sampleData';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'browse' | 'detail' | 'edit';
type BrowseSection = 'frequently-selected' | 'my-policies' | 'public';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Concept6LiveParameterEditor() {
  const countryId = useCurrentCountry() as 'us' | 'uk';
  void countryId;

  const colorConfig = INGREDIENT_COLORS.policy;

  // --- View navigation state ---
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [activeBrowseSection, setActiveBrowseSection] = useState<BrowseSection>('my-policies');
  const [selectedPolicy, setSelectedPolicy] = useState<SamplePolicy | null>(null);
  const [drawerPolicy, setDrawerPolicy] = useState<SamplePolicy | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  // --- Redux state for live parameter editor ---
  const {
    parameterTree,
    parameters,
    loading: metadataLoading,
  } = useSelector((state: RootState) => state.metadata);
  const { minDate, maxDate } = useSelector(getDateRange);
  const searchableParameters = useSelector(selectSearchableParameters);

  // --- Local policy editing state ---
  const [policyLabel, setPolicyLabel] = useState<string>('');
  const [policyParameters, setPolicyParameters] = useState<Parameter[]>([]);
  const [selectedParam, setSelectedParam] = useState<ParameterMetadata | null>(null);
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set());
  const [valueSetterMode, setValueSetterMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);
  const [intervals, setIntervals] = useState<ValueInterval[]>([]);
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');
  const [parameterSearch, setParameterSearch] = useState('');

  const localPolicy: PolicyStateProps = useMemo(
    () => ({ label: policyLabel, parameters: policyParameters }),
    [policyLabel, policyParameters]
  );
  const modificationCount = countPolicyModifications(localPolicy);

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

  // --- Handlers ---

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

  const handleSelectParam = useCallback(
    (paramName: string) => {
      const metadata = parameters[paramName];
      if (metadata) {
        setSelectedParam(metadata);
      }
    },
    [parameters]
  );

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

  // Navigation helpers
  const goToBrowse = () => {
    setViewMode('browse');
    setSelectedPolicy(null);
    setDrawerPolicy(null);
  };

  const goToDetail = (policy: SamplePolicy) => {
    setSelectedPolicy(policy);
    setPolicyLabel(policy.label);
    setActiveTab('overview');
    setViewMode('detail');
    setDrawerPolicy(null);
  };

  const goToEdit = () => {
    setSelectedParam(null);
    setExpandedMenuItems(new Set());
    setPolicyParameters([]);
    setIntervals([]);
    setParameterSearch('');
    setValueSetterMode(ValueSetterMode.DEFAULT);
    setViewMode('edit');
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <ConceptShell
      number={6}
      title="Live parameter editor"
      description="Full browse-modal experience: navigate from browse grid → tabbed detail view → live parameter editor. Uses the real ParameterSidebar, ValueSetterCard, ChangesCard, and HistoricalValuesCard components wired to live Redux metadata."
    >
      {/* ============================================================== */}
      {/* HEADER                                                         */}
      {/* ============================================================== */}
      <Box
        style={{
          padding: `${spacing.md} ${spacing.xl}`,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap={spacing.sm}>
            <Box
              style={{
                width: 36,
                height: 36,
                borderRadius: spacing.radius.md,
                background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colors.white} 100%)`,
                border: `1px solid ${colorConfig.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconScale size={20} color={colorConfig.icon} />
            </Box>
            <Stack gap={0}>
              <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}>
                {viewMode === 'browse' && 'Select policy'}
                {viewMode === 'detail' && (selectedPolicy?.label || 'Policy detail')}
                {viewMode === 'edit' && 'Policy editor'}
              </Text>
              <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                {viewMode === 'browse' && 'Choose an existing policy or create a new one'}
                {viewMode === 'detail' && `${selectedPolicy?.paramCount || 0} parameters modified`}
                {viewMode === 'edit' && 'Set parameter values for your policy reform'}
              </Text>
            </Stack>
          </Group>
          {viewMode === 'edit' && (
            <Group gap={spacing.xs}>
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
          )}
        </Group>
      </Box>

      {/* ============================================================== */}
      {/* BODY                                                           */}
      {/* ============================================================== */}
      <Group align="stretch" gap={0} style={{ minHeight: 550, overflow: 'hidden' }} wrap="nowrap">
        {/* -------------------------------------------------------------- */}
        {/* SIDEBAR                                                        */}
        {/* -------------------------------------------------------------- */}
        {viewMode === 'browse' && (
          <BrowseSidebar
            activeSection={activeBrowseSection}
            onSectionChange={setActiveBrowseSection}
            onCreateNew={goToEdit}
            policyCount={SAMPLE_SAVED_POLICIES.length}
            colorConfig={colorConfig}
          />
        )}
        {viewMode === 'detail' && (
          <DetailSidebar onBack={goToBrowse} onEditTab={() => setActiveTab('edit')} />
        )}
        {viewMode === 'edit' && (
          <EditSidebar
            policyLabel={policyLabel}
            onPolicyLabelChange={setPolicyLabel}
            modifiedParams={modifiedParams}
            modificationCount={modificationCount}
            parameterTree={parameterTree}
            metadataLoading={metadataLoading}
            selectedParam={selectedParam}
            expandedMenuItems={expandedMenuItems}
            parameterSearch={parameterSearch}
            searchableParameters={searchableParameters}
            onSearchChange={setParameterSearch}
            onSearchSelect={handleSearchSelect}
            onMenuItemClick={handleMenuItemClick}
            colorConfig={colorConfig}
          />
        )}

        {/* -------------------------------------------------------------- */}
        {/* MAIN CONTENT                                                   */}
        {/* -------------------------------------------------------------- */}
        <Box
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: viewMode === 'edit' ? colors.gray[50] : colors.white,
            position: 'relative',
          }}
        >
          {viewMode === 'browse' && (
            <BrowseContent
              activeSection={activeBrowseSection}
              onSelectPolicy={goToDetail}
              onInfoClick={setDrawerPolicy}
              colorConfig={colorConfig}
            />
          )}
          {viewMode === 'detail' && selectedPolicy && (
            <DetailContent
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onEditFull={goToEdit}
              colorConfig={colorConfig}
            />
          )}
          {viewMode === 'edit' && (
            <EditContent
              selectedParam={selectedParam}
              localPolicy={localPolicy}
              policyLabel={policyLabel}
              minDate={minDate}
              maxDate={maxDate}
              valueSetterMode={valueSetterMode}
              intervals={intervals}
              startDate={startDate}
              endDate={endDate}
              modifiedParams={modifiedParams}
              modificationCount={modificationCount}
              baseValues={baseValues}
              reformValues={reformValues}
              onModeChange={setValueSetterMode}
              onIntervalsChange={setIntervals}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onSubmit={handleValueSubmit}
              onSelectParam={handleSelectParam}
            />
          )}

          {/* Drawer overlay for browse mode */}
          {viewMode === 'browse' && (
            <DetailDrawer
              policy={drawerPolicy}
              onClose={() => setDrawerPolicy(null)}
              onSelect={(p) => goToDetail(p)}
              colorConfig={colorConfig}
            />
          )}
        </Box>
      </Group>

      {/* ============================================================== */}
      {/* FOOTER                                                         */}
      {/* ============================================================== */}
      {(viewMode === 'detail' || viewMode === 'edit') && (
        <Box
          style={{
            padding: `${spacing.md} ${spacing.xl}`,
            borderTop: `1px solid ${colors.border.light}`,
            background: colors.white,
          }}
        >
          <Group justify="space-between">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconChevronLeft size={16} />}
              onClick={
                viewMode === 'edit'
                  ? () => {
                      if (selectedPolicy) {
                        setViewMode('detail');
                      } else {
                        goToBrowse();
                      }
                    }
                  : goToBrowse
              }
            >
              {viewMode === 'edit' && selectedPolicy ? 'Back to detail' : 'Back to browse'}
            </Button>
            <Group gap={spacing.sm}>
              {viewMode === 'detail' && (
                <Button color="teal" onClick={goToEdit}>
                  Edit parameters
                </Button>
              )}
              {viewMode === 'edit' && (
                <Button color="teal" disabled={modificationCount === 0}>
                  Save as new policy
                </Button>
              )}
            </Group>
          </Group>
        </Box>
      )}
    </ConceptShell>
  );
}

// ============================================================================
// BROWSE SIDEBAR
// ============================================================================

function BrowseSidebar({
  activeSection,
  onSectionChange,
  onCreateNew,
  policyCount,
  colorConfig,
}: {
  activeSection: BrowseSection;
  onSectionChange: (s: BrowseSection) => void;
  onCreateNew: () => void;
  policyCount: number;
  colorConfig: typeof INGREDIENT_COLORS.policy;
}) {
  const items = [
    {
      id: 'frequently-selected' as const,
      label: 'Frequently selected',
      icon: <IconStar size={16} />,
    },
    {
      id: 'my-policies' as const,
      label: 'My policies',
      icon: <IconFolder size={16} />,
      badge: policyCount,
    },
    { id: 'public' as const, label: 'User-created policies', icon: <IconUsers size={16} /> },
  ];

  return (
    <Box
      style={{
        width: BROWSE_MODAL_CONFIG.sidebarWidth,
        borderRight: `1px solid ${colors.border.light}`,
        padding: spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <Text
        fw={600}
        style={{
          fontSize: FONT_SIZES.tiny,
          color: colors.gray[500],
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: spacing.sm,
        }}
      >
        Library
      </Text>
      <Stack gap={spacing.xs}>
        {items.map((item) => (
          <UnstyledButton
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: spacing.radius.sm,
              background: activeSection === item.id ? colorConfig.bg : 'transparent',
              color: activeSection === item.id ? colorConfig.icon : colors.gray[700],
            }}
          >
            {item.icon}
            <Text style={{ fontSize: FONT_SIZES.small, flex: 1 }}>{item.label}</Text>
            {item.badge !== undefined && (
              <Text fw={700} style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
                {item.badge}
              </Text>
            )}
          </UnstyledButton>
        ))}
      </Stack>
      <Divider my={spacing.md} />
      <UnstyledButton
        onClick={onCreateNew}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          padding: `${spacing.xs} ${spacing.sm}`,
          borderRadius: spacing.radius.sm,
          color: colors.gray[700],
        }}
      >
        <IconPlus size={16} />
        <Text style={{ fontSize: FONT_SIZES.small }}>Create new policy</Text>
      </UnstyledButton>
    </Box>
  );
}

// ============================================================================
// DETAIL SIDEBAR
// ============================================================================

function DetailSidebar({ onBack, onEditTab }: { onBack: () => void; onEditTab: () => void }) {
  return (
    <Box
      style={{
        width: BROWSE_MODAL_CONFIG.sidebarWidth,
        borderRight: `1px solid ${colors.border.light}`,
        padding: spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        gap: spacing.md,
      }}
    >
      <UnstyledButton
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: spacing.xs }}
      >
        <IconChevronLeft size={14} color={colors.gray[500]} />
        <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>All policies</Text>
      </UnstyledButton>
      <Text
        fw={600}
        style={{
          fontSize: FONT_SIZES.tiny,
          color: colors.gray[500],
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Quick actions
      </Text>
      <Stack gap={spacing.xs}>
        <UnstyledButton
          onClick={onEditTab}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: spacing.radius.sm,
            color: colors.gray[700],
          }}
        >
          <IconPencil size={16} />
          <Text style={{ fontSize: FONT_SIZES.small }}>Edit parameters</Text>
        </UnstyledButton>
      </Stack>
    </Box>
  );
}

// ============================================================================
// EDIT SIDEBAR — "Policy overview" tab + parameter tree tab
// ============================================================================

function EditSidebar({
  policyLabel,
  onPolicyLabelChange,
  modifiedParams,
  modificationCount,
  parameterTree,
  metadataLoading,
  selectedParam,
  expandedMenuItems,
  parameterSearch,
  searchableParameters,
  onSearchChange,
  onSearchSelect,
  onMenuItemClick,
  colorConfig,
}: {
  policyLabel: string;
  onPolicyLabelChange: (v: string) => void;
  modifiedParams: ModifiedParam[];
  modificationCount: number;
  parameterTree: { children?: ParameterTreeNode[] } | null;
  metadataLoading: boolean;
  selectedParam: ParameterMetadata | null;
  expandedMenuItems: Set<string>;
  parameterSearch: string;
  searchableParameters: Array<{ value: string; label: string }>;
  onSearchChange: (v: string) => void;
  onSearchSelect: (v: string) => void;
  onMenuItemClick: (v: string) => void;
  colorConfig: typeof INGREDIENT_COLORS.policy;
}) {
  const [sidebarTab, setSidebarTab] = useState<string | null>('overview');

  // Parameter tree renderer
  const renderMenuItems = useCallback(
    (items: ParameterTreeNode[]): React.ReactNode => {
      return items
        .filter((item) => !item.name.includes('pycache'))
        .map((item) => (
          <Box
            key={item.name}
            onClick={() => onMenuItemClick(item.name)}
            style={{
              padding: `3px ${spacing.xs}`,
              borderRadius: spacing.radius.sm,
              cursor: 'pointer',
              background:
                selectedParam?.parameter === item.name ? colors.primary[50] : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: FONT_SIZES.small,
                color:
                  selectedParam?.parameter === item.name ? colors.primary[700] : colors.gray[700],
                fontWeight: selectedParam?.parameter === item.name ? 600 : 400,
              }}
            >
              {expandedMenuItems.has(item.name) && item.children
                ? '▾ '
                : item.children
                  ? '▸ '
                  : '  '}
              {item.label}
            </Text>
            {item.children && expandedMenuItems.has(item.name) && (
              <Box style={{ paddingLeft: 12 }}>{renderMenuItems(item.children)}</Box>
            )}
          </Box>
        ));
    },
    [selectedParam?.parameter, expandedMenuItems, onMenuItemClick]
  );

  const renderedTree = useMemo(() => {
    if (metadataLoading || !parameterTree) {
      return null;
    }
    return renderMenuItems(parameterTree.children || []);
  }, [metadataLoading, parameterTree, renderMenuItems]);

  return (
    <Box
      style={{
        width: 300,
        borderRight: `1px solid ${colors.border.light}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        background: colors.white,
        overflow: 'hidden',
      }}
    >
      {/* Tab switcher */}
      <Tabs
        value={sidebarTab}
        onChange={setSidebarTab}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
      >
        <Tabs.List style={{ borderBottom: `1px solid ${colors.border.light}`, flexShrink: 0 }}>
          <Tabs.Tab
            value="overview"
            leftSection={<IconListDetails size={14} />}
            style={{ fontSize: FONT_SIZES.small }}
          >
            Policy overview
          </Tabs.Tab>
          <Tabs.Tab
            value="parameters"
            leftSection={<IconSearch size={14} />}
            style={{ fontSize: FONT_SIZES.small }}
          >
            Parameters
          </Tabs.Tab>
        </Tabs.List>

        {/* ---- Policy overview panel ---- */}
        <Tabs.Panel
          value="overview"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {/* Naming header — mirrors PopulationStatusHeader */}
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
              padding: `${spacing.sm} ${spacing.md}`,
              transition: 'all 0.3s ease',
              margin: spacing.md,
            }}
          >
            <Group gap={spacing.sm} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
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
                onChange={onPolicyLabelChange}
                placeholder="Enter policy name..."
                emptyStateText="Click to name your policy..."
              />
            </Group>
          </Box>

          {/* Parameter grid */}
          <ScrollArea style={{ flex: 1 }} offsetScrollbars>
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
                  style={{ fontSize: FONT_SIZES.tiny, color: colors.gray[400], maxWidth: 200 }}
                >
                  Switch to the Parameters tab to start modifying values.
                </Text>
              </Box>
            ) : (
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
                    padding: `${spacing.xs} ${spacing.md}`,
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
                    padding: `${spacing.xs} ${spacing.sm}`,
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
                    padding: `${spacing.xs} ${spacing.md}`,
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
                        padding: `${spacing.xs} ${spacing.md}`,
                        borderBottom: `1px solid ${colors.gray[100]}`,
                      }}
                    >
                      <Tooltip label={param.paramName} multiline w={260} withArrow>
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
                        padding: `${spacing.xs} ${spacing.sm}`,
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
                        padding: `${spacing.xs} ${spacing.md}`,
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
            )}
          </ScrollArea>

          {/* Bottom action buttons */}
          <Box
            style={{
              padding: spacing.md,
              borderTop: `1px solid ${colors.border.light}`,
              flexShrink: 0,
            }}
          >
            <Stack gap={spacing.xs}>
              <Button
                variant="filled"
                color="teal"
                size="xs"
                fullWidth
                leftSection={<IconDeviceFloppy size={14} />}
                onClick={() => console.info('[Concept 6] Save as new policy')}
              >
                Save as new policy
              </Button>
              <Button
                variant="default"
                size="xs"
                fullWidth
                leftSection={<IconRefresh size={14} />}
                onClick={() => console.info('[Concept 6] Replace existing policy')}
              >
                Replace existing policy
              </Button>
            </Stack>
          </Box>
        </Tabs.Panel>

        {/* ---- Parameters panel ---- */}
        <Tabs.Panel
          value="parameters"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <Box
            style={{
              padding: spacing.md,
              borderBottom: `1px solid ${colors.border.light}`,
              background: colors.gray[50],
            }}
          >
            <Autocomplete
              placeholder="Search parameters..."
              value={parameterSearch}
              onChange={onSearchChange}
              onOptionSubmit={onSearchSelect}
              data={searchableParameters}
              limit={20}
              leftSection={<IconSearch size={14} color={colors.gray[400]} />}
              size="xs"
              styles={{
                input: { fontSize: FONT_SIZES.small, height: 32, minHeight: 32 },
                dropdown: { maxHeight: 300 },
                option: { fontSize: FONT_SIZES.small, padding: `${spacing.xs} ${spacing.sm}` },
              }}
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
                renderedTree
              )}
            </Box>
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}

// ============================================================================
// BROWSE CONTENT
// ============================================================================

function BrowseContent({
  activeSection,
  onSelectPolicy,
  onInfoClick,
  colorConfig,
}: {
  activeSection: BrowseSection;
  onSelectPolicy: (p: SamplePolicy) => void;
  onInfoClick: (p: SamplePolicy) => void;
  colorConfig: typeof INGREDIENT_COLORS.policy;
}) {
  const [search, setSearch] = useState('');

  const filtered = SAMPLE_SAVED_POLICIES.filter((p) =>
    p.label.toLowerCase().includes(search.toLowerCase())
  );

  if (activeSection === 'frequently-selected') {
    return (
      <Box style={{ padding: spacing.lg }}>
        <Text
          fw={600}
          style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800], marginBottom: spacing.lg }}
        >
          Frequently selected
        </Text>
        <Paper
          style={{
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.lg,
            padding: spacing.lg,
            cursor: 'pointer',
            maxWidth: 340,
            position: 'relative',
            overflow: 'hidden',
          }}
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
            <Stack gap={spacing.xs}>
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
      </Box>
    );
  }

  if (activeSection === 'public') {
    return (
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
          flex: 1,
          gap: spacing.md,
        }}
      >
        <Box
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: colors.gray[100],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconUsers size={28} color={colors.gray[400]} />
        </Box>
        <Text fw={500} c={colors.gray[600]}>
          Coming soon
        </Text>
        <Text c="dimmed" ta="center" maw={300} style={{ fontSize: FONT_SIZES.small }}>
          Search and browse policies created by other PolicyEngine users.
        </Text>
      </Box>
    );
  }

  return (
    <Box style={{ padding: spacing.lg, display: 'flex', flexDirection: 'column', flex: 1 }}>
      <TextInput
        placeholder="Search policies by name or parameter..."
        leftSection={<IconSearch size={16} color={colors.gray[400]} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        size="sm"
        styles={{ input: { borderRadius: spacing.radius.md, fontSize: FONT_SIZES.small } }}
        style={{ marginBottom: spacing.lg }}
      />
      <Group justify="space-between" align="center" style={{ marginBottom: spacing.md }}>
        <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
          My policies
        </Text>
        <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
          {filtered.length} {filtered.length === 1 ? 'policy' : 'policies'}
        </Text>
      </Group>
      <ScrollArea style={{ flex: 1 }} offsetScrollbars>
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: spacing.md,
          }}
        >
          {filtered.map((policy) => (
            <Paper
              key={policy.id}
              style={{
                border: `1px solid ${colors.border.light}`,
                borderRadius: spacing.radius.lg,
                padding: spacing.lg,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => onSelectPolicy(policy)}
            >
              <Box
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: colors.gray[200],
                }}
              />
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={spacing.xs} style={{ flex: 1 }}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}>
                    {policy.label}
                  </Text>
                  <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                    {policy.paramCount} param{policy.paramCount !== 1 ? 's' : ''} changed
                  </Text>
                </Stack>
                <Group gap={spacing.xs} style={{ flexShrink: 0 }}>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInfoClick(policy);
                    }}
                  >
                    <IconInfoCircle size={18} />
                  </ActionIcon>
                  <IconChevronRight size={16} color={colors.gray[400]} />
                </Group>
              </Group>
            </Paper>
          ))}
        </Box>
      </ScrollArea>
    </Box>
  );
}

// ============================================================================
// DETAIL DRAWER (overlay on browse)
// ============================================================================

function DetailDrawer({
  policy,
  onClose,
  onSelect,
  colorConfig,
}: {
  policy: SamplePolicy | null;
  onClose: () => void;
  onSelect: (p: SamplePolicy) => void;
  colorConfig: typeof INGREDIENT_COLORS.policy;
}) {
  // Find display params that belong to this policy (use all sample params for demo)
  const displayParams = policy ? SAMPLE_DISPLAY_PARAMS : [];

  return (
    <>
      <Transition mounted={!!policy} transition="fade" duration={200}>
        {(styles) => (
          <Box
            style={{
              ...styles,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.08)',
              zIndex: 10,
            }}
            onClick={onClose}
          />
        )}
      </Transition>
      <Transition mounted={!!policy} transition="slide-left" duration={250}>
        {(styles) => (
          <Box
            style={{
              ...styles,
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 480,
              background: colors.white,
              borderLeft: `1px solid ${colors.gray[200]}`,
              boxShadow: '-8px 0 24px rgba(0,0,0,0.08)',
              zIndex: 11,
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {policy && (
              <>
                <Box style={{ padding: spacing.lg, borderBottom: `1px solid ${colors.gray[200]}` }}>
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={spacing.xs} style={{ flex: 1 }}>
                      <Text
                        fw={600}
                        style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}
                      >
                        {policy.label}
                      </Text>
                      <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
                        {policy.paramCount} parameter{policy.paramCount !== 1 ? 's' : ''} changed
                        from current law
                      </Text>
                    </Stack>
                    <ActionIcon variant="subtle" color="gray" onClick={onClose}>
                      <IconX size={18} />
                    </ActionIcon>
                  </Group>
                </Box>
                <ScrollArea style={{ flex: 1 }} offsetScrollbars>
                  <Box
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      gap: 0,
                    }}
                  >
                    <Text
                      fw={600}
                      style={{
                        fontSize: FONT_SIZES.small,
                        color: colors.gray[600],
                        padding: spacing.lg,
                        paddingBottom: spacing.sm,
                        borderBottom: `1px solid ${colors.gray[200]}`,
                      }}
                    >
                      Parameter
                    </Text>
                    <Text
                      fw={600}
                      style={{
                        fontSize: FONT_SIZES.small,
                        color: colors.gray[600],
                        textAlign: 'right',
                        padding: spacing.lg,
                        paddingBottom: spacing.sm,
                        borderBottom: `1px solid ${colors.gray[200]}`,
                        gridColumn: 'span 2',
                      }}
                    >
                      Changes
                    </Text>
                    {displayParams.map((param) => (
                      <Fragment key={param.paramName}>
                        <Box
                          style={{
                            padding: `${spacing.sm} ${spacing.lg}`,
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
                            padding: `${spacing.sm} ${spacing.lg}`,
                            paddingLeft: spacing.sm,
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
                </ScrollArea>
                <Box style={{ padding: spacing.lg, borderTop: `1px solid ${colors.gray[200]}` }}>
                  <Button
                    color="teal"
                    fullWidth
                    onClick={() => onSelect(policy)}
                    rightSection={<IconChevronRight size={16} />}
                  >
                    View details
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}
      </Transition>
    </>
  );
}

// ============================================================================
// DETAIL CONTENT — tabbed view
// ============================================================================

function DetailContent({
  activeTab,
  onTabChange,
  onEditFull,
  colorConfig,
}: {
  activeTab: string | null;
  onTabChange: (tab: string | null) => void;
  onEditFull: () => void;
  colorConfig: typeof INGREDIENT_COLORS.policy;
}) {
  return (
    <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Tabs
        value={activeTab}
        onChange={onTabChange}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Tabs.List style={{ borderBottom: `1px solid ${colors.border.light}` }}>
          <Tabs.Tab
            value="overview"
            leftSection={<IconEye size={14} />}
            style={{ fontSize: FONT_SIZES.small }}
          >
            Overview
          </Tabs.Tab>
          <Tabs.Tab
            value="edit"
            leftSection={<IconPencil size={14} />}
            style={{ fontSize: FONT_SIZES.small }}
          >
            Edit
          </Tabs.Tab>
          <Tabs.Tab
            value="history"
            leftSection={<IconChartLine size={14} />}
            style={{ fontSize: FONT_SIZES.small }}
          >
            History
          </Tabs.Tab>
        </Tabs.List>

        {/* Overview tab — parameter grid */}
        <Tabs.Panel value="overview" style={{ flex: 1, overflow: 'auto' }}>
          <Box style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 0 }}>
            <Text
              fw={600}
              style={{
                fontSize: 11,
                color: colors.gray[500],
                padding: `${spacing.sm} ${spacing.lg}`,
                borderBottom: `1px solid ${colors.gray[200]}`,
                background: colors.gray[50],
              }}
            >
              Parameter
            </Text>
            <Text
              fw={600}
              style={{
                fontSize: 11,
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
                fontSize: 11,
                color: colors.gray[500],
                padding: `${spacing.sm} ${spacing.lg}`,
                borderBottom: `1px solid ${colors.gray[200]}`,
                background: colors.gray[50],
                textAlign: 'right',
              }}
            >
              Value
            </Text>
            {SAMPLE_DISPLAY_PARAMS.map((param) => (
              <Fragment key={param.paramName}>
                <Box
                  style={{
                    padding: `${spacing.sm} ${spacing.lg}`,
                    borderBottom: `1px solid ${colors.gray[100]}`,
                  }}
                >
                  <Text
                    style={{ fontSize: FONT_SIZES.small, color: colors.gray[700], lineHeight: 1.4 }}
                  >
                    {param.label}
                  </Text>
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
                    padding: `${spacing.sm} ${spacing.lg}`,
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
        </Tabs.Panel>

        {/* Edit tab — prompt to enter full editor */}
        <Tabs.Panel value="edit" style={{ flex: 1, overflow: 'auto' }}>
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing.xl,
              minHeight: 300,
              gap: spacing.md,
            }}
          >
            <Box
              style={{
                width: 64,
                height: 64,
                borderRadius: spacing.radius.lg,
                background: colors.primary[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconPencil size={32} color={colors.primary[500]} />
            </Box>
            <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
              Edit this policy
            </Text>
            <Text
              ta="center"
              maw={400}
              style={{ fontSize: FONT_SIZES.small, color: colors.gray[500], lineHeight: 1.5 }}
            >
              Open the full parameter editor to modify values, add new parameter changes, and
              preview historical data. Changes will be saved as a new policy.
            </Text>
            <Button
              color="teal"
              leftSection={<IconPencil size={16} />}
              onClick={onEditFull}
              mt={spacing.sm}
            >
              Open parameter editor
            </Button>
          </Box>
        </Tabs.Panel>

        {/* History tab — placeholder */}
        <Tabs.Panel value="history" style={{ flex: 1 }}>
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 300,
              background: colors.gray[50],
            }}
          >
            <Stack align="center" gap={spacing.sm}>
              <IconChartLine size={40} color={colors.gray[300]} />
              <Text style={{ fontSize: FONT_SIZES.normal, color: colors.gray[400] }}>
                Historical values chart
              </Text>
              <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[400] }}>
                Shows base vs. reform values over time for selected parameters
              </Text>
            </Stack>
          </Box>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}

// ============================================================================
// EDIT CONTENT — real live parameter editor components
// ============================================================================

function EditContent({
  selectedParam,
  localPolicy,
  policyLabel,
  minDate,
  maxDate,
  valueSetterMode,
  intervals,
  startDate,
  endDate,
  modifiedParams,
  modificationCount,
  baseValues,
  reformValues,
  onModeChange,
  onIntervalsChange,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
  onSelectParam,
}: {
  selectedParam: ParameterMetadata | null;
  localPolicy: PolicyStateProps;
  policyLabel: string;
  minDate: string;
  maxDate: string;
  valueSetterMode: ValueSetterMode;
  intervals: ValueInterval[];
  startDate: string;
  endDate: string;
  modifiedParams: ModifiedParam[];
  modificationCount: number;
  baseValues: ValueIntervalCollection | null;
  reformValues: ValueIntervalCollection | null;
  onModeChange: (m: ValueSetterMode) => void;
  onIntervalsChange: React.Dispatch<React.SetStateAction<ValueInterval[]>>;
  onStartDateChange: React.Dispatch<React.SetStateAction<string>>;
  onEndDateChange: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
  onSelectParam: (name: string) => void;
}) {
  if (!selectedParam) {
    return <EmptyParameterState />;
  }

  return (
    <Box style={{ flex: 1, overflow: 'auto', padding: spacing.xl }}>
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
              onModeChange={onModeChange}
              onIntervalsChange={onIntervalsChange}
              onStartDateChange={onStartDateChange}
              onEndDateChange={onEndDateChange}
              onSubmit={onSubmit}
            />
            <ChangesCard
              modifiedParams={modifiedParams.filter(
                (p) => p.paramName === selectedParam?.parameter
              )}
              modificationCount={modificationCount}
              selectedParamName={selectedParam?.parameter}
              onSelectParam={onSelectParam}
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
  );
}
