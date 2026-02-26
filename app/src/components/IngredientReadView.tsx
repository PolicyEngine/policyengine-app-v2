import { IconPlus } from '@tabler/icons-react';
import { Box, Button, Checkbox, Flex, Loader, Paper, Table, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { ColumnConfig, ColumnRenderer, IngredientRecord } from './columns';
import EmptyState from './common/EmptyState';

// Main component props
interface IngredientReadViewProps {
  ingredient: string;
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  onBuild?: () => void;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  data: IngredientRecord[];
  columns: ColumnConfig[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onMoreFilters?: () => void;
  enableSelection?: boolean;
  isSelected?: (recordId: string) => boolean;
  onSelectionChange?: (recordId: string, selected: boolean) => void;
}

export default function IngredientReadView({
  ingredient,
  title,
  subtitle,
  buttonLabel,
  onBuild,
  isLoading,
  isError,
  error,
  data,
  columns,
  searchValue: _searchValue = '',
  onSearchChange: _onSearchChange,
  onMoreFilters: _onMoreFilters,
  enableSelection = true,
  isSelected = () => false,
  onSelectionChange,
}: IngredientReadViewProps) {
  return (
    <Box>
      {/* Header Section */}
      <Box mb={spacing['2xl']}>
        <Flex
          justify="space-between"
          align="flex-start"
          mb={spacing.lg}
          direction={{ base: 'column', sm: 'row' }}
          gap={spacing.md}
        >
          <Box>
            <Title
              order={1}
              size="2xl"
              fw={typography.fontWeight.semibold}
              c={colors.text.title}
              mb={spacing.sm}
            >
              {title}
            </Title>
            <Text size="md" c={colors.text.secondary} style={{ maxWidth: '600px' }}>
              {subtitle}
            </Text>
          </Box>

          {onBuild && (
            <Button rightSection={<IconPlus size={16} />} onClick={onBuild} variant="filled">
              {buttonLabel || `New ${ingredient.toLowerCase()}`}
            </Button>
          )}
        </Flex>
      </Box>

      {/* Title Section */}
      <Box mb={spacing.xl}>
        <Title
          order={2}
          size="lg"
          fw={typography.fontWeight.semibold}
          c={colors.text.title}
          mb={spacing.lg}
        >
          {title}
        </Title>
      </Box>

      {/* Content Section */}
      <Paper
        radius={spacing.radius.container}
        style={{
          border: `1px solid ${colors.border.light}`,
          overflow: 'hidden',
        }}
      >
        {isLoading && (
          <Box p={spacing['3xl']} ta="center">
            <Loader />
          </Box>
        )}

        {isError && (
          <Box p={spacing['3xl']}>
            <Text c="red" ta="center">
              Error: {(error as Error)?.message || 'Something went wrong.'}
            </Text>
          </Box>
        )}

        {!isLoading && !isError && (
          <>
            {data.length === 0 ? (
              <Box p={spacing['3xl']}>
                <EmptyState ingredient={ingredient} />
              </Box>
            ) : (
              <Table>
                <Table.Thead style={{ backgroundColor: colors.gray[50] }}>
                  <Table.Tr>
                    {enableSelection && (
                      <Table.Th
                        style={{
                          width: '48px',
                          padding: `${spacing.md} ${spacing.lg}`,
                        }}
                      >
                        {/* Optional: Add "select all" checkbox here in the future */}
                      </Table.Th>
                    )}
                    {columns.map((column) => (
                      <Table.Th
                        key={column.key}
                        style={{
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.medium,
                          color: colors.text.secondary,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          padding: `${spacing.md} ${spacing.lg}`,
                        }}
                      >
                        {column.header}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.map((record) => {
                    const selected = isSelected(record.id);
                    return (
                      <Table.Tr
                        key={record.id}
                        style={{
                          backgroundColor: selected ? colors.blue[50] : 'transparent',
                          borderLeft: selected
                            ? `3px solid ${colors.primary[500]}`
                            : '3px solid transparent',
                          cursor: enableSelection ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          if (enableSelection && onSelectionChange) {
                            onSelectionChange(record.id, !selected);
                          }
                        }}
                      >
                        {enableSelection && (
                          <Table.Td style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                            <Checkbox
                              checked={selected}
                              onChange={(event) => {
                                event.stopPropagation();
                                if (onSelectionChange) {
                                  onSelectionChange(record.id, event.currentTarget.checked);
                                }
                              }}
                              size="sm"
                            />
                          </Table.Td>
                        )}
                        {columns.map((column) => (
                          <Table.Td
                            key={column.key}
                            style={{ padding: `${spacing.md} ${spacing.lg}` }}
                          >
                            <ColumnRenderer config={column} record={record} />
                          </Table.Td>
                        ))}
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}
