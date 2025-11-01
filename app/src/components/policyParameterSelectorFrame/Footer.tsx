import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Group, Text } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { colors } from '@/designTokens/colors';
import { selectActivePolicy, selectCurrentPosition } from '@/reducers/activeSelectors';
import { clearPolicyAtPosition } from '@/reducers/policyReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { countPolicyModifications } from '@/utils/countParameterChanges';

export default function PolicyParameterSelectorFooter({
  onNavigate,
  onReturn,
}: FlowComponentProps) {
  const dispatch = useDispatch();

  // Get the current position from the cross-cutting selector
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));

  // Get the active policy to count modifications
  const activePolicy = useSelector(selectActivePolicy);
  const modificationCount = countPolicyModifications(activePolicy);

  function handleNext() {
    // Dispatch an action to move to the next step
    onNavigate('next');
  }

  function handleCancel() {
    // Clear policy at current position and return to the previous step
    dispatch(clearPolicyAtPosition(currentPosition));
    onReturn();
  }

  return (
    <Group justify="space-between" align="center">
      <Button variant="default" onClick={handleCancel}>
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
