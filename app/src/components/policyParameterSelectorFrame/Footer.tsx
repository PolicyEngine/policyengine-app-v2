import { IconChevronRight } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { Box, Button, Group, Text } from '@mantine/core';
import { colors } from '@/designTokens/colors';
import { selectActivePolicy } from '@/reducers/activeSelectors';
import { FlowComponentProps } from '@/types/flow';
import { countPolicyModifications } from '@/utils/countParameterChanges';

export default function PolicyParameterSelectorFooter({ onNavigate }: FlowComponentProps) {
  // Get the active policy to count modifications
  const activePolicy = useSelector(selectActivePolicy);
  const modificationCount = countPolicyModifications(activePolicy);

  function handleNext() {
    // Dispatch an action to move to the next step
    onNavigate('next');
  }

  return (
    <Group justify="space-between" align="center">
      <Button variant="default" disabled>
        Cancel
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
      <Button variant="filled" onClick={handleNext} rightSection={<IconChevronRight size={16} />}>
        Review my policy
      </Button>
    </Group>
  );
}
