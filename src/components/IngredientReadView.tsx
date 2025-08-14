import { 
  Box, 
  Button, 
  Loader, 
  Text, 
  Title, 
  TextInput, 
  Pill,
  Flex,
  Paper,
  Table,
  Checkbox
} from '@mantine/core';
import { IconSearch, IconFilter, IconCirclePlus } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import EmptyState from './common/EmptyState';
import { ColumnConfig, IngredientRecord, ColumnRenderer } from './columns';

// Main component props
interface IngredientReadViewProps {
  ingredient: string;
  title: string;
  subtitle?: string;
  onCreate: () => void;
  onBuild?: () => void;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  data: IngredientRecord[];
  columns: ColumnConfig[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: Array<{ label: string; value: string }>;
  onFilterRemove?: (filter: string) => void;
  onMoreFilters?: () => void;
  enableSelection?: boolean;
  isSelected?: (recordId: string) => boolean;
  onSelectionChange?: (recordId: string, selected: boolean) => void;
}

export default function IngredientReadView({
  ingredient,
  title,
  subtitle,
  onCreate,
  onBuild,
  isLoading,
  isError,
  error,
  data,
  columns,
  searchValue = "",
  onSearchChange,
  filters = [
    { label: "Most Recent", value: "most-recent" },
    { label: "Type", value: "type" }
  ],
  onFilterRemove,
  onMoreFilters,
  enableSelection = true,
  isSelected = () => false,
  onSelectionChange,
}: IngredientReadViewProps) {
  return (
    <Box>
      {/* Header Section */}
      <Box mb={spacing['2xl']}>
        <Flex justify="space-between" align="flex-start" mb={spacing.lg}>
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
            <Text 
              size="md" 
              c={colors.text.secondary}
              style={{ maxWidth: '600px' }}
            >
              {subtitle}
            </Text>
          </Box>
          
          {onBuild && (
            <Button
              rightSection={<IconCirclePlus size={16} />}
              onClick={onBuild}
              variant="filled"
            >
              Build {ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}
            </Button>
          )}
        </Flex>
      </Box>

      {/* Title and Filters Section */}
      <Box mb={spacing.xl}>
        <Title 
          order={2} 
          size="lg" 
          fw={typography.fontWeight.semibold}
          c={colors.text.title}
          mb={spacing.lg}
        >
          Your Saved {title}
        </Title>
        
        {/* Filters and Search */}
        <Flex gap={spacing.md} align="center" mb={spacing.lg}>
          {/* TODO: Future filters */}
          {/*}
          {filters.map((filter) => (
            <Pill 
              key={filter.value}
              withRemoveButton={!!onFilterRemove}
              onRemove={() => onFilterRemove?.(filter.value)}
              size="sm"
              style={{
                backgroundColor: colors.gray[100],
                color: colors.text.secondary,
                border: `1px solid ${colors.border.light}`,
              }}
            >
              {filter.label}
            </Pill>
          ))}
           */}
          
          <Button
            variant="outline"
            disabled
            leftSection={<IconFilter size={14} />}
            size="sm"
            onClick={onMoreFilters}
          >
            More filters
          </Button>
          
          {onSearchChange && (
            <Box style={{ marginLeft: 'auto', width: '300px' }}>
              <TextInput
                disabled
                placeholder="Search"
                leftSection={<IconSearch size={16} />}
                value={searchValue}
                onChange={(e) => onSearchChange(e.currentTarget.value)}
              />
            </Box>
          )}
        </Flex>
      </Box>

      {/* Content Section */}
      <Paper
        radius={spacing.radius.lg}
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
                          borderLeft: selected ? `3px solid ${colors.primary[500]}` : '3px solid transparent',
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

      {/* Pagination */}
      {!isLoading && !isError && data.length > 0 && (
        <Flex justify="space-between" align="center" mt={spacing.lg}>
          <Button variant="subtle" size="sm" disabled>
            Previous
          </Button>
          <Text size="sm" c={colors.text.secondary}>
            Page 1 of 1
          </Text>
          <Button variant="subtle" size="sm" disabled>
            Next
          </Button>
        </Flex>
      )}
    </Box>
  );
}
