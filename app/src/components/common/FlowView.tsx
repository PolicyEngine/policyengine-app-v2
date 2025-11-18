import { Container, Divider, Stack, Text, Title } from '@mantine/core';
import {
  ButtonPanelVariant,
  CardListVariant,
  SetupConditionsVariant,
  type ButtonPanelCard,
  type CardListItem,
  type SetupConditionCard,
} from '@/components/flowView';
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
    onClick?: () => void;
  };

  backAction?: {
    label?: string; // defaults to "Back"
    onClick: () => void;
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
  backAction,
  buttonPreset,
  content,
  setupConditionCards,
  buttonPanelCards,
  cardListItems,
  itemsPerPage = 5,
  showPagination = true,
}: FlowViewProps) {
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

  // Build footer props based on configuration
  const getFooterProps = () => {
    if (buttonPreset === 'none') {
      return { buttons: [] as ButtonConfig[] };
    }

    // Use new layout if any of the new action props are provided
    const useNewLayout = cancelAction?.onClick || backAction || primaryAction;
    if (useNewLayout) {
      return {
        buttons: [] as ButtonConfig[],
        cancelAction: cancelAction?.onClick ? {
          label: cancelAction.label || 'Cancel',
          onClick: cancelAction.onClick,
        } : undefined,
        backAction: backAction ? {
          label: backAction.label || 'Back',
          onClick: backAction.onClick,
        } : undefined,
        primaryAction: primaryAction ? {
          label: primaryAction.label,
          onClick: primaryAction.onClick,
          isLoading: primaryAction.isLoading,
          isDisabled: primaryAction.isDisabled,
        } : undefined,
      };
    }

    // Legacy button array support
    if (buttons) {
      return { buttons };
    }

    // Generate legacy buttons from convenience props
    const generatedButtons: ButtonConfig[] = [];

    if (buttonPreset === 'cancel-only') {
      generatedButtons.push({
        label: cancelAction?.label || 'Cancel',
        variant: 'disabled',
        onClick: () => {},
      });
      return { buttons: generatedButtons };
    }

    return { buttons: generatedButtons };
  };

  const footerProps = getFooterProps();
  const hasFooter = footerProps.buttons?.length > 0 ||
    footerProps.cancelAction ||
    footerProps.backAction ||
    footerProps.primaryAction;

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

      {hasFooter && <MultiButtonFooter {...footerProps} />}
    </>
  );

  return <Container variant="guttered">{containerContent}</Container>;
}

export type { FlowViewProps, ButtonConfig };
