/**
 * PolicyParameterSelectorView - View for selecting policy parameters
 * Duplicated from PolicyParameterSelectorFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import { AppShell, Box, Button, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { ParameterChildNode } from '@/api/v2';
import HeaderNavigation from '@/components/shared/HomeHeader';
import { spacing } from '@/designTokens';
import { colors } from '@/designTokens/colors';
import { ParameterMetadata } from '@/types/metadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { countPolicyModifications } from '@/utils/countParameterChanges';
import MainEmpty from '../../components/policyParameterSelector/MainEmpty';
import Menu from '../../components/policyParameterSelector/Menu';
import PolicyParameterSelectorMain from '../../components/PolicyParameterSelectorMain';

interface PolicyParameterSelectorViewProps {
  policy: PolicyStateProps;
  onPolicyUpdate: (updatedPolicy: PolicyStateProps) => void;
  onNext: () => void;
  onBack?: () => void;
}

export default function PolicyParameterSelectorView({
  policy,
  onPolicyUpdate,
  onNext,
  onBack,
}: PolicyParameterSelectorViewProps) {
  const [selectedLeafParam, setSelectedLeafParam] = useState<ParameterMetadata | null>(null);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();

  // Count modifications from policy prop
  const modificationCount = countPolicyModifications(policy);

  function handleMenuItemClick(node: ParameterChildNode) {
    if (node.type !== 'parameter' || !node.parameter) {
      return;
    }

    // Map ParameterChildNode to ParameterMetadata
    const param: ParameterMetadata = {
      id: node.parameter.id,
      name: node.parameter.name,
      label: node.parameter.label ?? node.label,
      description: node.parameter.description,
      unit: node.parameter.unit,
      data_type: node.parameter.data_type ?? undefined,
      tax_benefit_model_version_id: node.parameter.tax_benefit_model_version_id,
      created_at: node.parameter.created_at,
      type: 'parameter',
      parameter: node.path,
    };

    setSelectedLeafParam(param);
    if (mobileOpened) {
      toggleMobile();
    }
  }

  // Custom footer component for this view
  const PolicyParameterFooter = () => (
    <Group justify="space-between" align="center">
      {onBack && (
        <Button variant="default" onClick={onBack}>
          Back
        </Button>
      )}
      {modificationCount > 0 && (
        <Group gap="xs">
          <Box
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: colors.primary[600],
            }}
          />
          <Text size="sm" c="gray.5">
            {modificationCount} parameter modification{modificationCount !== 1 ? 's' : ''}
          </Text>
        </Group>
      )}
      <Button variant="filled" onClick={onNext} rightSection={<IconChevronRight size={16} />}>
        Review my policy
      </Button>
    </Group>
  );

  return (
    <AppShell
      layout="default"
      padding="md"
      header={{ height: parseInt(spacing.appShell.header.height, 10) }}
      navbar={{
        width: parseInt(spacing.appShell.navbar.width, 10),
        breakpoint: spacing.appShell.navbar.breakpoint,
      }}
      footer={{ height: parseInt(spacing.appShell.footer.height, 10) }}
    >
      <AppShell.Header p={0}>
        <HeaderNavigation />
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="gray.0">
        <Menu setSelectedParamLabel={handleMenuItemClick} />
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        {selectedLeafParam ? (
          <PolicyParameterSelectorMain
            key={selectedLeafParam.parameter}
            param={selectedLeafParam}
            policy={policy}
            onPolicyUpdate={onPolicyUpdate}
          />
        ) : (
          <MainEmpty />
        )}
      </AppShell.Main>

      <AppShell.Footer p="md">
        <PolicyParameterFooter />
      </AppShell.Footer>
    </AppShell>
  );
}
