import { useEffect, useState } from 'react';
import { Button, Grid, Modal, Stack, TextInput } from '@mantine/core';
import { spacing } from '@/designTokens';

interface ReportRenameModalProps {
  opened: boolean;
  onClose: () => void;
  currentLabel: string;
  onRename: (newLabel: string) => void;
  isLoading?: boolean;
}

export function ReportRenameModal({
  opened,
  onClose,
  currentLabel,
  onRename,
  isLoading = false,
}: ReportRenameModalProps) {
  const [localLabel, setLocalLabel] = useState(currentLabel);
  const [error, setError] = useState<string | null>(null);

  // Reset local state when modal opens with new current label
  useEffect(() => {
    if (opened) {
      setLocalLabel(currentLabel);
      setError(null);
    }
  }, [opened, currentLabel]);

  const handleSubmit = () => {
    // Validation
    const trimmed = localLabel.trim();

    if (!trimmed) {
      setError('Report name cannot be empty');
      return;
    }

    if (trimmed.length > 100) {
      setError('Report name must be 100 characters or less');
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
    <Modal opened={opened} onClose={onClose} title={<strong>Rename report</strong>} centered>
      <Stack gap={spacing.md}>
        <TextInput
          label="Report name"
          placeholder="Enter new report name"
          value={localLabel}
          onChange={(e) => {
            setLocalLabel(e.currentTarget.value);
            setError(null); // Clear error on change
          }}
          onKeyDown={handleKeyDown}
          error={error}
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
