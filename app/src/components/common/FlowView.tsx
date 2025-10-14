import { Container, Divider, Stack, Text, Title } from '@mantine/core';
import {
  ButtonPanelVariant,
  CardListVariant,
  SetupConditionsVariant,
  type ButtonPanelCard,
  type CardListItem,
  type SetupConditionCard,
} from '@/components/flowView';
import { useCancelFlow } from '@/hooks/useCancelFlow';
import MultiButtonFooter, { ButtonConfig } from './MultiButtonFooter';

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

  // Pagination configuration for cardList variant
  itemsPerPage?: number; // Default: 5
  showPagination?: boolean; // Default: true (only shown if items > itemsPerPage)

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
    onClick?: () => void; // if not provided, must provide ingredientType
    ingredientType?: 'policy' | 'population' | 'simulation' | 'report'; // if provided, uses useCancelFlow
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
  itemsPerPage = 5,
  showPagination = true,
}: FlowViewProps) {
  // Use cancel flow hook if ingredientType is provided
  const { handleCancel } = cancelAction?.ingredientType
    ? useCancelFlow(cancelAction.ingredientType)
    : { handleCancel: undefined };

  // Determine cancel handler: explicit onClick takes priority, then hook, then no-op
  const cancelHandler =
    cancelAction?.onClick || handleCancel || (() => console.warn('Cancel action not configured'));

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
          onClick: cancelHandler,
        },
      ];
    }

    // Default behavior: cancel + primary (or just cancel if no primary action)
    const generatedButtons: ButtonConfig[] = [];

    // Always add cancel button unless explicitly disabled
    generatedButtons.push({
      label: cancelAction?.label || 'Cancel',
      variant: 'default',
      onClick: cancelHandler,
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
        return <SetupConditionsVariant cards={setupConditionCards} />;

      case 'buttonPanel':
        return <ButtonPanelVariant cards={buttonPanelCards} />;

      case 'cardList':
        return (
          <CardListVariant
            items={cardListItems}
            itemsPerPage={itemsPerPage}
            showPagination={showPagination}
          />
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
