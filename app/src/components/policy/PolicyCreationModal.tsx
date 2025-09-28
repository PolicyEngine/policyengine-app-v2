import { useState } from 'react';
import { IconCode } from '@tabler/icons-react';
import { TextInput } from '@mantine/core';
import BaseModal from '@/components/shared/BaseModal';

interface PolicyCreationModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (policyName: string) => void;
}

export default function PolicyCreationModal({
  opened,
  onClose,
  onSubmit,
}: PolicyCreationModalProps) {
  const [policyName, setPolicyName] = useState('');

  const handleSubmit = () => {
    if (policyName.trim()) {
      onSubmit(policyName);
      setPolicyName('');
    }
  };

  const handleCancel = () => {
    setPolicyName('');
    onClose();
  };

  return (
    <BaseModal
      opened={opened}
      onClose={handleCancel}
      title="Create a reform"
      description="Reform your baseline policy to model impact."
      icon={<IconCode size={19} color="#666" />}
      primaryButton={{
        label: 'Next',
        onClick: handleSubmit,
        disabled: !policyName.trim(),
      }}
      secondaryButton={{
        label: 'Cancel',
        onClick: handleCancel,
      }}
    >
      <TextInput
        label="Reform title"
        placeholder="Policy name"
        value={policyName}
        onChange={(event) => setPolicyName(event.currentTarget.value)}
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
    </BaseModal>
  );
}
