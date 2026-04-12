import { IconPlus } from '@tabler/icons-react';
import {
  Button,
  Spinner,
  ShadcnTable as Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Title,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { ColumnConfig, ColumnRenderer, IngredientRecord } from './columns';
import EmptyState from './common/EmptyState';

// Main component props
interface IngredientReadViewProps {
  ingredient: string;
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  emptyState?: React.ReactNode;
  onBuild?: () => void;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  data: IngredientRecord[];
  columns: ColumnConfig[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onMoreFilters?: () => void;
}

export default function IngredientReadView({
  ingredient,
  title,
  subtitle,
  buttonLabel,
  emptyState,
  onBuild,
  isLoading,
  isError,
  error,
  data,
  columns,
  searchValue: _searchValue = '',
  onSearchChange: _onSearchChange,
  onMoreFilters: _onMoreFilters,
}: IngredientReadViewProps) {
  return (
    <div>
      {/* Header Section */}
      <div style={{ marginBottom: spacing['2xl'] }}>
        <div
          className="tw:flex tw:flex-col tw:sm:flex-row tw:justify-between tw:items-start"
          style={{ marginBottom: spacing.lg, gap: spacing.md }}
        >
          <div>
            <Title
              order={1}
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.title,
                marginBottom: spacing.sm,
              }}
            >
              {title}
            </Title>
            <Text size="md" style={{ color: colors.text.secondary, maxWidth: '600px' }}>
              {subtitle}
            </Text>
          </div>

          {onBuild && (
            <Button onClick={onBuild}>
              {buttonLabel || `New ${ingredient.toLowerCase()}`}
              <IconPlus size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div
        style={{
          borderRadius: spacing.radius.container,
          border: `1px solid ${colors.border.light}`,
          overflow: 'hidden',
        }}
      >
        {isLoading && (
          <div className="tw:flex tw:justify-center" style={{ padding: spacing['3xl'] }}>
            <Spinner />
          </div>
        )}

        {isError && (
          <div style={{ padding: spacing['3xl'] }}>
            <Text style={{ color: colors.error, textAlign: 'center' }}>
              Error: {(error as Error)?.message || 'Something went wrong.'}
            </Text>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {data.length === 0 ? (
              <div style={{ padding: spacing['3xl'] }}>
                {emptyState || <EmptyState ingredient={ingredient} />}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: colors.gray[50] }}>
                    {columns.map((column) => (
                      <TableHead
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
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((record) => (
                    <TableRow key={record.id}>
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          style={{ padding: `${spacing.md} ${spacing.lg}` }}
                        >
                          <ColumnRenderer config={column} record={record} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
