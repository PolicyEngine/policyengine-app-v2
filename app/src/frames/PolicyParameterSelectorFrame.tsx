import { useState } from 'react';
import { useSelector } from 'react-redux';
import { AppShell, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Header from '@/components/policyParameterSelectorFrame/Header';
import Main from '@/components/policyParameterSelectorFrame/Main';
import MainEmpty from '@/components/policyParameterSelectorFrame/MainEmpty';
import Menu from '@/components/policyParameterSelectorFrame/Menu';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { ParameterMetadata } from '@/types/parameterMetadata';

export default function PolicyParameterSelectorFrame({
  onNavigate,
  onReturn,
  flowConfig,
  isInSubflow,
  flowDepth,
}: FlowComponentProps) {
  const [selectedLeafParam, setSelectedLeafParam] = useState<ParameterMetadata | null>(null);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();

  // Get metadata from Redux state
  const { parameterTree, parameters, loading, error } = useSelector(
    (state: RootState) => state.metadata
  );

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
    // Use real parameters instead of mock data
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
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened },
      }}
      footer={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header p="md">
        <Header
          onNavigate={onNavigate}
          onReturn={onReturn}
          flowConfig={flowConfig}
          isInSubflow={isInSubflow}
          flowDepth={flowDepth}
        />
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="gray.0">
        {loading || !parameterTree ? (
          <div>Loading parameters...</div>
        ) : (
          <Menu setSelectedParamLabel={handleMenuItemClick} parameterTree={parameterTree} />
        )}
      </AppShell.Navbar>

      <AppShell.Main>
        {loading || !parameterTree ? (
          <MainEmpty />
        ) : selectedLeafParam ? (
          <Main param={selectedLeafParam} />
        ) : (
          <MainEmpty />
        )}
      </AppShell.Main>

      <AppShell.Footer p="md">
        <Text fw={700}>TODO: Footer</Text>
      </AppShell.Footer>
    </AppShell>
  );
}
