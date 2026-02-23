/**
 * PolicyParameterSelectorView - View for selecting policy parameters
 * Duplicated from PolicyParameterSelectorFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { IconChevronRight, IconChevronUp } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { AppShell, Box, Button, Drawer, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import HeaderNavigation from '@/components/shared/HomeHeader';
import { spacing } from '@/designTokens';
import { colors } from '@/designTokens/colors';
import { useIsMobile } from '@/hooks/useChartDimensions';
import { RootState } from '@/store';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
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
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure();
  const isMobile = useIsMobile();

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
      closeMobile();
    }
  }

  const footerHeight = parseInt(spacing.appShell.footer.height, 10);

  return (
    <AppShell
      layout="default"
      padding="md"
      header={{ height: parseInt(spacing.appShell.header.height, 10) }}
      navbar={{
        width: parseInt(spacing.appShell.navbar.width, 10),
        breakpoint: spacing.appShell.navbar.breakpoint,
        collapsed: { mobile: true },
      }}
      footer={{ height: isMobile ? 0 : footerHeight }}
    >
      <AppShell.Header p={0}>
        <HeaderNavigation />
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="gray.0">
        {loading || !parameterTree ? (
          <div>Loading parameters...</div>
        ) : (
          <Menu setSelectedParamLabel={handleMenuItemClick} parameterTree={parameterTree} />
        )}
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0" style={isMobile ? { paddingBottom: footerHeight } : undefined}>
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

      {/* Desktop footer */}
      {!isMobile && (
        <AppShell.Footer p="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
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
                  {modificationCount} parameter modification
                  {modificationCount !== 1 ? 's' : ''}
                </Text>
              </Group>
            )}
            <Button variant="filled" onClick={onNext} rightSection={<IconChevronRight size={16} />}>
              Review my policy
            </Button>
          </Group>
        </AppShell.Footer>
      )}

      {/* Mobile bottom bar */}
      {isMobile && (
        <Box
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: spacing.md,
            backgroundColor: 'white',
            borderTop: `1px solid ${colors.border.light}`,
            zIndex: 200,
          }}
        >
          <Group justify="space-between" align="center" gap="sm" wrap="nowrap">
            <Button
              variant="default"
              size="sm"
              onClick={toggleMobile}
              leftSection={
                <IconChevronUp
                  size={16}
                  style={{
                    transform: mobileOpened ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 150ms ease',
                  }}
                />
              }
            >
              Parameters
              {modificationCount > 0 && (
                <Box
                  component="span"
                  ml={6}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: colors.primary[600],
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {modificationCount}
                </Box>
              )}
            </Button>
            <Group gap="sm" wrap="nowrap">
              {onBack && (
                <Button variant="default" size="sm" onClick={onBack}>
                  Back
                </Button>
              )}
              <Button
                variant="filled"
                size="sm"
                onClick={onNext}
                rightSection={<IconChevronRight size={16} />}
              >
                Review
              </Button>
            </Group>
          </Group>
        </Box>
      )}

      {/* Mobile bottom drawer for parameter tree */}
      {isMobile && (
        <Drawer
          opened={mobileOpened}
          onClose={closeMobile}
          position="bottom"
          size="70%"
          title="Select parameters"
          zIndex={300}
        >
          {loading || !parameterTree ? (
            <div>Loading parameters...</div>
          ) : (
            <Menu setSelectedParamLabel={handleMenuItemClick} parameterTree={parameterTree} />
          )}
        </Drawer>
      )}
    </AppShell>
  );
}
