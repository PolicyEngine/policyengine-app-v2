/**
 * Mockup 2: Inline Variables Grouped by Entity
 *
 * Shows the new design with variables inline per entity section.
 * Based on the mockup image provided.
 */

import { useState } from 'react';
import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  CloseButton,
  Container,
  Divider,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconChevronDown, IconInfoCircle, IconSearch, IconVariable, IconX } from '@tabler/icons-react';
import { mockDataMarried, mockAvailableVariables } from './data/householdBuilderMockData';
import { getInputFormattingProps } from '@/utils/householdValues';

export default function HouseholdBuilderMockup2() {
  const [taxYear, setTaxYear] = useState('2024');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married'>('married');
  const [numChildren, setNumChildren] = useState(1);

  // Person-level variables (with X buttons)
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

  const [searchValue, setSearchValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<{
    name: string;
    label: string;
    documentation: string | null;
    entity: string;
  } | null>(null);
  const [variableValue, setVariableValue] = useState<number>(0);

  const handleRemovePersonVariable = (person: string, varName: string) => {
    // Set to 0 (visual removal)
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

  const handleVariableClick = (variable: {
    name: string;
    label: string;
    documentation: string | null;
    entity: string;
  }) => {
    setSelectedVariable(variable);
    setVariableValue(0);
    setIsDropdownOpen(false);
    setSearchValue('');
  };

  const handleAddVariableToHousehold = () => {
    if (!selectedVariable) return;

    if (selectedVariable.entity === 'person') {
      // Add to all people
      setPersonVariables((prev) => {
        const updated = { ...prev };
        people.forEach((person) => {
          if (!updated[person]) updated[person] = {};
          updated[person][selectedVariable.name] = variableValue;
        });
        return updated;
      });
    } else if (selectedVariable.entity === 'tax_unit') {
      // Add to tax unit
      setTaxUnitVariables((prev) => ({
        ...prev,
        [selectedVariable.name]: variableValue,
      }));
    } else if (selectedVariable.entity === 'spm_unit') {
      // Add to SPM unit
      setSpmUnitVariables((prev) => ({
        ...prev,
        [selectedVariable.name]: variableValue,
      }));
    } else if (selectedVariable.entity === 'household') {
      // Add to household
      setHouseholdVariables((prev) => ({
        ...prev,
        [selectedVariable.name]: variableValue,
      }));
    }

    // Close modal
    setSelectedVariable(null);
    setVariableValue(0);
  };

  const people = ['you', 'your partner', 'your first dependent'];

  const incomeFormatting = getInputFormattingProps({
    valueType: 'float',
    unit: 'currency-USD',
  });

  // Filter available variables based on search
  const filteredVariables = searchValue
    ? mockAvailableVariables.filter(
        (v) =>
          v.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          v.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : mockAvailableVariables;

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={2}>Mockup 2: Inline Variables by Entity</Title>
          <Text c="dimmed">New design with variables grouped inline by entity type</Text>
        </Stack>

        <Stack gap="lg">
          {/* Structural controls */}
          <Stack gap="md">
            <Text size="sm" fw={500} c="dimmed">
              Household Information
            </Text>
            <Group gap="md" align="flex-start">
              <Select
                label="Tax Year"
                value={taxYear}
                onChange={(val) => val && setTaxYear(val)}
                data={[
                  { value: '2024', label: '2024' },
                  { value: '2023', label: '2023' },
                ]}
                style={{ flex: 1 }}
              />
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
                            {person === 'you'
                              ? 'You'
                              : person === 'your partner'
                                ? 'Your Spouse'
                                : 'Your First Dependent'}
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
                    {/* Dynamically render all tax unit variables */}
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

          {/* Search section */}
          <Stack gap="md">
            <Text size="sm" fw={500} c="dimmed">
              Add Custom Variables
            </Text>
            <Box>
              <TextInput
                placeholder="Search for a variable..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.currentTarget.value)}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                leftSection={<IconSearch size={16} />}
              />

              {/* Dropdown with real variables */}
              {isDropdownOpen && (
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
                  {filteredVariables.length > 0 ? (
                    <Stack gap={0}>
                      {filteredVariables.map((variable) => (
                        <Box
                          key={variable.name}
                          p="xs"
                          onMouseDown={() => handleVariableClick(variable)}
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

          {/* Modal for variable details */}
          <Modal
            opened={selectedVariable !== null}
            onClose={() => setSelectedVariable(null)}
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
                  {selectedVariable?.label || 'Add Variable'}
                </Title>
                <Text size="sm" c="dimmed">
                  {selectedVariable?.documentation ||
                    `Add ${selectedVariable?.label || 'this variable'} to your household${selectedVariable?.entity === 'person' ? ' (will be added to all members)' : ''}.`}
                </Text>
              </Box>

              <Divider />

              {/* Value input */}
              <Box>
                <Text size="sm" fw={500} mb="xs">
                  Initial Value
                </Text>
                <NumberInput
                  value={variableValue}
                  onChange={(val) => setVariableValue(Number(val) || 0)}
                  min={0}
                  placeholder="0"
                  {...incomeFormatting}
                />
              </Box>

              {/* Actions */}
              <Group gap="sm">
                <Button
                  variant="outline"
                  onClick={() => setSelectedVariable(null)}
                  flex={1}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddVariableToHousehold} flex={1}>
                  Add to Household
                </Button>
              </Group>
            </Stack>
          </Modal>
        </Stack>
      </Stack>
    </Container>
  );
}
