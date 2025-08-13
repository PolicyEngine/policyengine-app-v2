import { Card, Container, Divider, Stack, Text, Title } from '@mantine/core';
import MultiButtonFooter, { ButtonConfig } from './MultiButtonFooter';
import { spacing } from '@/designTokens';

interface FlowViewProps<T = any> {
  title: string;
  subtitle?: string;
  variant?: 'form' | 'selection' | 'cardList' | 'custom';
  
  // Button configuration - the key improvement
  buttons: ButtonConfig[];
  
  // Content props for different variants
  content?: React.ReactNode;
  
  // Selection variant props
  selectionCards?: {
    title: string;
    description: string;
    onClick: () => void;
    isSelected?: boolean;
    isDisabled?: boolean;
  }[];

  // Card list variant props
  cardListItems?: {
    title: string;
    subtitle?: string;
    onClick: () => void;
    isSelected?: boolean;
    isDisabled?: boolean;
  }[];
}

export default function FlowView<T>({
  title,
  subtitle,
  variant = 'form',
  buttons,
  content,
  selectionCards,
  cardListItems,
}: FlowViewProps<T>) {
  const renderContent = () => {
    switch (variant) {
      case 'selection':
        return (
          <Stack>
            {selectionCards?.map((card, index) => (
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
            {cardListItems?.map((item, index) => (
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
                    <Text size="sm" c="dimmed">{item.subtitle}</Text>
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
      <Title order={2} variant="colored">{title}</Title>
      {subtitle && <Text c="dimmed" mb="sm">{subtitle}</Text>}
      <Divider my="sm" />
      
      <Stack gap="md" pb="lg">
        {renderContent()}
      </Stack>
      
      <MultiButtonFooter buttons={buttons} />
    </>
  );

  return <Container variant="guttered">{containerContent}</Container>;
}

export type { FlowViewProps, ButtonConfig };


