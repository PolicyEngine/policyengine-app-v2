/**
 * PolicyParameterSelectorView - View for selecting policy parameters
 * Duplicated from PolicyParameterSelectorFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { AppShell, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Footer from '@/components/policyParameterSelectorFrame/Footer';
import Main from '@/components/policyParameterSelectorFrame/Main';
import MainEmpty from '@/components/policyParameterSelectorFrame/MainEmpty';
import Menu from '@/components/policyParameterSelectorFrame/Menu';
import HeaderNavigation from '@/components/shared/HomeHeader';
import LegacyBanner from '@/components/shared/LegacyBanner';
import { spacing } from '@/designTokens';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ParameterTreeNode } from '@/types/metadata/parameterMetadata';

interface PolicyParameterSelectorViewProps {
  parameterTree: ParameterTreeNode | null;
  parameters: Record<string, ParameterMetadata>;
  loading: boolean;
  error: string | null;
  onNext: () => void;
  onReturn: () => void;
}

export default function PolicyParameterSelectorView({
  parameterTree,
  parameters,
  loading,
  error,
  onNext,
  onReturn,
}: PolicyParameterSelectorViewProps) {
  const [selectedLeafParam, setSelectedLeafParam] = useState<ParameterMetadata | null>(null);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();

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
          <Main key={selectedLeafParam.parameter} param={selectedLeafParam} />
        ) : (
          <MainEmpty />
        )}
      </AppShell.Main>

      <AppShell.Footer p="md">
        <Footer
          onNavigate={onNext}
          onReturn={onReturn}
          flowConfig={null}
          isInSubflow={true}
          flowDepth={3}
        />
      </AppShell.Footer>
    </AppShell>
  );
}
