import { useState, useEffect } from 'react';
import { Modal, TextInput, Button, Group, Stack } from '@mantine/core';

interface ReportRenameModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  currentName: string;
  isLoading?: boolean;
}

export default function ReportRenameModal({
  opened,
  onClose,
  onSubmit,
  currentName,
  isLoading = false,
}: ReportRenameModalProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== currentName) {
      onSubmit(trimmedName);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Rename report"
      size="sm"
      centered
    >
      <Stack>
        <TextInput
          label="Report name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter report name"
          data-autofocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isLoading}
            disabled={!name.trim() || name.trim() === currentName}
          >
            Rename
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}