/**
 * AdvancedSettings - Collapsible section for custom variable selection
 *
 * Provides both search and categorized browsing for variable selection.
 * Selected variables appear inline with entity-aware inputs.
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Accordion,
  ActionIcon,
  Box,
  Group,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import { IconInfoCircle, IconSearch, IconX } from '@tabler/icons-react';
import { Household } from '@/types/ingredients/Household';
import {
  addVariable,
  getEntityInstances,
  getInputVariables,
  removeVariable,
  resolveEntity,
} from '@/utils/VariableResolver';
import VariableInput from './VariableInput';

export interface AdvancedSettingsProps {
  household: Household;
  metadata: any;
  year: string;
  onChange: (household: Household) => void;
  disabled?: boolean;
}

export default function AdvancedSettings({
  household,
  metadata,
  year,
  onChange,
  disabled = false,
}: AdvancedSettingsProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Click outside to close dropdown
  const dropdownRef = useClickOutside(() => setIsDropdownOpen(false));

  // Get all input variables
  const allInputVariables = useMemo(() => getInputVariables(metadata), [metadata]);

  // Sync selected variables when household structure changes (e.g., marital status, children)
  // This ensures new entity instances get the variable data
  // Track people keys as string to detect when household members change
  const peopleKeys = Object.keys(household.householdData.people || {}).sort().join(',');
  const prevPeopleKeysRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedVariables.length === 0) {
      prevPeopleKeysRef.current = peopleKeys;
      return;
    }

    // Always check for missing variables when we have selected variables
    let updatedHousehold = household;
    let needsUpdate = false;

    for (const variableName of selectedVariables) {
      const entityInfo = resolveEntity(variableName, metadata);
      if (!entityInfo) continue;

      // For person-level variables, check if any person is missing the variable
      if (entityInfo.isPerson) {
        const people = Object.keys(updatedHousehold.householdData.people || {});
        let anyMissing = false;

        for (const personName of people) {
          const personData = updatedHousehold.householdData.people[personName];
          if (personData && !personData[variableName]) {
            anyMissing = true;
            break;
          }
        }

        if (anyMissing) {
          // addVariable adds to ALL instances of the entity type
          updatedHousehold = addVariable(updatedHousehold, variableName, metadata, year);
          needsUpdate = true;
        }
      }
    }

    prevPeopleKeysRef.current = peopleKeys;

    if (needsUpdate) {
      onChange(updatedHousehold);
    }
  }, [peopleKeys, selectedVariables, metadata, year, onChange, household]);

  // Filter variables based on search - show all if empty, filter as user types
  const filteredVariables = useMemo(() => {
    if (!searchValue.trim()) {
      return allInputVariables.slice(0, 50); // Show first 50 when empty
    }
    const search = searchValue.toLowerCase();
    return allInputVariables
      .filter(
        (v) =>
          v.label.toLowerCase().includes(search) ||
          v.name.toLowerCase().includes(search)
      )
      .slice(0, 50); // Limit results
  }, [allInputVariables, searchValue]);

  // Handle variable selection
  const handleSelectVariable = (variableName: string) => {
    if (selectedVariables.includes(variableName)) return;

    // Add variable to household with default value
    const newHousehold = addVariable(household, variableName, metadata, year);
    onChange(newHousehold);
    setSelectedVariables([...selectedVariables, variableName]);
    setSearchValue('');
    setIsDropdownOpen(false);
  };

  // Handle variable removal
  const handleRemoveVariable = (variableName: string) => {
    const newHousehold = removeVariable(household, variableName, metadata);
    onChange(newHousehold);
    setSelectedVariables(selectedVariables.filter((v) => v !== variableName));
  };

  // Render inputs for a selected variable
  const renderVariableInputs = (variableName: string) => {
    const variable = allInputVariables.find((v) => v.name === variableName);
    if (!variable) return null;

    const entityInfo = resolveEntity(variableName, metadata);
    if (!entityInfo) return null;

    // Get entity instances
    const instances = getEntityInstances(household, entityInfo.plural);

    return (
      <Box key={variableName} mb="md">
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            <Text size="sm" fw={500}>
              {variable.label}
            </Text>
            <Tooltip
              label={variable.documentation || 'No description available'}
              multiline
              maw={300}
            >
              <ActionIcon size="xs" variant="subtle" color="gray">
                <IconInfoCircle size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Tooltip label="Remove variable">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={() => handleRemoveVariable(variableName)}
              disabled={disabled}
            >
              <IconX size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {entityInfo.isPerson ? (
          // Person-level: render input for each person
          <Stack gap="xs">
            {instances.map((personName) => (
              <Group key={personName} gap="xs">
                <Text size="sm" c="dimmed" style={{ minWidth: 100 }}>
                  {personName}
                </Text>
                <Box style={{ flex: 1 }}>
                  <VariableInput
                    variable={{ ...variable, label: variable.valueType === 'bool' ? variable.label : '' }}
                    household={household}
                    metadata={metadata}
                    year={year}
                    entityName={personName}
                    onChange={onChange}
                    disabled={disabled}
                  />
                </Box>
              </Group>
            ))}
          </Stack>
        ) : (
          // Non-person: single input
          <VariableInput
            variable={{ ...variable, label: variable.valueType === 'bool' ? variable.label : '' }}
            household={household}
            metadata={metadata}
            year={year}
            onChange={onChange}
            disabled={disabled}
          />
        )}
      </Box>
    );
  };

  return (
    <Stack gap="md">
      <Text fw={500} size="sm" c="dimmed">
        Advanced Settings
      </Text>
      <Accordion variant="separated" defaultValue="advanced">
        <Accordion.Item value="advanced">
          <Accordion.Control>
            <Text size="sm">Add Custom Variables</Text>
          </Accordion.Control>
          <Accordion.Panel>
          <Stack gap="md">
            {/* All selected variables - stacked above search */}
            {selectedVariables.length > 0 && (
              <Stack gap="md">
                {selectedVariables.map((varName) => renderVariableInputs(varName))}
              </Stack>
            )}

            {/* Search bar - always at bottom */}
            <Box pos="relative" ref={dropdownRef}>
              <TextInput
                placeholder="Search for a variable..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.currentTarget.value)}
                onFocus={() => setIsDropdownOpen(true)}
                leftSection={<IconSearch size={16} />}
                disabled={disabled}
              />

              {/* Dropdown list - only visible when focused */}
              {isDropdownOpen && (
                <Box
                  pos="absolute"
                  top="100%"
                  left={0}
                  right={0}
                  style={{
                    zIndex: 100,
                    backgroundColor: 'var(--mantine-color-body)',
                    border: '1px solid var(--mantine-color-default-border)',
                    borderRadius: 'var(--mantine-radius-sm)',
                    boxShadow: 'var(--mantine-shadow-md)',
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  {filteredVariables.map((variable) => {
                    const content = (
                      <Box
                        p="xs"
                        style={{
                          cursor: selectedVariables.includes(variable.name) ? 'default' : 'pointer',
                          backgroundColor: selectedVariables.includes(variable.name)
                            ? 'var(--mantine-color-blue-0)'
                            : 'transparent',
                          borderBottom: '1px solid var(--mantine-color-default-border)',
                        }}
                        onClick={() => {
                          if (!selectedVariables.includes(variable.name)) {
                            handleSelectVariable(variable.name);
                          }
                        }}
                      >
                        <Text
                          size="sm"
                          c={selectedVariables.includes(variable.name) ? 'blue' : undefined}
                        >
                          {variable.label}
                          {selectedVariables.includes(variable.name) && ' (selected)'}
                        </Text>
                      </Box>
                    );

                    return variable.documentation ? (
                      <Tooltip
                        key={variable.name}
                        label={variable.documentation}
                        multiline
                        maw={300}
                        position="right"
                        withArrow
                        openDelay={300}
                      >
                        {content}
                      </Tooltip>
                    ) : (
                      <Box key={variable.name}>{content}</Box>
                    );
                  })}
                  {filteredVariables.length === 0 && (
                    <Text size="sm" c="dimmed" p="xs" ta="center">
                      No variables found
                    </Text>
                  )}
                </Box>
              )}
            </Box>
          </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
