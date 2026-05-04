/**
 * PolicyBrowseModal - Browse and select policies.
 *
 * Editing and creation are delegated to PolicyCreationModal so there is a
 * single policy editor/viewer flow in report builder.
 */
import { useEffect, useMemo, useState } from 'react';
import { IconChevronRight, IconFolder, IconPlus, IconScale, IconStar } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { Group } from '@/components/ui/Group';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { MOCK_USER_ID } from '@/constants';
import { colors, spacing } from '@/designTokens';
import { useUpdatePolicyAssociation, useUserPolicies } from '@/hooks/useUserPolicy';
import { RootState } from '@/store';
import { PolicyStateProps } from '@/types/pathwayState';
import { countPolicyModifications } from '@/utils/countParameterChanges';
import { formatLabelParts, getHierarchicalLabelsFromTree } from '@/utils/parameterLabels';
import { FONT_SIZES, INGREDIENT_COLORS } from '../constants';
import { createCurrentLawPolicy } from '../currentLaw';
import { BrowseModalTemplate } from './BrowseModalTemplate';
import { PolicyBrowseContent, PolicyDetailsDrawer } from './policy';

interface PolicyBrowseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (policy: PolicyStateProps) => void;
  reportYear: string;
  onCreateNew: () => void;
  onEditPolicy: (policy: PolicyStateProps, associationId?: string) => void;
}

export function PolicyBrowseModal({
  isOpen,
  onClose,
  onSelect,
  reportYear: _reportYear,
  onCreateNew,
  onEditPolicy,
}: PolicyBrowseModalProps) {
  const userId = MOCK_USER_ID.toString();
  const { data: policies, isLoading } = useUserPolicies(userId);
  const { parameterTree, parameters } = useSelector((state: RootState) => state.metadata);
  const updatePolicyAssociation = useUpdatePolicyAssociation();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'frequently-selected' | 'my-policies'>(
    'frequently-selected'
  );
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [drawerPolicyId, setDrawerPolicyId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveSection('frequently-selected');
      setSelectedPolicyId(null);
      setDrawerPolicyId(null);
    }
  }, [isOpen]);

  const userPolicies = useMemo(() => {
    return (policies || [])
      .map((p) => {
        const policyId = p.association.policyId.toString();
        return {
          id: policyId,
          associationId: p.association.id,
          label: p.association.label || `Policy #${policyId}`,
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

  const filteredPolicies = useMemo(() => {
    if (!searchQuery.trim()) {
      return userPolicies;
    }

    const query = searchQuery.toLowerCase();
    return userPolicies.filter((policy) => {
      if (policy.label.toLowerCase().includes(query)) {
        return true;
      }

      const paramDisplayNames = policy.parameters
        .map((param) => {
          const hierarchicalLabels = getHierarchicalLabelsFromTree(param.name, parameterTree);
          return hierarchicalLabels.length > 0
            ? formatLabelParts(hierarchicalLabels)
            : param.name.split('.').pop() || param.name;
        })
        .join(' ')
        .toLowerCase();

      return paramDisplayNames.includes(query);
    });
  }, [parameterTree, searchQuery, userPolicies]);

  const drawerPolicy = useMemo(() => {
    if (!drawerPolicyId) {
      return null;
    }

    return userPolicies.find((policy) => policy.id === drawerPolicyId) || null;
  }, [drawerPolicyId, userPolicies]);

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

    onSelect({
      id: policy.id,
      associationId: policy.associationId,
      label: policy.label,
      parameters: Array(policy.paramCount).fill({}),
    });
    onClose();
  };

  const handleSelectCurrentLaw = () => {
    onSelect(createCurrentLawPolicy());
    onClose();
  };

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
            id: 'create-new',
            label: 'Create new policy',
            icon: <IconPlus size={16} />,
            onClick: onCreateNew,
          },
        ],
      },
    ],
    [activeSection, onCreateNew, userPolicies.length]
  );

  const colorConfig = INGREDIENT_COLORS.policy;

  const renderMainContent = () => {
    if (activeSection === 'frequently-selected') {
      return (
        <Stack gap="lg" style={{ height: '100%' }}>
          <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
            Frequently selected
          </Text>
          <div
            role="button"
            tabIndex={0}
            style={{
              background: colors.white,
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.feature,
              padding: spacing.lg,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative' as const,
              overflow: 'hidden',
              maxWidth: 340,
            }}
            onClick={handleSelectCurrentLaw}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectCurrentLaw();
              }
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, ${colorConfig.accent}, ${colorConfig.icon})`,
              }}
            />
            <Group justify="space-between" align="start" wrap="nowrap">
              <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}>
                  Current law
                </Text>
                <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                  No parameter changes
                </Text>
              </Stack>
              <IconChevronRight size={16} color={colors.gray[400]} />
            </Group>
          </div>
        </Stack>
      );
    }

    return (
      <>
        <PolicyBrowseContent
          displayedPolicies={filteredPolicies}
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
          onEnterCreationMode={onCreateNew}
          getSectionTitle={() => (activeSection === 'my-policies' ? 'My policies' : 'Policies')}
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
            if (!drawerPolicy) {
              return;
            }

            setDrawerPolicyId(null);
            onEditPolicy(
              {
                id: drawerPolicy.id,
                associationId: drawerPolicy.associationId,
                label: drawerPolicy.label,
                parameters: drawerPolicy.parameters,
              },
              drawerPolicy.associationId
            );
          }}
        />
      </>
    );
  };

  return (
    <BrowseModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      headerIcon={<IconScale size={20} color={colorConfig.icon} />}
      headerTitle="Select policy"
      headerSubtitle="Choose an existing policy or create a new one"
      colorConfig={colorConfig}
      sidebarSections={browseSidebarSections}
      renderMainContent={renderMainContent}
    />
  );
}
