import { Card, Container, Divider, Stack, Text, Title } from '@mantine/core';
import { spacing } from '@/designTokens';
import MultiButtonFooter, { ButtonConfig } from './MultiButtonFooter';

interface SelectionCard {
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
  variant?: 'selection' | 'cardList';

  // Content props for different variants
  content?: React.ReactNode;

  // Selection variant props
  selectionCards?: SelectionCard[];

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
  selectionCards,
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
      case 'selection':
        return (
          <Stack>
            {selectionCards?.map((card: SelectionCard, index: number) => (
              <Card
                key={index}
                withBorder
                component="button"
                onClick={card.onClick}
                disabled={card.isDisabled}
                variant={card.isSelected ? 'selection--active' : 'selection--inactive'}
              >
                <Text fw={700}>TODO: ICON</Text>
                <Text>{card.title}</Text>
                <Text size="sm" c="dimmed">
                  {card.description}
                </Text>
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
