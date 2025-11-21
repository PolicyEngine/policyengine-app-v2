/**
 * AdvancedSettings - Mockup 3 Design
 *
 * Uses inline search pattern with per-person variable assignment
 * and consolidated household variables section.
 */

import { useMemo, useState } from 'react';
import { IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import {
  Accordion,
  ActionIcon,
  Anchor,
  Box,
  Group,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { Household } from '@/types/ingredients/Household';
import {
  addVariable,
  addVariableToEntity,
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
  // Track which variables have been added
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);

  // Search state for person variables (per person)
  const [activePersonSearch, setActivePersonSearch] = useState<string | null>(null);
  const [personSearchValue, setPersonSearchValue] = useState('');
  const [isPersonSearchFocused, setIsPersonSearchFocused] = useState(false);

  // Search state for household variables
  const [isHouseholdSearchActive, setIsHouseholdSearchActive] = useState(false);
  const [householdSearchValue, setHouseholdSearchValue] = useState('');
  const [isHouseholdSearchFocused, setIsHouseholdSearchFocused] = useState(false);

  // Get all input variables
  const allInputVariables = useMemo(() => getInputVariables(metadata), [metadata]);

  // Get list of people
  const people = useMemo(() => Object.keys(household.householdData.people || {}), [household]);

  // Helper to get person display name
  const getPersonDisplayName = (personKey: string): string => {
    const parts = personKey.split(' ');
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  // Filter person-level variables for search
  const filteredPersonVariables = useMemo(() => {
    const personVars = allInputVariables.filter((v) => {
      const entityInfo = resolveEntity(v.name, metadata);
      return entityInfo?.isPerson;
    });

    if (!personSearchValue.trim()) {
      return personVars.slice(0, 50);
    }

    const search = personSearchValue.toLowerCase();
    return personVars
      .filter(
        (v) => v.label.toLowerCase().includes(search) || v.name.toLowerCase().includes(search)
      )
      .slice(0, 50);
  }, [allInputVariables, personSearchValue, metadata]);

  // Filter non-person variables for household search
  const filteredHouseholdVariables = useMemo(() => {
    const householdVars = allInputVariables.filter((v) => {
      const entityInfo = resolveEntity(v.name, metadata);
      return !entityInfo?.isPerson;
    });

    if (!householdSearchValue.trim()) {
      return householdVars.slice(0, 50);
    }

    const search = householdSearchValue.toLowerCase();
    return householdVars
      .filter(
        (v) => v.label.toLowerCase().includes(search) || v.name.toLowerCase().includes(search)
      )
      .slice(0, 50);
  }, [allInputVariables, householdSearchValue, metadata]);

  // Get variables for a specific person
  const getPersonVariables = (personName: string): string[] => {
    const personData = household.householdData.people[personName];
    if (!personData) {
      return [];
    }

    // Return variables that are in selectedVariables and this person actually has
    return selectedVariables.filter((varName) => {
      const entityInfo = resolveEntity(varName, metadata);
      // Only return if it's a person-level variable AND this person has it
      return entityInfo?.isPerson && personData[varName] !== undefined;
    });
  };

  // Get all household-level variables (consolidated from tax_unit, spm_unit, household)
  const householdLevelVariables = useMemo(() => {
    return selectedVariables
      .filter((varName) => {
        const entityInfo = resolveEntity(varName, metadata);
        return !entityInfo?.isPerson;
      })
      .map((varName) => {
        const entityInfo = resolveEntity(varName, metadata);
        return { name: varName, entity: entityInfo?.plural || 'households' };
      });
  }, [selectedVariables, metadata]);

  // Handle opening person search
  const handleOpenPersonSearch = (person: string) => {
    setActivePersonSearch(person);
    setPersonSearchValue('');
    setIsPersonSearchFocused(true);
  };

  // Handle person variable selection
  const handlePersonVariableSelect = (
    variable: { name: string; label: string },
    person: string
  ) => {
    // Add variable to only this specific person
    const newHousehold = addVariableToEntity(household, variable.name, metadata, year, person);
    onChange(newHousehold);

    // Track this variable as selected (even if only for one person)
    if (!selectedVariables.includes(variable.name)) {
      setSelectedVariables([...selectedVariables, variable.name]);
    }

    // Close search
    setActivePersonSearch(null);
    setPersonSearchValue('');
    setIsPersonSearchFocused(false);
  };

  // Handle opening household search
  const handleOpenHouseholdSearch = () => {
    setIsHouseholdSearchActive(true);
    setHouseholdSearchValue('');
    setIsHouseholdSearchFocused(true);
  };

  // Handle household variable selection
  const handleHouseholdVariableSelect = (variable: { name: string; label: string }) => {
    if (!selectedVariables.includes(variable.name)) {
      // Add variable to household
      const newHousehold = addVariable(household, variable.name, metadata, year);
      onChange(newHousehold);
      setSelectedVariables([...selectedVariables, variable.name]);
    }

    // Close search
    setIsHouseholdSearchActive(false);
    setHouseholdSearchValue('');
    setIsHouseholdSearchFocused(false);
  };

  // Handle removing person variable
  const handleRemovePersonVariable = (varName: string, person: string) => {
    // Remove the variable data from this person's household data
    const newHousehold = { ...household };
    const personData = newHousehold.householdData.people[person];
    if (personData && personData[varName]) {
      delete personData[varName];
    }
    onChange(newHousehold);

    // Check if any other person still has this variable
    const stillUsedByOthers = Object.keys(newHousehold.householdData.people).some(
      (p) => p !== person && newHousehold.householdData.people[p][varName]
    );

    // If no one else has it, remove from selectedVariables
    if (!stillUsedByOthers) {
      setSelectedVariables(selectedVariables.filter((v) => v !== varName));
    }
  };

  // Handle removing household variable
  const handleRemoveHouseholdVariable = (varName: string) => {
    const newHousehold = removeVariable(household, varName, metadata);
    onChange(newHousehold);
    setSelectedVariables(selectedVariables.filter((v) => v !== varName));
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
            <Accordion defaultValue={['individuals', 'household-vars']} multiple>
              {/* Individuals / Members section */}
              <Accordion.Item value="individuals">
                <Accordion.Control>
                  <Text fw={500}>Individuals / Members</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Accordion defaultValue={people} multiple>
                    {people.map((person) => {
                      const personVars = getPersonVariables(person);

                      return (
                        <Accordion.Item key={person} value={person}>
                          <Accordion.Control>
                            <Text fw={600} size="sm">
                              {getPersonDisplayName(person)}
                            </Text>
                          </Accordion.Control>
                          <Accordion.Panel>
                            <Stack gap="md">
                              {/* Render all variables for this person */}
                              {personVars.map((varName) => {
                                const variable = allInputVariables.find((v) => v.name === varName);
                                if (!variable) {
                                  return null;
                                }

                                return (
                                  <Group key={varName} gap="xs" align="flex-end" wrap="nowrap">
                                    <Box style={{ minWidth: 180, maxWidth: 180 }}>
                                      <Text size="sm" lineClamp={2}>
                                        {variable.label}
                                      </Text>
                                    </Box>
                                    <Box style={{ flex: 1, minWidth: 120 }}>
                                      <VariableInput
                                        variable={{ ...variable, label: '' }}
                                        household={household}
                                        metadata={metadata}
                                        year={year}
                                        entityName={person}
                                        onChange={onChange}
                                        disabled={disabled}
                                      />
                                    </Box>
                                    <Tooltip label="Remove variable for this person">
                                      <ActionIcon
                                        size="lg"
                                        variant="default"
                                        onClick={() => handleRemovePersonVariable(varName, person)}
                                        disabled={disabled}
                                      >
                                        <IconX size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Group>
                                );
                              })}

                              {/* Add variable search or link */}
                              {activePersonSearch === person ? (
                                <Box>
                                  <TextInput
                                    placeholder="Search for a variable..."
                                    value={personSearchValue}
                                    onChange={(e) => setPersonSearchValue(e.currentTarget.value)}
                                    onFocus={() => setIsPersonSearchFocused(true)}
                                    onBlur={() =>
                                      setTimeout(() => setIsPersonSearchFocused(false), 200)
                                    }
                                    leftSection={<IconSearch size={16} />}
                                    disabled={disabled}
                                    autoFocus
                                  />

                                  {/* Variable list - only show when focused */}
                                  {isPersonSearchFocused && (
                                    <Box
                                      mt="xs"
                                      style={{
                                        maxHeight: 200,
                                        overflow: 'auto',
                                        border: '1px solid var(--mantine-color-default-border)',
                                        borderRadius: 'var(--mantine-radius-sm)',
                                      }}
                                    >
                                      {filteredPersonVariables.length > 0 ? (
                                        <Stack gap={0}>
                                          {filteredPersonVariables.map((variable) => (
                                            <Box
                                              key={variable.name}
                                              p="sm"
                                              onMouseDown={() =>
                                                handlePersonVariableSelect(variable, person)
                                              }
                                              style={{
                                                cursor: 'pointer',
                                                borderBottom:
                                                  '1px solid var(--mantine-color-default-border)',
                                              }}
                                            >
                                              <Text size="sm">{variable.label}</Text>
                                              {variable.documentation && (
                                                <Text size="xs" c="dimmed" lineClamp={1}>
                                                  {variable.documentation}
                                                </Text>
                                              )}
                                            </Box>
                                          ))}
                                        </Stack>
                                      ) : (
                                        <Text size="sm" c="dimmed" p="md" ta="center">
                                          No variables found
                                        </Text>
                                      )}
                                    </Box>
                                  )}
                                </Box>
                              ) : (
                                <Box>
                                  <Anchor
                                    size="sm"
                                    onClick={() => handleOpenPersonSearch(person)}
                                    style={{ cursor: 'pointer', fontStyle: 'italic' }}
                                  >
                                    <Group gap={4}>
                                      <IconPlus size={14} />
                                      <Text size="sm">
                                        Add variable to {getPersonDisplayName(person)}
                                      </Text>
                                    </Group>
                                  </Anchor>
                                </Box>
                              )}
                            </Stack>
                          </Accordion.Panel>
                        </Accordion.Item>
                      );
                    })}
                  </Accordion>
                </Accordion.Panel>
              </Accordion.Item>

              {/* Household Variables section - combines all non-person entities */}
              <Accordion.Item value="household-vars">
                <Accordion.Control>
                  <Text fw={500}>Household Variables</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    {/* Render all household-level variables combined */}
                    {householdLevelVariables.map(({ name: varName, entity }) => {
                      const variable = allInputVariables.find((v) => v.name === varName);
                      if (!variable) {
                        return null;
                      }

                      return (
                        <Group key={`${entity}-${varName}`} gap="xs" align="flex-end" wrap="nowrap">
                          <Box style={{ minWidth: 180, maxWidth: 180 }}>
                            <Text size="sm" lineClamp={2}>
                              {variable.label}
                            </Text>
                          </Box>
                          <Box style={{ flex: 1, minWidth: 120 }}>
                            <VariableInput
                              variable={{ ...variable, label: '' }}
                              household={household}
                              metadata={metadata}
                              year={year}
                              onChange={onChange}
                              disabled={disabled}
                            />
                          </Box>
                          <Tooltip label="Remove variable">
                            <ActionIcon
                              size="lg"
                              variant="default"
                              onClick={() => handleRemoveHouseholdVariable(varName)}
                              disabled={disabled}
                            >
                              <IconX size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      );
                    })}

                    {/* Add variable search or link */}
                    {isHouseholdSearchActive ? (
                      <Box>
                        <TextInput
                          placeholder="Search for a variable..."
                          value={householdSearchValue}
                          onChange={(e) => setHouseholdSearchValue(e.currentTarget.value)}
                          onFocus={() => setIsHouseholdSearchFocused(true)}
                          onBlur={() => setTimeout(() => setIsHouseholdSearchFocused(false), 200)}
                          leftSection={<IconSearch size={16} />}
                          disabled={disabled}
                          autoFocus
                        />

                        {/* Variable list - only show when focused */}
                        {isHouseholdSearchFocused && (
                          <Box
                            mt="xs"
                            style={{
                              maxHeight: 200,
                              overflow: 'auto',
                              border: '1px solid var(--mantine-color-default-border)',
                              borderRadius: 'var(--mantine-radius-sm)',
                            }}
                          >
                            {filteredHouseholdVariables.length > 0 ? (
                              <Stack gap={0}>
                                {filteredHouseholdVariables.map((variable) => (
                                  <Box
                                    key={variable.name}
                                    p="sm"
                                    onMouseDown={() => handleHouseholdVariableSelect(variable)}
                                    style={{
                                      cursor: 'pointer',
                                      borderBottom: '1px solid var(--mantine-color-default-border)',
                                    }}
                                  >
                                    <Text size="sm">{variable.label}</Text>
                                    {variable.documentation && (
                                      <Text size="xs" c="dimmed" lineClamp={1}>
                                        {variable.documentation}
                                      </Text>
                                    )}
                                  </Box>
                                ))}
                              </Stack>
                            ) : (
                              <Text size="sm" c="dimmed" p="md" ta="center">
                                No variables found
                              </Text>
                            )}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box>
                        <Anchor
                          size="sm"
                          onClick={handleOpenHouseholdSearch}
                          style={{ cursor: 'pointer', fontStyle: 'italic' }}
                        >
                          <Group gap={4}>
                            <IconPlus size={14} />
                            <Text size="sm">Add variable</Text>
                          </Group>
                        </Anchor>
                      </Box>
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
