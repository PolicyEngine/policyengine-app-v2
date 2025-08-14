import { 
  Box, 
  Button, 
  Loader, 
  Text, 
  Title, 
  TextInput, 
  Pill,
  Menu,
  ActionIcon,
  Flex,
  Paper,
  Table,
  Anchor,
  Badge,
  Group,
  Stack,
  Checkbox
} from '@mantine/core';
import { IconSearch, IconFilter, IconDots, IconCirclePlus } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import EmptyState from './common/EmptyState';

// Column type definitions
export interface BaseColumnConfig {
  key: string;
  header: string;
  type: string; // TODO: Define these as an enum
}

export interface TextColumnConfig extends BaseColumnConfig {
  type: 'text';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
}

export interface LinkColumnConfig extends BaseColumnConfig {
  type: 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
  urlPrefix?: string;
}

export interface BulletsColumnConfig extends BaseColumnConfig {
  type: 'bullets';
  items: Array<{
    textKey: string;
    badgeKey?: string;
    badgeColor?: string;
  }>;
}

export interface MenuColumnConfig extends BaseColumnConfig {
  type: 'menu';
  actions: Array<{
    label: string;
    action: string;
    color?: string;
  }>;
  onAction: (action: string, recordId: string) => void;
}

export type ColumnConfig = 
  | TextColumnConfig 
  | LinkColumnConfig 
  | BulletsColumnConfig 
  | MenuColumnConfig;

// Data value types
export interface TextValue {
  text: string;
}

export interface LinkValue {
  text: string;
  url?: string;
}

export interface BulletValue {
  text: string;
  badge?: string | number;
}

export interface BulletsValue {
  items: BulletValue[];
}

export type ColumnValue = TextValue | LinkValue | BulletsValue | null;

// Record interface
export interface IngredientRecord {
  id: string;
  [key: string]: ColumnValue | string;
}

// Column display components
function TextColumn({ config, value }: { config: TextColumnConfig; value: TextValue }) {
  return (
    <Text 
      size={config.size || 'sm'} 
      fw={typography.fontWeight[config.weight || 'normal']}
      c={config.color || colors.text.primary}
    >
      {value.text}
    </Text>
  );
}

function LinkColumn({ config, value }: { config: LinkColumnConfig; value: LinkValue }) {
  return (
    <Anchor 
      size={config.size || 'sm'} 
      c={config.color || colors.blue[600]}
      href={value.url || `${config.urlPrefix || '#'}${value.text}`}
      td="none"
    >
      {value.text}
    </Anchor>
  );
}

function BulletsColumn({ config, value }: { config: BulletsColumnConfig; value: BulletsValue }) {
  return (
    <Stack gap={spacing.xs}>
      {value.items.map((item, idx) => (
        <Group key={idx} gap={spacing.xs}>
          <Text size="xs" c={colors.text.secondary}>•</Text>
          <Text size="xs" c={colors.text.secondary}>{item.text}</Text>
          {item.badge && (
            <Badge 
              size="xs" 
              variant="light" 
              color="gray"
              radius={spacing.radius.sm}
            >
              {typeof item.badge === 'number' ? `+${item.badge}` : item.badge}
            </Badge>
          )}
        </Group>
      ))}
    </Stack>
  );
}

function MenuColumn({ config, record }: { config: MenuColumnConfig; record: IngredientRecord }) {
  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray">
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {config.actions.map((action) => (
          <Menu.Item 
            key={action.action}
            color={action.color}
            onClick={() => config.onAction(action.action, record.id)}
          >
            {action.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

// Column renderer component
function ColumnRenderer({ config, record }: { 
  config: ColumnConfig; 
  record: IngredientRecord;
}) {
  const value = record[config.key] as ColumnValue;

  if (!value && config.type !== 'menu') {
    return <Text size="sm" c={colors.text.secondary}>—</Text>;
  }

  switch (config.type) {
    case 'text':
      return <TextColumn config={config as TextColumnConfig} value={value as TextValue} />;
    
    case 'link':
      return <LinkColumn config={config as LinkColumnConfig} value={value as LinkValue} />;
    
    case 'bullets':
      return <BulletsColumn config={config as BulletsColumnConfig} value={value as BulletsValue} />;
    
    case 'menu':
      return <MenuColumn config={config as MenuColumnConfig} record={record} />;
    
    default:
      return <Text size="sm">{String(value)}</Text>;
  }
}

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
  subtitle = `Build and save ${ingredient} scenarios for quick access when creating impact reports. Pre-configured ${ingredient}s accelerate report generation by up to X%`,
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
