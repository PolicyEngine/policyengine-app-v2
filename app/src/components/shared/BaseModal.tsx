import { ReactNode } from 'react';
import { Modal, Stack, Box, Title, Text, Divider, Group, Button } from '@mantine/core';

interface BaseModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  iconColor?: string;
  children: ReactNode;
  size?: string | number;
  footer?: ReactNode;
  hideFooter?: boolean;
  primaryButton?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryButton?: {
    label: string;
    onClick: () => void;
    variant?: 'outline' | 'subtle' | 'filled';
  };
}

export default function BaseModal({
  opened,
  onClose,
  title,
  description,
  icon,
  iconColor = '#666',
  children,
  size = 'sm',
  footer,
  hideFooter = false,
  primaryButton,
  secondaryButton,
}: BaseModalProps) {
  const defaultSecondaryButton = secondaryButton || {
    label: 'Cancel',
    onClick: onClose,
    variant: 'outline' as const,
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size={size}
      padding="xl"
      radius="md"
      withCloseButton={false}
      overlayProps={{
        backgroundOpacity: 0.36,
        blur: 2,
      }}
    >
      <Stack gap="md">
        {icon && (
          <Box
            style={{
              width: 32,
              height: 32,
              backgroundColor: 'rgba(179, 179, 179, 0.3)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        )}

        {(title || description) && (
          <Stack gap={4}>
            <Title order={3} fw={700} size="20px">
              {title}
            </Title>
            {description && (
              <Text size="sm" c="dimmed">
                {description}
              </Text>
            )}
          </Stack>
        )}

        {(icon || title || description) && <Divider />}

        {children}

        {!hideFooter && (footer || primaryButton || secondaryButton) && (
          <Group justify="flex-end" gap="xs" mt="md">
            {footer || (
              <>
                <Button
                  variant={defaultSecondaryButton.variant}
                  color="teal"
                  onClick={defaultSecondaryButton.onClick}
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
                  {defaultSecondaryButton.label}
                </Button>
                {primaryButton && (
                  <Button
                    variant="filled"
                    color="teal"
                    onClick={primaryButton.onClick}
                    disabled={primaryButton.disabled}
                    loading={primaryButton.loading}
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
                    {primaryButton.label}
                  </Button>
                )}
              </>
            )}
          </Group>
        )}
      </Stack>
    </Modal>
  );
}