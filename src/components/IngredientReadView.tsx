import { Box, Button, Group, Loader, Stack, Text, Title } from '@mantine/core';
import DataTable from '@/components/common/DataTable';
import EmptyState from './common/EmptyState';

interface IngredientReadViewProps<T> {
  title: string;
  onCreate: () => void;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  data: T[];
  columns: { key: keyof T; header: string }[];
}

export default function IngredientReadView<T>({
  title,
  onCreate,
  isLoading,
  isError,
  error,
  data,
  columns,
}: IngredientReadViewProps<T>) {

  return (
    <Box p="md">
      <Stack>
        {/* Header */}
        <Group>
          <Title order={2}>{title}</Title>
          <Button onClick={onCreate}>Create {title}</Button>
        </Group>

        {/* TODO: Future search/filter could go here; can use existing components from Mantine */}

        {/* Content */}
        {isLoading && <Loader />}
        {isError && (
          <Text color="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>
        )}
        {!isLoading && !isError && (
          <>
            {data.length === 0 ? (
              <EmptyState ingredient="Policy" />
            ) : (
              <DataTable data={data} columns={columns} />
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
