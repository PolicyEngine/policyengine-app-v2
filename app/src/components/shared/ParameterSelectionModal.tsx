import { ReactNode } from 'react';
import { Modal, Stack, Box, Group, Button, Text, Badge } from '@mantine/core';

interface ParameterSelectionModalProps {
  opened: boolean;
  onClose: () => void;
  onNext?: () => void;
  onCancel?: () => void;
  title?: string;
  baseline?: string;
  children: ReactNode;
  nextDisabled?: boolean;
}

export default function ParameterSelectionModal({
  opened,
  onClose,
  onNext,
  onCancel,
  title = 'Reform policy #0001',
  baseline = 'Baseline: Current law',
  children,
  nextDisabled = false,
}: ParameterSelectionModalProps) {
  const handleCancel = () => {
    if (onCancel) onCancel();
    else onClose();
  };

  const handleNext = () => {
    if (onNext) onNext();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="90%"
      padding={0}
      radius="lg"
      withCloseButton={false}
      centered
      overlayProps={{
        backgroundOpacity: 0.36,
        blur: 2,
      }}
      styles={{
        body: { padding: 0, height: '85vh', display: 'flex', flexDirection: 'column' },
        content: { borderRadius: '12px', overflow: 'hidden' }
      }}
    >
      <Stack gap={0} h="100%">
        {/* Top Navigation Bar */}
        <Box
          style={{
            borderBottom: '1px solid var(--mantine-color-gray-2)',
            backgroundColor: 'white',
            padding: '20px 24px',
            minHeight: '72px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Group justify="space-between" align="center" style={{ width: '100%' }}>
            <Button
              variant="subtle"
              color="gray"
              onClick={handleCancel}
              styles={{
                root: {
                  color: 'var(--mantine-color-gray-7)',
                  '&:hover': {
                    backgroundColor: 'var(--mantine-color-gray-0)',
                  },
                },
              }}
            >
              Cancel
            </Button>

            <Stack gap={2} align="center">
              <Text size="md" fw={600}>
                {title}
              </Text>
              <Text size="xs" c="dimmed">
                {baseline}
              </Text>
            </Stack>

            <Button
                onClick={handleNext}
                disabled={nextDisabled}
                styles={{
                  root: {
                    backgroundColor: nextDisabled ? 'var(--mantine-color-gray-3)' : '#319795',
                    color: nextDisabled ? 'var(--mantine-color-gray-5)' : 'white',
                    '&:hover': {
                      backgroundColor: nextDisabled ? 'var(--mantine-color-gray-3)' : '#2c8a88',
                    },
                    '&[data-disabled]': {
                      backgroundColor: 'var(--mantine-color-gray-3)',
                      color: 'var(--mantine-color-gray-5)',
                      cursor: 'not-allowed',
                    },
                  },
                }}
              >
                Next
              </Button>
          </Group>
        </Box>

        {/* Main Content */}
        <Box style={{ flex: 1, overflow: 'hidden' }}>
          {children}
        </Box>
      </Stack>
    </Modal>
  );
}