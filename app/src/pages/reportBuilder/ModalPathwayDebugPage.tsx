import { useState } from 'react';
import { Button, Group, Stack, Text, Title } from '@/components/ui';
import { CURRENT_YEAR } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import {
  HouseholdCreationModal,
  PolicyBrowseModal,
  PolicyCreationModal,
  PopulationBrowseModal,
} from './modals';

export default function ModalPathwayDebugPage() {
  const [policyBrowseOpen, setPolicyBrowseOpen] = useState(false);
  const [policyStandaloneOpen, setPolicyStandaloneOpen] = useState(false);
  const [populationBrowseOpen, setPopulationBrowseOpen] = useState(false);
  const [householdStandaloneOpen, setHouseholdStandaloneOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  return (
    <>
      <Stack gap="lg">
        <div>
          <Title
            order={1}
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.title,
              marginBottom: spacing.sm,
            }}
          >
            Modal pathway debug
          </Title>
          <Text size="md" style={{ color: colors.text.secondary, maxWidth: 720 }}>
            This page exposes the four modal pathways we have been discussing so you can inspect
            them directly.
          </Text>
        </div>

        <Group wrap="wrap" gap="md">
          <Button variant="outline" onClick={() => setPolicyBrowseOpen(true)}>
            Policy browse modal
          </Button>
          <Button variant="outline" onClick={() => setPolicyStandaloneOpen(true)}>
            Policy standalone modal
          </Button>
          <Button variant="outline" onClick={() => setPopulationBrowseOpen(true)}>
            Population browse modal
          </Button>
          <Button variant="outline" onClick={() => setHouseholdStandaloneOpen(true)}>
            Household standalone modal
          </Button>
        </Group>

        {lastAction && (
          <Text size="sm" style={{ color: colors.text.secondary }}>
            Last action: {lastAction}
          </Text>
        )}
      </Stack>

      <PolicyBrowseModal
        isOpen={policyBrowseOpen}
        onClose={() => setPolicyBrowseOpen(false)}
        onSelect={(policy) => {
          setLastAction(`Selected policy: ${policy.label || policy.id || 'Unnamed policy'}`);
          setPolicyBrowseOpen(false);
        }}
        reportYear={CURRENT_YEAR}
      />

      <PolicyCreationModal
        isOpen={policyStandaloneOpen}
        onClose={() => setPolicyStandaloneOpen(false)}
        onBack={() => {
          setPolicyStandaloneOpen(false);
          setPolicyBrowseOpen(true);
        }}
        onPolicyCreated={(policy) => {
          setLastAction(
            `Created or updated policy: ${policy.label || policy.id || 'Unnamed policy'}`
          );
          setPolicyStandaloneOpen(false);
        }}
        simulationIndex={0}
        reportYear={CURRENT_YEAR}
      />

      <PopulationBrowseModal
        isOpen={populationBrowseOpen}
        onClose={() => setPopulationBrowseOpen(false)}
        onSelect={(population) => {
          setLastAction(
            `Selected population: ${population.label || population.household?.id || population.geography?.name || 'Unnamed population'}`
          );
          setPopulationBrowseOpen(false);
        }}
        reportYear={CURRENT_YEAR}
        onCreateNew={() => {
          setPopulationBrowseOpen(false);
          setHouseholdStandaloneOpen(true);
        }}
      />

      <HouseholdCreationModal
        isOpen={householdStandaloneOpen}
        onClose={() => setHouseholdStandaloneOpen(false)}
        onBack={() => {
          setHouseholdStandaloneOpen(false);
          setPopulationBrowseOpen(true);
        }}
        onHouseholdSaved={(population) => {
          setLastAction(
            `Created or updated household: ${population.label || population.household?.id || 'Unnamed household'}`
          );
          setHouseholdStandaloneOpen(false);
        }}
        reportYear={CURRENT_YEAR}
      />
    </>
  );
}
