/**
 * PolicyParameterSelectorView - View for selecting policy parameters
 * Duplicated from PolicyParameterSelectorFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { AppShell, Box, Button, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronRight } from '@tabler/icons-react';
import MainEmpty from '@/components/policyParameterSelectorFrame/MainEmpty';
import Menu from '@/components/policyParameterSelectorFrame/Menu';
import HeaderNavigation from '@/components/shared/HomeHeader';
import LegacyBanner from '@/components/shared/LegacyBanner';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens';
import { RootState } from '@/store';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { countPolicyModifications } from '@/utils/countParameterChanges';
import PolicyParameterSelectorMain from '../../components/PolicyParameterSelectorMain';

interface PolicyParameterSelectorViewProps {
  policy: PolicyStateProps;
  onPolicyUpdate: (updatedPolicy: PolicyStateProps) => void;
  onNext: () => void;
  onReturn: () => void;
}

export default function PolicyParameterSelectorView({
  policy,
  onPolicyUpdate,
  onNext,
  onReturn,
}: PolicyParameterSelectorViewProps) {
  const [selectedLeafParam, setSelectedLeafParam] = useState<ParameterMetadata | null>(null);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();

  // Get metadata from Redux state
  const { parameterTree, parameters, loading, error } = useSelector(
    (state: RootState) => state.metadata
  );

  // Count modifications from policy prop
  const modificationCount = countPolicyModifications(policy);

  // Show error if metadata failed to load
  if (error) {
    return (
      <div>
        <Text c="red">Error loading parameters: {error}</Text>
        <Text>Please try refreshing the page.</Text>
      </div>
    );
  }

  function handleMenuItemClick(paramLabel: string) {
    const param: ParameterMetadata | null = parameters[paramLabel] || null;
    if (param && param.type === 'parameter') {
      setSelectedLeafParam(param);
      // Close mobile menu when item is selected
      if (mobileOpened) {
        toggleMobile();
      }
    }
  }

  // Custom footer component for this view
  const PolicyParameterFooter = () => (
    <Group justify="space-between" align="center">
      <Button variant="default" onClick={onReturn}>
        Back
      </Button>
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
        <LegacyBanner />
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="gray.0">
        {loading || !parameterTree ? (
          <div>Loading parameters...</div>
        ) : (
          <Menu setSelectedParamLabel={handleMenuItemClick} parameterTree={parameterTree} />
        )}
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        {loading || !parameterTree ? (
          <MainEmpty />
        ) : selectedLeafParam ? (
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
