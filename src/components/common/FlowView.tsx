import { Box, Card, Container, Divider, Loader, Stack, Text, Title } from '@mantine/core';
import MultiButtonFooter, { ButtonConfig } from './MultiButtonFooter';
import DataTable from './DataTable';
import EmptyState from './EmptyState';

interface FlowViewProps<T = any> {
  title: string;
  subtitle?: string;
  variant?: 'form' | 'list' | 'selection' | 'custom';
  
  // Button configuration - the key improvement
  buttons: ButtonConfig[];
  
  // Content props for different variants
  content?: React.ReactNode;
  
  // List variant props
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  data?: T[];
  columns?: { key: keyof T; header: string }[];
  
  // Selection variant props
  selectionCards?: {
    title: string;
    description: string;
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
  isLoading,
  isError,
  error,
  data,
  columns,
  selectionCards,
}: FlowViewProps<T>) {
  const renderContent = () => {
    switch (variant) {
      case 'list':
        return (
          <>
            {isLoading && <Loader />}
            {isError && (
              <Text color="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>
            )}
            {!isLoading && !isError && data && (
              <>
                {data.length === 0 ? (
                  <EmptyState ingredient="Item" />
                ) : (
                  <DataTable data={data} columns={columns || []} />
                )}
              </>
            )}
          </>
        );
      
      case 'selection':
        return (
          <Stack>
            {selectionCards?.map((card, index) => (
              <Card
                key={index}
                withBorder
                p="md"
                mb="md"
                component="button"
                onClick={card.onClick}
                disabled={card.isDisabled}
                bg={card.isSelected ? 'lightblue' : undefined}
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
      
      case 'custom':
        return content;
      
      case 'form':
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

  // For list variant, use Box instead of Container for better layout
  if (variant === 'list') {
    return <Box p="md">{containerContent}</Box>;
  }

  return <Container variant="guttered">{containerContent}</Container>;
}

export type { FlowViewProps, ButtonConfig };


