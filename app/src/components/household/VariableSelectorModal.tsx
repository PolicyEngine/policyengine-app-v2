/**
 * VariableSelectorModal - Modal-based variable selection
 *
 * Alternative to inline search. Opens a modal with search and categorized
 * browsing, allowing users to select multiple variables at once.
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Accordion,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import {
  getInputVariables,
  groupVariablesNested,
  NestedCategory,
  VariableInfo,
} from '@/utils/VariableResolver';

export interface VariableSelectorModalProps {
  opened: boolean;
  onClose: () => void;
  metadata: any;
  selectedVariables: string[];
  onSelect: (variableNames: string[]) => void;
}

export default function VariableSelectorModal({
  opened,
  onClose,
  metadata,
  selectedVariables,
  onSelect,
}: VariableSelectorModalProps) {
  const [searchValue, setSearchValue] = useState('');
  const [tempSelection, setTempSelection] = useState<string[]>(selectedVariables);

  // Reset temp selection when modal opens
  useEffect(() => {
    if (opened) {
      setTempSelection(selectedVariables);
      setSearchValue('');
    }
  }, [opened, selectedVariables]);

  // Get all input variables and group into nested categories
  const allInputVariables = useMemo(() => getInputVariables(metadata), [metadata]);
  const nestedCategories = useMemo(
    () => groupVariablesNested(allInputVariables),
    [allInputVariables]
  );

  // Filter variables based on search
  const filteredVariables = useMemo(() => {
    if (!searchValue.trim()) return null;
    const search = searchValue.toLowerCase();
    return allInputVariables.filter(
      (v) =>
        v.label.toLowerCase().includes(search) || v.name.toLowerCase().includes(search)
    );
  }, [allInputVariables, searchValue]);

  // Toggle variable selection
  const toggleVariable = (variableName: string) => {
    setTempSelection((prev) =>
      prev.includes(variableName)
        ? prev.filter((v) => v !== variableName)
        : [...prev, variableName]
    );
  };

  // Handle confirm
  const handleConfirm = () => {
    onSelect(tempSelection);
    onClose();
  };

  // Render variable checkbox
  const renderVariableCheckbox = (variable: VariableInfo) => (
    <Checkbox
      key={variable.name}
      label={variable.label}
      checked={tempSelection.includes(variable.name)}
      onChange={() => toggleVariable(variable.name)}
    />
  );

  // Count variables in a nested category
  const countVariablesInCategory = (category: NestedCategory): number => {
    let count = category.variables.length;
    for (const sub of Object.values(category.subcategories)) {
      count += countVariablesInCategory(sub);
    }
    return count;
  };

  // Count selected variables in a nested category
  const countSelectedInCategory = (category: NestedCategory): number => {
    let count = category.variables.filter((v) => tempSelection.includes(v.name)).length;
    for (const sub of Object.values(category.subcategories)) {
      count += countSelectedInCategory(sub);
    }
    return count;
  };

  // Render nested category
  const renderNestedCategory = (category: NestedCategory, depth: number = 0) => {
    const hasSubcategories = Object.keys(category.subcategories).length > 0;
    const hasVariables = category.variables.length > 0;
    const totalCount = countVariablesInCategory(category);
    const selectedCount = countSelectedInCategory(category);

    return (
      <Accordion.Item key={category.name} value={`${depth}-${category.name}`}>
        <Accordion.Control>
          <Group justify="space-between">
            <Text size="sm">{category.name}</Text>
            <Text size="xs" c="dimmed">
              {selectedCount}/{totalCount}
            </Text>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="xs">
            {/* Direct variables in this category */}
            {hasVariables && category.variables.slice(0, 20).map(renderVariableCheckbox)}
            {hasVariables && category.variables.length > 20 && (
              <Text size="xs" c="dimmed">
                + {category.variables.length - 20} more
              </Text>
            )}

            {/* Nested subcategories */}
            {hasSubcategories && (
              <Accordion variant="separated" multiple>
                {Object.values(category.subcategories).map((sub) =>
                  renderNestedCategory(sub, depth + 1)
                )}
              </Accordion>
            )}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    );
  };

  const newSelectionCount = tempSelection.filter((v) => !selectedVariables.includes(v)).length;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add Variables"
      size="lg"
    >
      <Stack gap="md">
        {/* Search bar */}
        <TextInput
          placeholder="Search variables..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
        />

        {/* Results */}
        <Box style={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredVariables ? (
            // Search results
            <Stack gap="xs">
              {filteredVariables.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No variables found
                </Text>
              ) : (
                filteredVariables.map(renderVariableCheckbox)
              )}
            </Stack>
          ) : (
            // Nested categorized browser
            <Accordion variant="separated" multiple>
              {Object.values(nestedCategories).map((category) =>
                renderNestedCategory(category)
              )}
            </Accordion>
          )}
        </Box>

        {/* Actions */}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Add Selected {newSelectionCount > 0 && `(${newSelectionCount})`}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
