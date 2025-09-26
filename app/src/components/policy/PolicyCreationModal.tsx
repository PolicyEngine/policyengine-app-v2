import { useState } from 'react';
import { IconCode } from '@tabler/icons-react';
import { Box, Button, Divider, Group, Modal, Stack, Text, TextInput, Title } from '@mantine/core';

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
    <Modal
      opened={opened}
      onClose={handleCancel}
      centered
      size="sm"
      padding="xl"
      radius="md"
      withCloseButton={false}
      overlayProps={{
        backgroundOpacity: 0.36,
        blur: 2,
      }}
    >
      <Stack gap="lg">
        <Box>
          <Box
            style={{
              width: 32,
              height: 32,
              backgroundColor: 'rgba(179, 179, 179, 0.3)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <IconCode size={19} color="#666" />
          </Box>

          <Stack gap="xs">
            <Title order={3} fw={700} size="20px">
              Create a reform
            </Title>
            <Text size="sm" c="dimmed">
              Reform your baseline policy to model impact.
            </Text>
          </Stack>
        </Box>

        <Divider />

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

        <Group justify="flex-end" gap="xs" mt="md">
          <Button
            variant="outline"
            color="teal"
            onClick={handleCancel}
            styles={{
              root: {
                borderColor: '#319795',
                color: '#319795',
                '&:hover': {
                  backgroundColor: 'rgba(49, 151, 149, 0.05)',
                },
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="teal"
            onClick={handleSubmit}
            disabled={!policyName.trim()}
            styles={{
              root: {
                backgroundColor: '#319795',
                '&:hover': {
                  backgroundColor: '#2c8a88',
                },
                '&[data-disabled]': {
                  backgroundColor: 'rgba(49, 151, 149, 0.3)',
                  color: 'rgba(255, 255, 255, 0.6)',
                },
              },
            }}
          >
            Next
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
