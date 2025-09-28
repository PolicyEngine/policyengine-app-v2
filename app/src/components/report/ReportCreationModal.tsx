import { useState } from 'react';
import { TextInput, Stack } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import BaseModal from '@/components/shared/BaseModal';

interface ReportCreationModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: { label: string; description?: string }) => void;
  isLoading?: boolean;
}

export default function ReportCreationModal({
  opened,
  onClose,
  onSubmit,
  isLoading = false,
}: ReportCreationModalProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onSubmit({
      label: label.trim(),
      description: description.trim() || undefined,
    });

    // Reset form
    setLabel('');
    setDescription('');
  };

  const handleClose = () => {
    // Reset form when closing
    setLabel('');
    setDescription('');
    onClose();
  };

  return (
    <BaseModal
      opened={opened}
      onClose={handleClose}
      title="Create a report"
      description="Generate analysis reports from your simulation results."
      icon={<IconFileText size={19} color="#666" />}
      size="sm"
      primaryButton={{
        label: 'Create',
        onClick: handleSubmit,
        disabled: !label.trim(),
        loading: isLoading,
      }}
    >
      <Stack gap="md">
        <TextInput
          label="Report title"
          placeholder="Report name"
          value={label}
          onChange={(event) => setLabel(event.currentTarget.value)}
          required
          data-autofocus
          styles={{
            label: {
              fontSize: 14,
              fontWeight: 500,
              color: '#344054',
            },
            input: {
              fontSize: 16,
              '&::placeholder': {
                color: '#667085',
              },
            },
          }}
        />
        <TextInput
          label="Description (optional)"
          placeholder="Describe what this report will contain"
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          styles={{
            label: {
              fontSize: 14,
              fontWeight: 500,
              color: '#344054',
            },
            input: {
              fontSize: 14,
              '&::placeholder': {
                color: '#667085',
              },
            },
          }}
        />
      </Stack>
    </BaseModal>
  );
}