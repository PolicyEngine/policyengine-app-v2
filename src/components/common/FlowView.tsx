import { Card, Container, Divider, Stack, Text, Title, Group } from '@mantine/core';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';
import { spacing } from '@/designTokens';
import MultiButtonFooter, { ButtonConfig } from './MultiButtonFooter';

interface SetupConditionCard {
  title: string;
  description: string;
  onClick: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
  isFulfilled?: boolean; // New property to track if the condition is satisfied
}

interface ButtonPanelCard {
  title: string;
  description: string;
  onClick: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
}

interface CardListItem {
  title: string;
  subtitle?: string;
  onClick: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
}

interface FlowViewProps {
  title: string;
  subtitle?: string;
  variant?: 'setupConditions' | 'buttonPanel' | 'cardList';

  // Content props for different variants
  content?: React.ReactNode;

  // Setup conditions variant props
  setupConditionCards?: SetupConditionCard[];

  // Button panel variant props
  buttonPanelCards?: ButtonPanelCard[];

  // Card list variant props
  cardListItems?: CardListItem[];

  // Button configuration - can use explicit buttons or convenience props
  buttons?: ButtonConfig[];

  // Convenience props for common button patterns (only used if buttons is undefined)
  primaryAction?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
    isDisabled?: boolean;
  };

  cancelAction?: {
    label?: string; // defaults to "Cancel"
    onClick?: () => void; // defaults to console.log placeholder
  };

  // Preset configurations
  buttonPreset?: 'cancel-only' | 'cancel-primary' | 'none';
}

export default function FlowView({
  title,
  subtitle,
  variant,
  buttons,
  primaryAction,
  cancelAction,
  buttonPreset,
  content,
  setupConditionCards,
  buttonPanelCards,
  cardListItems,
}: FlowViewProps) {
  // Generate buttons from convenience props if explicit buttons not provided
  function getButtons(): ButtonConfig[] {
    // If explicit buttons provided, use them
    if (buttons) {
      return buttons;
    }

    // Handle preset configurations
    if (buttonPreset === 'none') {
      return [];
    }

    if (buttonPreset === 'cancel-only') {
      return [
        {
          label: cancelAction?.label || 'Cancel',
          variant: 'default',
          onClick: cancelAction?.onClick || (() => console.log('Cancel clicked')),
        },
      ];
    }

    // Default behavior: cancel + primary (or just cancel if no primary action)
    const generatedButtons: ButtonConfig[] = [];

    // Always add cancel button unless explicitly disabled
    generatedButtons.push({
      label: cancelAction?.label || 'Cancel',
      variant: 'default',
      onClick: cancelAction?.onClick || (() => console.log('Cancel clicked')),
    });

    // Add primary action if provided
    if (primaryAction) {
      generatedButtons.push({
        label: primaryAction.label,
        variant: primaryAction.isDisabled ? 'disabled' : 'filled',
        onClick: primaryAction.onClick,
        isLoading: primaryAction.isLoading,
      });
    }

    return generatedButtons;
  }

  const finalButtons = getButtons();

  const renderContent = () => {
    switch (variant) {
      case 'setupConditions':
        return (
          <Stack>
            {setupConditionCards?.map((card: SetupConditionCard, index: number) => (
              <Card
                key={index}
                withBorder
                component="button"
                onClick={card.onClick}
                disabled={card.isDisabled}
                variant={
                  card.isSelected
                    ? 'setupCondition--active'
                    : card.isFulfilled
                    ? 'setupCondition--fulfilled'
                    : 'setupCondition--unfulfilled'
                }
              >
                <Group gap={spacing.sm} align="center">
                  {card.isFulfilled && (
                    <IconCheck
                      size={20}
                      style={{ 
                        color: 'var(--mantine-color-primary-6)',
                        marginTop: '2px',
                        flexShrink: 0
                      }}
                    />
                  )}
                  <Stack gap={spacing.xs} style={{ flex: 1 }}>
                    <Text fw={700}>{card.title}</Text>
                    <Text size="sm" c="dimmed">
                      {card.description}
                    </Text>
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>
        );

      case 'buttonPanel':
        return (
          <Stack>
            {buttonPanelCards?.map((card: ButtonPanelCard, index: number) => (
              <Card
                key={index}
                withBorder
                component="button"
                onClick={card.onClick}
                disabled={card.isDisabled}
                variant={card.isSelected ? 'buttonPanel--active' : 'buttonPanel--inactive'}
              >
                <Group justify="space-between" align="center">
                  <Stack gap={spacing.xs} style={{ flex: 1 }}>
                    <Text fw={700}>{card.title}</Text>
                    <Text size="sm" c="dimmed">
                      {card.description}
                    </Text>
                  </Stack>
                  <IconChevronRight
                    size={20}
                    style={{ 
                      color: 'var(--mantine-color-gray-6)',
                      marginTop: '2px',
                      flexShrink: 0
                    }}
                  />
                </Group>
              </Card>
            ))}
          </Stack>
        );

      case 'cardList':
        return (
          <Stack gap={spacing.sm}>
            {cardListItems?.map((item: CardListItem, index: number) => (
              <Card
                key={index}
                withBorder
                component="button"
                onClick={item.onClick}
                disabled={item.isDisabled}
                variant={item.isSelected ? 'cardList--active' : 'cardList--inactive'}
              >
                <Stack gap={spacing.xs}>
                  <Text fw={600}>{item.title}</Text>
                  {item.subtitle && (
                    <Text size="sm" c="dimmed">
                      {item.subtitle}
                    </Text>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        );

      default:
        return content;
    }
  };

  const containerContent = (
    <>
      <Title order={2} variant="colored">
        {title}
      </Title>
      {subtitle && (
        <Text c="dimmed" mb="sm">
          {subtitle}
        </Text>
      )}
      <Divider my="sm" />

      <Stack gap="md" pb="lg">
        {renderContent()}
      </Stack>

      {finalButtons.length > 0 && <MultiButtonFooter buttons={finalButtons} />}
    </>
  );

  return <Container variant="guttered">{containerContent}</Container>;
}

export type { FlowViewProps, ButtonConfig };
