import { ReactNode } from 'react';
import { Modal, Stack, Box, Title, Text, Group, Button, Transition } from '@mantine/core';
import { modalDesign } from '@/styles/modalDesign';

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
  iconColor = modalDesign.colors.secondary,
  children,
  size = 'md',
  footer,
  hideFooter = false,
  primaryButton,
  secondaryButton,
}: BaseModalProps) {
  const defaultSecondaryButton = secondaryButton || {
    label: 'Cancel',
    onClick: onClose,
    variant: 'subtle' as const,
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size={size}
      padding={0}
      radius={modalDesign.radius.outer}
      withCloseButton={false}
      transitionProps={{
        duration: modalDesign.animation.duration,
        transition: 'scale',
      }}
      overlayProps={{
        backgroundOpacity: 0.45,
        blur: 3,
      }}
      styles={{
        body: { padding: 0 },
        content: {
          overflow: 'hidden',
          boxShadow: modalDesign.shadow,
        },
      }}
    >
      <Transition
        mounted={opened}
        transition="fade"
        duration={modalDesign.animation.duration}
        timingFunction="ease"
      >
        {(styles) => (
          <Stack gap={0} style={styles}>
            {/* Header */}
            {(title || description || icon) && (
              <Box
                p={modalDesign.spacing.header}
                style={{
                  borderBottom: `1px solid ${modalDesign.colors.border}`,
                }}
              >
                <Stack gap="sm">
                  {icon && (
                    <Box
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: modalDesign.colors.iconBackground,
                        borderRadius: modalDesign.radius.inner,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: iconColor,
                      }}
                    >
                      {icon}
                    </Box>
                  )}
                  {(title || description) && (
                    <Stack gap={6}>
                      <Title order={3} fw={600} size="h3" lh={1.3}>
                        {title}
                      </Title>
                      {description && (
                        <Text size="sm" c="dimmed" lh={1.5}>
                          {description}
                        </Text>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Box>
            )}

            {/* Content */}
            <Box
              style={{
                flex: 1,
                padding: modalDesign.spacing.content,
                minHeight: 100,
              }}
            >
              {children}
            </Box>

            {/* Footer */}
            {!hideFooter && (footer || primaryButton || secondaryButton) && (
              <Box
                p={`${modalDesign.spacing.footer}px ${modalDesign.spacing.header}px`}
                style={{
                  borderTop: `1px solid ${modalDesign.colors.border}`,
                  backgroundColor: modalDesign.colors.divider,
                }}
              >
                <Group justify="flex-end" gap="sm">
                  {footer || (
                    <>
                      <Button
                        variant={defaultSecondaryButton.variant}
                        color="gray"
                        onClick={defaultSecondaryButton.onClick}
                        radius={modalDesign.radius.button}
                        styles={{
                          root: {
                            transition: 'all 150ms ease',
                          },
                        }}
                      >
                        {defaultSecondaryButton.label}
                      </Button>
                      {primaryButton && (
                        <Button
                          variant="filled"
                          onClick={primaryButton.onClick}
                          disabled={primaryButton.disabled}
                          loading={primaryButton.loading}
                          radius={modalDesign.radius.button}
                          styles={{
                            root: {
                              backgroundColor: modalDesign.colors.primary,
                              transition: 'all 150ms ease',
                              '&:hover': {
                                backgroundColor: modalDesign.colors.primaryHover,
                                transform: 'translateY(-1px)',
                              },
                              '&:active': {
                                transform: 'translateY(0)',
                              },
                              '&[data-disabled]': {
                                backgroundColor: 'rgba(49, 151, 149, 0.3)',
                                color: 'rgba(255, 255, 255, 0.7)',
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
              </Box>
            )}
          </Stack>
        )}
      </Transition>
    </Modal>
  );
}