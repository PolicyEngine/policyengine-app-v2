import { Button, Container, Grid, Stack, Text, Card } from '@mantine/core';

interface SimulationSetupViewProps {
  onPopulationSelect?: () => void;
  onPolicySelect: () => void;
  selectedPopulation?: string;
  selectedPolicy?: string;
  isPopulationDisabled?: boolean;
  onNext: () => void;
  canProceed: boolean;
}

export default function SimulationSetupView({
  onPopulationSelect,
  onPolicySelect,
  selectedPopulation,
  selectedPolicy,
  isPopulationDisabled = true,
  onNext,
  canProceed,
}: SimulationSetupViewProps) {
  return (
    <Container size="md" py="xl">
      <Stack>
        <Text size="lg" fw={700}>
          Set up your simulation
        </Text>
        
        <Grid>
          <Grid.Col span={6}>
            <Card withBorder p="md" h="100%">
              <Stack>
                <Text fw={600}>Population</Text>
                <Text size="sm" c="dimmed">
                  Select the population for your simulation
                </Text>
                <Button
                  variant={selectedPopulation ? "filled" : "outline"}
                  disabled={isPopulationDisabled}
                  onClick={onPopulationSelect}
                  fullWidth
                >
                  {selectedPopulation || "Select Population"}
                </Button>
                {isPopulationDisabled && (
                  <Text size="xs" c="dimmed">
                    Population selection coming soon
                  </Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={6}>
            <Card withBorder p="md" h="100%">
              <Stack>
                <Text fw={600}>Policy</Text>
                <Text size="sm" c="dimmed">
                  Select or create a policy for your simulation
                </Text>
                <Button
                  variant={selectedPolicy ? "filled" : "outline"}
                  onClick={onPolicySelect}
                  fullWidth
                >
                  {selectedPolicy || "Select Policy"}
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <Button variant="default" fullWidth>
              Cancel
            </Button>
          </Grid.Col>
          <Grid.Col span={6}>
            <Button 
              variant="filled" 
              fullWidth 
              disabled={!canProceed}
              onClick={onNext}
            >
              Continue
            </Button>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
