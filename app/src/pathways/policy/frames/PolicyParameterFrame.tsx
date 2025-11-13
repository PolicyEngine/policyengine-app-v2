import { useState } from 'react';
import { useSelector } from 'react-redux';
import { IconChevronRight } from '@tabler/icons-react';
import { AppShell, Box, Button, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import MainEmpty from '@/components/policyParameterSelectorFrame/MainEmpty';
import Menu from '@/components/policyParameterSelectorFrame/Menu';
import HeaderNavigation from '@/components/shared/HomeHeader';
import LegacyBanner from '@/components/shared/LegacyBanner';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens';
import { RootState } from '@/store';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ParameterMain } from '@/components/policySetup';
import { PolicyState } from '../types';

interface PolicyParameterFrameProps {
  state: PolicyState;
  onStateChange: (newState: Partial<PolicyState>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

/**
 * PolicyParameterFrame renders its own custom AppShell.
 *
 * IMPORTANT: This frame has a custom AppShell with a parameter tree navbar
 * and footer showing parameter count. It differs from the standard app layout.
 *
 * Because PolicyPathwayWrapper is not rendered inside Layout (to avoid re-render
 * loops), this frame manages its own AppShell completely. The parent wrapper
 * detects when this frame is active and renders it directly without wrapping
 * it in another AppShell.
 */

export default function PolicyParameterFrame({
  state,
  onStateChange,
  onNext,
  onBack,
}: PolicyParameterFrameProps) {
  const [selectedLeafParam, setSelectedLeafParam] = useState<ParameterMetadata | null>(null);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();

  // Get metadata from Redux state (this is okay - metadata is global)
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

  // Handle adding a parameter interval - matches Redux reducer logic exactly
  const handleParameterAdd = (name: string, valueInterval: ValueInterval) => {
    console.log(`[PolicyParameterFrame] Adding parameter interval`, { name, valueInterval });

    // Find existing parameter or create new one
    const existingParamIndex = state.parameters.findIndex((p) => p.name === name);

    if (existingParamIndex >= 0) {
      // Update existing parameter using ValueIntervalCollection to handle overlaps
      const existingParam = state.parameters[existingParamIndex];
      const paramCollection = new ValueIntervalCollection(existingParam.values);
      paramCollection.addInterval(valueInterval);
      const newValues = paramCollection.getIntervals();

      const updatedParameters = [...state.parameters];
      updatedParameters[existingParamIndex] = {
        ...existingParam,
        values: newValues,
      };
      onStateChange({ parameters: updatedParameters });
      console.log(`[PolicyParameterFrame] Updated parameters`, updatedParameters);
    } else {
      // Create new parameter with ValueIntervalCollection
      const paramCollection = new ValueIntervalCollection([]);
      paramCollection.addInterval(valueInterval);
      const newValues = paramCollection.getIntervals();

      const newParameter = {
        name,
        values: newValues,
      };
      onStateChange({ parameters: [...state.parameters, newParameter] });
    }
  };

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
          <ParameterMain
            key={`${selectedLeafParam.parameter}-${state.parameters.length}-${JSON.stringify(state.parameters.find(p => p.name === selectedLeafParam.parameter)?.values || [])}`}
            param={selectedLeafParam}
            currentParameters={state.parameters}
            policyLabel={state.label}
            policyId={null}
            onParameterAdd={handleParameterAdd}
          />
        ) : (
          <MainEmpty />
        )}
      </AppShell.Main>

      <AppShell.Footer p="md">
        <Group justify="space-between" align="center">
          <Button variant="default" onClick={onBack}>
            Back
          </Button>
          {state.parameters.length > 0 && (
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
                {state.parameters.reduce((sum, p) => sum + p.values.length, 0)} parameter modification
                {state.parameters.reduce((sum, p) => sum + p.values.length, 0) !== 1 ? 's' : ''}
              </Text>
            </Group>
          )}
          <Button
            variant="filled"
            onClick={onNext}
            rightSection={<IconChevronRight size={16} />}
          >
            Review my policy
          </Button>
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
