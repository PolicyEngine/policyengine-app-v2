import { useState } from 'react';
import { useSelector } from 'react-redux';
import { AppShell, Button, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Main from '@/components/policyParameterSelectorFrame/Main';
import MainEmpty from '@/components/policyParameterSelectorFrame/MainEmpty';
import Menu from '@/components/policyParameterSelectorFrame/Menu';
import HeaderNavigation from '@/components/shared/HomeHeader';
import LegacyBanner from '@/components/shared/LegacyBanner';
import { CountryId } from '@/api/report';
import { spacing } from '@/designTokens';
import { RootState } from '@/store';
import { Parameter } from '@/types/subIngredients/parameter';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';

interface PolicyParameterFrameProps {
  parameters: Parameter[];
  countryId: CountryId;
  onParametersChange: (parameters: Parameter[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PolicyParameterFrame({
  parameters,
  countryId,
  onParametersChange,
  onNext,
  onBack,
}: PolicyParameterFrameProps) {
  const [selectedLeafParam, setSelectedLeafParam] = useState<ParameterMetadata | null>(null);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();

  // Get metadata from Redux state
  const { parameterTree, parameters: metadataParameters, loading, error } = useSelector(
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
    const param: ParameterMetadata | null = metadataParameters[paramLabel] || null;
    if (param && param.type === 'parameter') {
      setSelectedLeafParam(param);
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
        <Group justify="space-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext}>Next</Button>
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
