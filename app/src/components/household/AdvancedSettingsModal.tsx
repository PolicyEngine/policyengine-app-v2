/**
 * AdvancedSettingsModal - Alternative Advanced Settings using Modal for variable selection
 *
 * Uses a modal for variable selection instead of inline search/browser.
 * This provides a cleaner main form and focused selection experience.
 */

import { useState, useEffect } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconX } from '@tabler/icons-react';
import { Household } from '@/types/ingredients/Household';
import {
  addVariable,
  getEntityInstances,
  getInputVariables,
  removeVariable,
  resolveEntity,
} from '@/utils/VariableResolver';
import VariableInput from './VariableInput';
import VariableSelectorModal from './VariableSelectorModal';

export interface AdvancedSettingsModalProps {
  household: Household;
  metadata: any;
  year: string;
  onChange: (household: Household) => void;
  disabled?: boolean;
}

export default function AdvancedSettingsModal({
  household,
  metadata,
  year,
  onChange,
  disabled = false,
}: AdvancedSettingsModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);

  const allInputVariables = getInputVariables(metadata);

  // Sync selected variables when household structure changes (e.g., marital status, children)
  useEffect(() => {
    if (selectedVariables.length === 0) return;

    let updatedHousehold = household;
    let needsUpdate = false;

    for (const variableName of selectedVariables) {
      const entityInfo = resolveEntity(variableName, metadata);
      if (!entityInfo) continue;

      const instances = getEntityInstances(household, entityInfo.plural);

      for (const instanceName of instances) {
        const entityData = household.householdData[entityInfo.plural as keyof typeof household.householdData];
        if (entityData && typeof entityData === 'object') {
          const instance = (entityData as Record<string, any>)[instanceName];
          if (instance && !instance[variableName]) {
            updatedHousehold = addVariable(updatedHousehold, variableName, metadata, year);
            needsUpdate = true;
            break;
          }
        }
      }
    }

    if (needsUpdate) {
      onChange(updatedHousehold);
    }
  }, [household.householdData.people, selectedVariables, metadata, year]);

  // Handle variable selection from modal
  const handleSelect = (variableNames: string[]) => {
    // Add new variables
    let newHousehold = household;
    const newVars = variableNames.filter((v) => !selectedVariables.includes(v));
    for (const varName of newVars) {
      newHousehold = addVariable(newHousehold, varName, metadata, year);
    }

    // Remove deselected variables
    const removedVars = selectedVariables.filter((v) => !variableNames.includes(v));
    for (const varName of removedVars) {
      newHousehold = removeVariable(newHousehold, varName, metadata);
    }

    onChange(newHousehold);
    setSelectedVariables(variableNames);
  };

  // Handle single variable removal
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

    const instances = getEntityInstances(household, entityInfo.plural);

    return (
      <Box key={variableName} mb="md">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>
            {variable.label}
          </Text>
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
          <Stack gap="xs">
            {instances.map((personName) => (
              <Group key={personName} gap="xs">
                <Text size="sm" c="dimmed" style={{ minWidth: 100 }}>
                  {personName}
                </Text>
                <Box style={{ flex: 1 }}>
                  <VariableInput
                    variable={{ ...variable, label: '' }}
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
          <VariableInput
            variable={{ ...variable, label: '' }}
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
    <>
      <Stack gap="md">
        <Text fw={500} size="sm" c="dimmed">
          Advanced Settings (Modal)
        </Text>

        <Stack gap="md">
          {/* Add variable button */}
          <Button
            leftSection={<IconPlus size={16} />}
            variant="light"
            onClick={open}
            disabled={disabled}
          >
            Add Variable
          </Button>

          {/* Selected variables */}
          {selectedVariables.length > 0 && (
            <Box>
              <Text size="sm" fw={500} mb="sm">
                Selected Variables:
              </Text>
              {selectedVariables.map((varName) => renderVariableInputs(varName))}
            </Box>
          )}

          {selectedVariables.length === 0 && (
            <Text size="sm" c="dimmed" ta="center">
              No custom variables selected. Click &quot;Add Variable&quot; to add more
              inputs.
            </Text>
          )}
        </Stack>
      </Stack>

      {/* Variable selector modal */}
      <VariableSelectorModal
        opened={opened}
        onClose={close}
        metadata={metadata}
        selectedVariables={selectedVariables}
        onSelect={handleSelect}
      />
    </>
  );
}
