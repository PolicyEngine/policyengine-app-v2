/**
 * Mockups Index
 *
 * Central access point for all mockup components
 */

import { Container, Stack, Title, Text, Button, Group } from '@mantine/core';
import { useState } from 'react';
import HouseholdBuilderMockup1 from './HouseholdBuilderMockup1';
import HouseholdBuilderMockup2 from './HouseholdBuilderMockup2';
import HouseholdBuilderMockup3 from './HouseholdBuilderMockup3';

type MockupType = 'home' | 'mockup1' | 'mockup2' | 'mockup3';

export default function MockupsIndex() {
  const [currentView, setCurrentView] = useState<MockupType>('home');

  if (currentView === 'mockup1') {
    return (
      <div>
        <Button onClick={() => setCurrentView('home')} mb="md" size="sm" variant="subtle">
          ← Back to Mockups
        </Button>
        <HouseholdBuilderMockup1 />
      </div>
    );
  }

  if (currentView === 'mockup2') {
    return (
      <div>
        <Button onClick={() => setCurrentView('home')} mb="md" size="sm" variant="subtle">
          ← Back to Mockups
        </Button>
        <HouseholdBuilderMockup2 />
      </div>
    );
  }

  if (currentView === 'mockup3') {
    return (
      <div>
        <Button onClick={() => setCurrentView('home')} mb="md" size="sm" variant="subtle">
          ← Back to Mockups
        </Button>
        <HouseholdBuilderMockup3 />
      </div>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={1}>Household Builder Mockups</Title>
          <Text c="dimmed">
            Visual mockups with sample data for quick demos without full wiring
          </Text>
        </Stack>

        <Stack gap="md">
          <Stack gap="xs">
            <Button onClick={() => setCurrentView('mockup1')} size="sm" variant="light">
              Mockup 1: Current Design
            </Button>
            <Text size="sm" c="dimmed">
              Current implementation with advanced settings collapsed at bottom
            </Text>
          </Stack>

          <Stack gap="xs">
            <Button onClick={() => setCurrentView('mockup2')} size="sm" variant="light">
              Mockup 2: Inline Variables (All Members)
            </Button>
            <Text size="sm" c="dimmed">
              Add custom variables to all household members at once
            </Text>
          </Stack>

          <Stack gap="xs">
            <Button onClick={() => setCurrentView('mockup3')} size="sm" variant="light">
              Mockup 3: Individual Variable Assignment
            </Button>
            <Text size="sm" c="dimmed">
              Add custom variables to individual members separately with per-person links
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
