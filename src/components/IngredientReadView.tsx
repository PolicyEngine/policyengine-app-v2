import { ReactNode } from 'react';
import { Box, Button, Group, Loader, Stack, Text, Title } from '@mantine/core';
import DataTable from '@/components/common/DataTable';

interface IngredientReadViewProps<T> {
  title: string;
  onCreate: () => void;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  data: T[];
  columns: { key: keyof T; header: string }[];
  emptyComponent?: ReactNode; // Optional custom empty state
}

export default function IngredientReadView<T>({
  title,
  onCreate,
  isLoading,
  isError,
  error,
  data,
  columns,
  emptyComponent,
}: IngredientReadViewProps<T>) {
  return (
    <Box p="md">
      <Stack>
        {/* Header */}
        <Group>
          <Title order={2}>{title}</Title>
          <Button onClick={onCreate}>Create {title}</Button>
        </Group>

        {/* TODO: Future search/filter could go here */}

        {/* Content */}
        {isLoading && <Loader />}
        {isError && (
          <Text color="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>
        )}
        {!isLoading && !isError && (
          <>
            {data.length === 0 ? (
              emptyComponent || <Text>No {title.toLowerCase()} found.</Text>
            ) : (
              <DataTable data={data} columns={columns} />
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
