import { useState } from 'react';
import { IconChevronLeft, IconChevronRight, IconSearch } from '@tabler/icons-react';
import { Button, Checkbox, Grid, Group, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import APIMetadataCard from './APIMetadataCard';

const MAX_ROWS = 3;
const MAX_COLS = 4;
const CARDS_PER_PAGE = MAX_ROWS * MAX_COLS;

interface ParameterMetadata {
  type: 'parameter';
  parameter: string;
  label?: string;
  description?: string;
  unit?: string;
  period?: string | null;
  economy?: boolean;
  household?: boolean;
  values?: Record<string, number>;
}

interface VariableMetadata {
  name: string;
  label?: string;
  description?: string;
  entity?: string;
  definitionPeriod?: string;
  unit?: string;
  category?: string;
  defaultValue?: number;
  isInputVariable?: boolean;
  valueType?: string;
}

interface Metadata {
  variables: Record<string, VariableMetadata>;
  parameters: Record<string, ParameterMetadata>;
}

interface VariableParameterExplorerProps {
  metadata: Metadata;
}

export default function VariableParameterExplorer({ metadata }: VariableParameterExplorerProps) {
  const [query, setQuery] = useState('');
  const [showAbolitions, setShowAbolitions] = useState(false);
  const [page, setPage] = useState(0);

  // Convert metadata to card array
  const variableCards: VariableMetadata[] = Object.values(metadata.variables || {});
  const parameterCards: ParameterMetadata[] = Object.values(metadata.parameters || {});

  // Filter and sort
  const filterByQuery = (item: ParameterMetadata | VariableMetadata) => {
    const label = item.label || '';
    const pythonName = 'type' in item ? item.parameter : item.name;

    // Hide abolitions unless checkbox checked
    if (!showAbolitions && pythonName?.startsWith('gov.abolitions')) {
      return false;
    }

    // Filter by search query
    if (query) {
      const normalizedQuery = query.replaceAll(' ', '').toLowerCase();
      const normalizedLabel = label.replaceAll(' ', '').toLowerCase();
      return (
        normalizedLabel.includes(normalizedQuery) ||
        pythonName?.toLowerCase().includes(query.toLowerCase())
      );
    }

    return true;
  };

  const allCards = [...parameterCards, ...variableCards].filter(filterByQuery).sort((a, b) => {
    const labelA = (a.label || ('name' in a ? a.name : '')).toLowerCase();
    const labelB = (b.label || ('name' in b ? b.name : '')).toLowerCase();
    return labelA.localeCompare(labelB);
  });

  const totalPages = Math.ceil(allCards.length / CARDS_PER_PAGE);
  const startIdx = page * CARDS_PER_PAGE;
  const endIdx = startIdx + CARDS_PER_PAGE;
  const currentCards = allCards.slice(startIdx, endIdx);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(0); // Reset to first page on new search
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      setPage(value - 1); // Convert from 1-indexed to 0-indexed
    }
  };

  return (
    <Stack gap={spacing.lg} mt={spacing.lg}>
      {/* Search and Filter Controls */}
      <Group gap={spacing.md} align="flex-end">
        <TextInput
          placeholder="Search by label or Python name..."
          value={query}
          onChange={(e) => handleQueryChange(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1 }}
        />
        <Tooltip label="Parameters that abolish existing policy rules. Usually hidden for clarity.">
          <Checkbox
            label="Show abolition parameters"
            checked={showAbolitions}
            onChange={(e) => {
              setShowAbolitions(e.currentTarget.checked);
              setPage(0);
            }}
          />
        </Tooltip>
      </Group>

      {/* Cards Grid */}
      <Grid gutter={spacing.md}>
        {currentCards.map((card, idx) => (
          <Grid.Col key={idx} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <APIMetadataCard metadata={card} />
          </Grid.Col>
        ))}
      </Grid>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Group justify="center" gap={spacing.md} mt={spacing.md}>
          <Button
            variant="subtle"
            leftSection={<IconChevronLeft size={16} />}
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            Previous
          </Button>

          <Group gap={spacing.xs} align="center">
            <Text size="sm">Page</Text>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page + 1}
              onChange={handlePageInputChange}
              style={{
                width: '50px',
                textAlign: 'center',
                padding: `${spacing.xs} ${spacing.sm}`,
                border: `1px solid ${colors.gray[300]}`,
                borderRadius: spacing.radius.sm,
                fontSize: typography.fontSize.sm,
              }}
            />
            <Text size="sm">of {totalPages}</Text>
          </Group>

          <Button
            variant="subtle"
            rightSection={<IconChevronRight size={16} />}
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </Group>
      )}

      {/* Results Count */}
      <Text ta="center" size="sm" style={{ color: colors.text.secondary }}>
        Showing {currentCards.length} of {allCards.length} results
      </Text>
    </Stack>
  );
}
