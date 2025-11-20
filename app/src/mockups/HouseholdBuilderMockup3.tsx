/**
 * Mockup 3: Individual Variable Assignment
 *
 * Shows design where custom variables can be added per individual person
 * rather than to all members at once.
 */

import { useState } from 'react';
import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
  Anchor,
} from '@mantine/core';
import { IconChevronDown, IconInfoCircle, IconPlus, IconSearch, IconVariable, IconX } from '@tabler/icons-react';
import { mockDataMarried, mockAvailableVariables } from './data/householdBuilderMockData';
import { getInputFormattingProps } from '@/utils/householdValues';

export default function HouseholdBuilderMockup3() {
  const [taxYear, setTaxYear] = useState('2024');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married'>('married');
  const [numChildren, setNumChildren] = useState(1);

  // Person-level variables
  const [personVariables, setPersonVariables] = useState<
    Record<string, Record<string, number>>
  >({
    you: {
      employment_income: 300,
      heating_expense_person: 30,
    },
    'your partner': {
      employment_income: 250,
      heating_expense_person: 70,
    },
    'your first dependent': {
      employment_income: 250,
      heating_expense_person: 70,
    },
  });

  // Tax unit variables
  const [taxUnitVariables, setTaxUnitVariables] = useState<Record<string, number>>({
    heat_pump_expenditures: 250,
  });

  // SPM unit variables
  const [spmUnitVariables, setSpmUnitVariables] = useState<Record<string, number>>({});

  // Household variables
  const [householdVariables, setHouseholdVariables] = useState<Record<string, number>>({});

  // Modal state for person variables
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [personSearchValue, setPersonSearchValue] = useState('');
  const [isPersonSearchFocused, setIsPersonSearchFocused] = useState(false);
  const [selectedPersonVariable, setSelectedPersonVariable] = useState<{
    name: string;
    label: string;
    documentation: string | null;
    entity: string;
  } | null>(null);
  const [personVariableValue, setPersonVariableValue] = useState<number>(0);

  // Search state for other entity variables
  const [entitySearchValue, setEntitySearchValue] = useState('');
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);
  const [selectedEntityVariable, setSelectedEntityVariable] = useState<{
    name: string;
    label: string;
    documentation: string | null;
    entity: string;
  } | null>(null);
  const [entityVariableValue, setEntityVariableValue] = useState<number>(0);

  const handleRemovePersonVariable = (person: string, varName: string) => {
    setPersonVariables((prev) => ({
      ...prev,
      [person]: {
        ...prev[person],
        [varName]: 0,
      },
    }));
  };

  const handleRemoveTaxUnitVariable = (varName: string) => {
    setTaxUnitVariables((prev) => {
      const updated = { ...prev };
      delete updated[varName];
      return updated;
    });
  };

  const handleRemoveSpmUnitVariable = (varName: string) => {
    setSpmUnitVariables((prev) => {
      const updated = { ...prev };
      delete updated[varName];
      return updated;
    });
  };

  const handleRemoveHouseholdVariable = (varName: string) => {
    setHouseholdVariables((prev) => {
      const updated = { ...prev };
      delete updated[varName];
      return updated;
    });
  };

  const handleOpenModal = (person: string) => {
    setSelectedPerson(person);
    setPersonSearchValue('');
    setIsPersonSearchFocused(false);
    setSelectedPersonVariable(null);
    setPersonVariableValue(0);
  };

  const handleCloseModal = () => {
    setSelectedPerson(null);
    setPersonSearchValue('');
    setIsPersonSearchFocused(false);
    setSelectedPersonVariable(null);
    setPersonVariableValue(0);
  };

  const handleVariableSelect = (variable: {
    name: string;
    label: string;
    documentation: string | null;
    entity: string;
  }) => {
    setSelectedPersonVariable(variable);
    setPersonVariableValue(0);
  };

  const handleAddVariableToPerson = () => {
    if (!selectedPerson || !selectedPersonVariable) return;

    setPersonVariables((prev) => ({
      ...prev,
      [selectedPerson]: {
        ...prev[selectedPerson],
        [selectedPersonVariable.name]: personVariableValue,
      },
    }));

    handleCloseModal();
  };

  const handleEntityVariableClick = (variable: {
    name: string;
    label: string;
    documentation: string | null;
    entity: string;
  }) => {
    setSelectedEntityVariable(variable);
    setEntityVariableValue(0);
    setIsEntityDropdownOpen(false);
    setEntitySearchValue('');
  };

  const handleAddEntityVariable = () => {
    if (!selectedEntityVariable) return;

    if (selectedEntityVariable.entity === 'tax_unit') {
      setTaxUnitVariables((prev) => ({
        ...prev,
        [selectedEntityVariable.name]: entityVariableValue,
      }));
    } else if (selectedEntityVariable.entity === 'spm_unit') {
      setSpmUnitVariables((prev) => ({
        ...prev,
        [selectedEntityVariable.name]: entityVariableValue,
      }));
    } else if (selectedEntityVariable.entity === 'household') {
      setHouseholdVariables((prev) => ({
        ...prev,
        [selectedEntityVariable.name]: entityVariableValue,
      }));
    }

    setSelectedEntityVariable(null);
    setEntityVariableValue(0);
  };

  const people = ['you', 'your partner', 'your first dependent'];

  const incomeFormatting = getInputFormattingProps({
    valueType: 'float',
    unit: 'currency-USD',
  });

  // Filter person-level variables based on search (for modal)
  const personLevelVariables = mockAvailableVariables.filter((v) => v.entity === 'person');
  const filteredPersonVariables = personSearchValue
    ? personLevelVariables.filter(
        (v) =>
          v.label.toLowerCase().includes(personSearchValue.toLowerCase()) ||
          v.name.toLowerCase().includes(personSearchValue.toLowerCase())
      )
    : personLevelVariables;

  // Filter non-person variables for entity search
  const nonPersonVariables = mockAvailableVariables.filter((v) => v.entity !== 'person');
  const filteredEntityVariables = entitySearchValue
    ? nonPersonVariables.filter(
        (v) =>
          v.label.toLowerCase().includes(entitySearchValue.toLowerCase()) ||
          v.name.toLowerCase().includes(entitySearchValue.toLowerCase())
      )
    : nonPersonVariables;

  // Get display name for person
  const getPersonDisplayName = (person: string) => {
    if (person === 'you') return 'You';
    if (person === 'your partner') return 'Your Spouse';
    return 'Your First Dependent';
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={2}>Mockup 3: Individual Variable Assignment</Title>
          <Text c="dimmed">Add custom variables to individual members separately</Text>
        </Stack>

        <Stack gap="lg">
          {/* Structural controls */}
          <Stack gap="md">
            <Text size="sm" fw={500} c="dimmed">
              Household Information
            </Text>
            <Select
              label="Tax Year"
              value={taxYear}
              onChange={(val) => val && setTaxYear(val)}
              data={[
                { value: '2024', label: '2024' },
                { value: '2023', label: '2023' },
              ]}
            />
            <Group gap="md" align="flex-start">
              <Select
                label="Marital Status"
                value={maritalStatus}
                onChange={(val) => val && setMaritalStatus(val as any)}
                data={[
                  { value: 'single', label: 'Single' },
                  { value: 'married', label: 'Married' },
                ]}
                style={{ flex: 1 }}
              />
              <Select
                label="Number of Children"
                value={numChildren.toString()}
                onChange={(val) => val && setNumChildren(parseInt(val))}
                data={[
                  { value: '0', label: '0' },
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                ]}
                style={{ flex: 1 }}
              />
            </Group>
          </Stack>

          {/* Collapsible sections */}
          <Accordion
            defaultValue={['individuals', 'tax-unit', 'spm-unit', 'household']}
            multiple
          >
            {/* Individuals / Members section - always visible */}
            <Accordion.Item value="individuals">
              <Accordion.Control>
                <Text fw={500}>Individuals / Members</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Accordion defaultValue={people} multiple>
                  {people.map((person) => {
                    const personVars = personVariables[person] || {};
                    const varNames = Object.keys(personVars).filter((key) => personVars[key] !== 0);

                    return (
                      <Accordion.Item key={person} value={person}>
                        <Accordion.Control>
                          <Text fw={600} size="sm">
                            {getPersonDisplayName(person)}
                          </Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                          <Stack gap="md">
                            {/* Dynamically render all variables for this person */}
                            {varNames.map((varName) => {
                              const variable = mockAvailableVariables.find((v) => v.name === varName);
                              const label =
                                variable?.label ||
                                varName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

                              return (
                                <Group key={varName} gap="xs" align="flex-end" wrap="nowrap">
                                  <Box style={{ minWidth: 180, maxWidth: 180 }}>
                                    <Text size="sm" lineClamp={2}>
                                      {label}
                                    </Text>
                                  </Box>
                                  <Box style={{ flex: 1, minWidth: 120 }}>
                                    <NumberInput
                                      value={personVars[varName] || 0}
                                      onChange={(val) =>
                                        setPersonVariables((prev) => ({
                                          ...prev,
                                          [person]: {
                                            ...prev[person],
                                            [varName]: Number(val) || 0,
                                          },
                                        }))
                                      }
                                      min={0}
                                      {...incomeFormatting}
                                    />
                                  </Box>
                                  <Tooltip label="Remove variable for this person">
                                    <ActionIcon
                                      size="lg"
                                      variant="default"
                                      onClick={() => handleRemovePersonVariable(person, varName)}
                                    >
                                      <IconX size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              );
                            })}

                            {/* Add variable link */}
                            <Box>
                              <Anchor
                                size="sm"
                                onClick={() => handleOpenModal(person)}
                                style={{ cursor: 'pointer', fontStyle: 'italic' }}
                              >
                                <Group gap={4}>
                                  <IconPlus size={14} />
                                  <Text size="sm">Add variable to {getPersonDisplayName(person)}</Text>
                                </Group>
                              </Anchor>
                            </Box>
                          </Stack>
                        </Accordion.Panel>
                      </Accordion.Item>
                    );
                  })}
                </Accordion>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Your Tax Unit section - only show if has variables */}
            {Object.keys(taxUnitVariables).length > 0 && (
              <Accordion.Item value="tax-unit">
                <Accordion.Control>
                  <Text fw={500}>Your Tax Unit</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    {Object.keys(taxUnitVariables).map((varName) => {
                      const variable = mockAvailableVariables.find((v) => v.name === varName);
                      const label =
                        variable?.label ||
                        varName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

                      return (
                        <Group key={varName} gap="xs" align="flex-end" wrap="nowrap">
                          <Box style={{ minWidth: 180, maxWidth: 180 }}>
                            <Text size="sm" lineClamp={2}>
                              {label}
                            </Text>
                          </Box>
                          <Box style={{ flex: 1, minWidth: 120 }}>
                            <NumberInput
                              value={taxUnitVariables[varName] || 0}
                              onChange={(val) =>
                                setTaxUnitVariables((prev) => ({
                                  ...prev,
                                  [varName]: Number(val) || 0,
                                }))
                              }
                              min={0}
                              {...incomeFormatting}
                            />
                          </Box>
                          <Tooltip label="Remove variable">
                            <ActionIcon
                              size="lg"
                              variant="default"
                              onClick={() => handleRemoveTaxUnitVariable(varName)}
                            >
                              <IconX size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      );
                    })}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* SPM Unit section - only show if has variables */}
            {Object.keys(spmUnitVariables).length > 0 && (
              <Accordion.Item value="spm-unit">
                <Accordion.Control>
                  <Text fw={500}>Your SPM Unit</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    {Object.keys(spmUnitVariables).map((varName) => {
                      const variable = mockAvailableVariables.find((v) => v.name === varName);
                      const label =
                        variable?.label ||
                        varName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

                      return (
                        <Group key={varName} gap="xs" align="flex-end" wrap="nowrap">
                          <Box style={{ minWidth: 180, maxWidth: 180 }}>
                            <Text size="sm" lineClamp={2}>
                              {label}
                            </Text>
                          </Box>
                          <Box style={{ flex: 1, minWidth: 120 }}>
                            <NumberInput
                              value={spmUnitVariables[varName] || 0}
                              onChange={(val) =>
                                setSpmUnitVariables((prev) => ({
                                  ...prev,
                                  [varName]: Number(val) || 0,
                                }))
                              }
                              min={0}
                              {...incomeFormatting}
                            />
                          </Box>
                          <Tooltip label="Remove variable">
                            <ActionIcon
                              size="lg"
                              variant="default"
                              onClick={() => handleRemoveSpmUnitVariable(varName)}
                            >
                              <IconX size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      );
                    })}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* Household section - only show if has variables */}
            {Object.keys(householdVariables).length > 0 && (
              <Accordion.Item value="household">
                <Accordion.Control>
                  <Text fw={500}>Your Household</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    {Object.keys(householdVariables).map((varName) => {
                      const variable = mockAvailableVariables.find((v) => v.name === varName);
                      const label =
                        variable?.label ||
                        varName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

                      return (
                        <Group key={varName} gap="xs" align="flex-end" wrap="nowrap">
                          <Box style={{ minWidth: 180, maxWidth: 180 }}>
                            <Text size="sm" lineClamp={2}>
                              {label}
                            </Text>
                          </Box>
                          <Box style={{ flex: 1, minWidth: 120 }}>
                            <NumberInput
                              value={householdVariables[varName] || 0}
                              onChange={(val) =>
                                setHouseholdVariables((prev) => ({
                                  ...prev,
                                  [varName]: Number(val) || 0,
                                }))
                              }
                              min={0}
                              {...incomeFormatting}
                            />
                          </Box>
                          <Tooltip label="Remove variable">
                            <ActionIcon
                              size="lg"
                              variant="default"
                              onClick={() => handleRemoveHouseholdVariable(varName)}
                            >
                              <IconX size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      );
                    })}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}
          </Accordion>

          {/* Search section for entity-level variables */}
          <Stack gap="md">
            <Text size="sm" fw={500} c="dimmed">
              Add Custom Variables (Tax Unit, SPM Unit, Household)
            </Text>
            <Box>
              <TextInput
                placeholder="Search for a variable..."
                value={entitySearchValue}
                onChange={(e) => setEntitySearchValue(e.currentTarget.value)}
                onFocus={() => setIsEntityDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsEntityDropdownOpen(false), 200)}
                leftSection={<IconSearch size={16} />}
              />

              {/* Dropdown with real variables */}
              {isEntityDropdownOpen && (
                <Box
                  mt="xs"
                  style={{
                    border: '1px solid var(--mantine-color-default-border)',
                    borderRadius: 'var(--mantine-radius-sm)',
                    backgroundColor: 'var(--mantine-color-body)',
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  {filteredEntityVariables.length > 0 ? (
                    <Stack gap={0}>
                      {filteredEntityVariables.map((variable) => (
                        <Box
                          key={variable.name}
                          p="xs"
                          onMouseDown={() => handleEntityVariableClick(variable)}
                          style={{
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--mantine-color-default-border)',
                            ':hover': {
                              backgroundColor: 'var(--mantine-color-gray-1)',
                            },
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
                    <Text size="sm" c="dimmed" p="xs" ta="center">
                      No variables found
                    </Text>
                  )}
                </Box>
              )}
            </Box>
          </Stack>
        </Stack>

        {/* Modal for entity variables */}
        <Modal
          opened={selectedEntityVariable !== null}
          onClose={() => setSelectedEntityVariable(null)}
          withCloseButton={false}
          size="md"
          radius="md"
          padding="lg"
        >
          <Stack gap="md">
            {/* Icon */}
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'var(--mantine-color-gray-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconVariable size={24} color="var(--mantine-color-gray-7)" />
            </Box>

            {/* Title and description */}
            <Box>
              <Title order={3} mb={4}>
                {selectedEntityVariable?.label || 'Add Variable'}
              </Title>
              <Text size="sm" c="dimmed">
                {selectedEntityVariable?.documentation ||
                  `Add ${selectedEntityVariable?.label || 'this variable'} to your household.`}
              </Text>
            </Box>

            <Divider />

            {/* Value input */}
            <Box>
              <Text size="sm" fw={500} mb="xs">
                Initial Value
              </Text>
              <NumberInput
                value={entityVariableValue}
                onChange={(val) => setEntityVariableValue(Number(val) || 0)}
                min={0}
                placeholder="0"
                {...incomeFormatting}
              />
            </Box>

            {/* Actions */}
            <Group gap="sm">
              <Button
                variant="outline"
                onClick={() => setSelectedEntityVariable(null)}
                flex={1}
              >
                Cancel
              </Button>
              <Button onClick={handleAddEntityVariable} flex={1}>
                Add to Household
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Modal for adding variable to specific person */}
        <Modal
          opened={selectedPerson !== null}
          onClose={handleCloseModal}
          title={`Add Variable to ${selectedPerson ? getPersonDisplayName(selectedPerson) : ''}`}
          size="md"
        >
          <Stack gap="md">
            {/* Search bar */}
            <TextInput
              placeholder="Search for a variable..."
              value={personSearchValue}
              onChange={(e) => setPersonSearchValue(e.currentTarget.value)}
              onFocus={() => setIsPersonSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsPersonSearchFocused(false), 200)}
              leftSection={<IconSearch size={16} />}
            />

            {/* Variable list - only show when focused */}
            {isPersonSearchFocused && (
              <Box
                style={{
                  maxHeight: 300,
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
                        onMouseDown={() => handleVariableSelect(variable)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--mantine-color-default-border)',
                          backgroundColor:
                            selectedPersonVariable?.name === variable.name
                              ? 'var(--mantine-color-blue-light)'
                              : 'transparent',
                        }}
                      >
                        <Text size="sm" fw={selectedPersonVariable?.name === variable.name ? 500 : 400}>
                          {variable.label}
                        </Text>
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

            {/* Value input - only show when variable selected */}
            {selectedPersonVariable && (
              <>
                <Divider />
                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    Value for {selectedPersonVariable.label}
                  </Text>
                  <NumberInput
                    value={personVariableValue}
                    onChange={(val) => setPersonVariableValue(Number(val) || 0)}
                    min={0}
                    placeholder="0"
                    {...incomeFormatting}
                  />
                </Box>
              </>
            )}

            {/* Actions */}
            <Group gap="sm">
              <Button variant="outline" onClick={handleCloseModal} flex={1}>
                Cancel
              </Button>
              <Button
                onClick={handleAddVariableToPerson}
                flex={1}
                disabled={!selectedPersonVariable}
              >
                Add to {selectedPerson ? getPersonDisplayName(selectedPerson) : 'Person'}
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}
