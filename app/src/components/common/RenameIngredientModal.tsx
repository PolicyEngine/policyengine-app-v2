import { useEffect, useState } from 'react';
import { Button, Grid, Modal, Stack, TextInput } from '@mantine/core';
import { spacing } from '@/designTokens';

interface RenameIngredientModalProps {
  opened: boolean;
  onClose: () => void;
  currentLabel: string;
  onRename: (newLabel: string) => void;
  isLoading?: boolean;
  ingredientType: 'report' | 'simulation' | 'policy' | 'household' | 'geography';
  /** Error message from a failed rename attempt (e.g., API error) */
  submissionError?: string | null;
}

export function RenameIngredientModal({
  opened,
  onClose,
  currentLabel,
  onRename,
  isLoading = false,
  ingredientType,
  submissionError = null,
}: RenameIngredientModalProps) {
  const [localLabel, setLocalLabel] = useState(currentLabel);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Combine validation and submission errors for display
  const displayError = validationError || submissionError;

  // Reset local state when modal opens with new current label
  useEffect(() => {
    if (opened) {
      setLocalLabel(currentLabel);
      setValidationError(null);
    }
  }, [opened, currentLabel]);

  const handleSubmit = () => {
    // Validation
    const trimmed = localLabel.trim();

    if (!trimmed) {
      setValidationError(`${capitalize(ingredientType)} name cannot be empty`);
      return;
    }

    if (trimmed.length > 100) {
      setValidationError(`${capitalize(ingredientType)} name must be 100 characters or less`);
      return;
    }

    if (trimmed === currentLabel) {
      // No change, just close
      onClose();
      return;
    }

    // Call the rename handler
    onRename(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<strong>Rename {ingredientType}</strong>}
      centered
    >
      <Stack gap={spacing.md}>
        <TextInput
          label={`${capitalize(ingredientType)} name`}
          placeholder={`Enter new ${ingredientType} name`}
          value={localLabel}
          onChange={(e) => {
            setLocalLabel(e.currentTarget.value);
            setValidationError(null); // Clear validation error on change
          }}
          onKeyDown={handleKeyDown}
          error={displayError}
          disabled={isLoading}
          data-autofocus
        />

        <Grid mt={spacing.md}>
          <Grid.Col span={6}>
            <Button onClick={onClose} variant="default" disabled={isLoading} fullWidth>
              Cancel
            </Button>
          </Grid.Col>
          <Grid.Col span={6}>
            <Button
              onClick={handleSubmit}
              variant="filled"
              loading={isLoading}
              disabled={!localLabel.trim()}
              fullWidth
            >
              Rename
            </Button>
          </Grid.Col>
        </Grid>
      </Stack>
    </Modal>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
