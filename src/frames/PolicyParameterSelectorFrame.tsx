import { useState } from 'react';
import { AppShell, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Header from '@/components/policyParameterSelectorFrame/Header';
import Main from '@/components/policyParameterSelectorFrame/Main';
import MainEmpty from '@/components/policyParameterSelectorFrame/MainEmpty';
import Menu from '@/components/policyParameterSelectorFrame/Menu';
import { mockParamMetadata } from '@/TEST_TO_DELETE/mockParamMetadata';
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

  function handleMenuItemClick(paramLabel: string) {
    const param: ParameterMetadata | null = mockParamMetadata.parameters[paramLabel] || null;
    if (param && param.type === 'parameter') {
      setSelectedLeafParam(param);
      // Close mobile menu when item is selected
      if (mobileOpened) toggleMobile();
    }
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened }
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

      <AppShell.Navbar p="md">
        <Menu setSelectedParamLabel={handleMenuItemClick} />
      </AppShell.Navbar>

      <AppShell.Main>
        {selectedLeafParam ? <Main param={selectedLeafParam} /> : <MainEmpty />}
      </AppShell.Main>

      <AppShell.Footer p="md">
        <Text fw={700}>TODO: Footer</Text>
      </AppShell.Footer>
    </AppShell>
  );
}
