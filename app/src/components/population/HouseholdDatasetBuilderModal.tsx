import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Divider,
  Text,
  NumberInput,
  ActionIcon,
  Paper,
  Badge,
  Accordion,
  ScrollArea,
  Tabs,
  MultiSelect,
  Checkbox,
} from '@mantine/core';
import { IconPlus, IconTrash, IconUsers, IconVariable } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { datasetsAPI } from '@/api/v2/datasets';
import { userDatasetsAPI } from '@/api/v2/userDatasets';
import { RootState } from '@/store';
import { MOCK_USER_ID } from '@/constants';

interface PersonVariableValue {
  [variable: string]: number | string;
}

interface Person {
  id: string;
  name: string;
  variables: PersonVariableValue;
}

interface Household {
  id: string;
  name: string;
  people: Person[];
}

interface HouseholdDatasetBuilderModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function HouseholdDatasetBuilderModal({
  opened,
  onClose,
}: HouseholdDatasetBuilderModalProps) {
  const queryClient = useQueryClient();
  const userId = MOCK_USER_ID;

  // Get current country and metadata from Redux
  const currentCountry = useSelector((state: RootState) => state.metadata.currentCountry || 'us');
  const metadata = useSelector((state: RootState) => state.metadata);
  const variables = metadata.variables || {};
  const entities = metadata.entities || {};

  // Get all person-level variables from metadata
  const personVariables = useMemo(() => {
    const varList: Array<{ value: string; label: string; valueType: string }> = [];

    Object.entries(variables).forEach(([varName, varData]: [string, any]) => {
      // Check if this variable is defined on the person entity
      if (varData?.entity === 'person' || varData?.definitionPeriod) {
        varList.push({
          value: varName,
          label: varData?.label || varName.replace(/_/g, ' '),
          valueType: varData?.valueType || 'float',
        });
      }
    });

    // Sort alphabetically by label
    return varList.sort((a, b) => a.label.localeCompare(b.label));
  }, [variables]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState('2024');
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<string[]>([
    'age',
    'employment_income',
  ]);

  // Reset form when modal closes
  useEffect(() => {
    if (!opened) {
      setName('');
      setDescription('');
      setYear('2024');
      setHouseholds([]);
      setSelectedVariables(['age', 'employment_income']);
    }
  }, [opened]);

  // Create dataset mutation
  const createDatasetMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      country: string;
      householdData: any
    }) => {
      const dataset = await datasetsAPI.createDataset({
        name: data.name,
        description: data.description,
        type: 'household',
        country: data.country,
        source: 'user-created',
      });

      await datasetsAPI.createVersionedDataset({
        dataset_id: dataset.id,
        version: '1.0.0',
        data: data.householdData,
        metadata: {
          created_by: 'user',
          country: data.country,
          year,
          selected_variables: selectedVariables,
        },
      });

      await userDatasetsAPI.createUserDataset(userId, {
        dataset_id: dataset.id,
        is_creator: true,
      });

      return dataset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      queryClient.invalidateQueries({ queryKey: ['userDatasets', userId] });
      notifications.show({
        title: 'Population created',
        message: 'Your custom household population has been created successfully',
        color: 'green',
      });
      onClose();
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to create population',
        color: 'red',
      });
    },
  });

  const addHousehold = () => {
    const newHousehold: Household = {
      id: `household_${Date.now()}`,
      name: `Household ${households.length + 1}`,
      people: [
        {
          id: `person_${Date.now()}`,
          name: 'Person 1',
          variables: getDefaultVariableValues(),
        },
      ],
    };
    setHouseholds([...households, newHousehold]);
  };

  const getDefaultVariableValues = (): PersonVariableValue => {
    const defaults: PersonVariableValue = {};
    selectedVariables.forEach(varName => {
      const varMeta = variables[varName];
      if (varMeta?.defaultValue !== undefined) {
        defaults[varName] = varMeta.defaultValue;
      } else if (varName === 'age') {
        defaults[varName] = 30;
      } else if (varName.includes('income') || varName.includes('earnings')) {
        defaults[varName] = 50000;
      } else {
        defaults[varName] = 0;
      }
    });
    return defaults;
  };

  const removeHousehold = (householdId: string) => {
    setHouseholds(households.filter((h) => h.id !== householdId));
  };

  const updateHousehold = (householdId: string, updates: Partial<Household>) => {
    setHouseholds(
      households.map((h) => (h.id === householdId ? { ...h, ...updates } : h))
    );
  };

  const addPerson = (householdId: string) => {
    setHouseholds(
      households.map((h) => {
        if (h.id === householdId) {
          return {
            ...h,
            people: [
              ...h.people,
              {
                id: `person_${Date.now()}`,
                name: `Person ${h.people.length + 1}`,
                variables: getDefaultVariableValues(),
              },
            ],
          };
        }
        return h;
      })
    );
  };

  const removePerson = (householdId: string, personId: string) => {
    setHouseholds(
      households.map((h) => {
        if (h.id === householdId) {
          return {
            ...h,
            people: h.people.filter((p) => p.id !== personId),
          };
        }
        return h;
      })
    );
  };

  const updatePerson = (
    householdId: string,
    personId: string,
    field: 'name' | 'variables',
    value: any
  ) => {
    setHouseholds(
      households.map((h) => {
        if (h.id === householdId) {
          return {
            ...h,
            people: h.people.map((p) =>
              p.id === personId ? { ...p, [field]: value } : p
            ),
          };
        }
        return h;
      })
    );
  };

  const updatePersonVariable = (
    householdId: string,
    personId: string,
    variable: string,
    value: number | string
  ) => {
    setHouseholds(
      households.map((h) => {
        if (h.id === householdId) {
          return {
            ...h,
            people: h.people.map((p) =>
              p.id === personId
                ? { ...p, variables: { ...p.variables, [variable]: value } }
                : p
            ),
          };
        }
        return h;
      })
    );
  };

  // When variables change, update all people to include/exclude variables
  useEffect(() => {
    if (households.length > 0) {
      setHouseholds(
        households.map(h => ({
          ...h,
          people: h.people.map(p => {
            const newVariables: PersonVariableValue = {};
            selectedVariables.forEach(varName => {
              newVariables[varName] = p.variables[varName] ??
                (variables[varName]?.defaultValue ?? 0);
            });
            return { ...p, variables: newVariables };
          }),
        }))
      );
    }
  }, [selectedVariables]);

  const buildHouseholdData = () => {
    const householdData: any = {
      people: {},
      households: {},
      families: {},
      tax_units: {},
      spm_units: {},
    };

    let personIndex = 0;

    households.forEach((household, hIdx) => {
      const householdKey = `household_${hIdx + 1}`;
      const familyKey = `family_${hIdx + 1}`;
      const taxUnitKey = `tax_unit_${hIdx + 1}`;
      const spmUnitKey = `spm_unit_${hIdx + 1}`;

      householdData.households[householdKey] = { members: [] };
      householdData.families[familyKey] = { members: [] };
      householdData.tax_units[taxUnitKey] = { members: [] };
      householdData.spm_units[spmUnitKey] = { members: [] };

      household.people.forEach((person) => {
        const personKey = `person_${++personIndex}`;

        // Add all selected variables for this person
        householdData.people[personKey] = {};
        Object.entries(person.variables).forEach(([varName, value]) => {
          householdData.people[personKey][varName] = { [year]: value };
        });

        // Add to all group entities
        householdData.households[householdKey].members.push(personKey);
        householdData.families[familyKey].members.push(personKey);
        householdData.tax_units[taxUnitKey].members.push(personKey);
        householdData.spm_units[spmUnitKey].members.push(personKey);
      });
    });

    return householdData;
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      notifications.show({
        title: 'Validation error',
        message: 'Please enter a name for the population',
        color: 'red',
      });
      return;
    }

    if (households.length === 0) {
      notifications.show({
        title: 'Validation error',
        message: 'Please add at least one household',
        color: 'red',
      });
      return;
    }

    if (selectedVariables.length === 0) {
      notifications.show({
        title: 'Validation error',
        message: 'Please select at least one variable',
        color: 'red',
      });
      return;
    }

    const householdData = buildHouseholdData();

    createDatasetMutation.mutate({
      name,
      description,
      country: currentCountry,
      householdData,
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create custom household population"
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        <TextInput
          label="Population name"
          placeholder="Enter a name for this population"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />

        <Textarea
          label="Description"
          placeholder="Describe this population (optional)"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          minRows={2}
        />

        <Group grow>
          <TextInput
            label="Country"
            value={currentCountry.toUpperCase()}
            disabled
            description="Using currently selected country model"
          />

          <Select
            label="Year"
            value={year}
            onChange={(val) => setYear(val || '2024')}
            data={[
              { value: '2023', label: '2023' },
              { value: '2024', label: '2024' },
              { value: '2025', label: '2025' },
            ]}
            required
          />
        </Group>

        <Divider />

        <Stack gap="xs">
          <Group gap="xs">
            <IconVariable size={16} />
            <Text fw={600} size="sm">
              Variables to track ({selectedVariables.length})
            </Text>
          </Group>
          <MultiSelect
            placeholder="Select variables to track for each person"
            data={personVariables}
            value={selectedVariables}
            onChange={setSelectedVariables}
            searchable
            maxDropdownHeight={200}
            description="Choose which variables you want to set for people in this population"
          />
        </Stack>

        <Divider />

        <Group justify="space-between">
          <Text fw={600} size="sm">
            Households ({households.length})
          </Text>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={addHousehold}
            variant="light"
            size="sm"
          >
            Add household
          </Button>
        </Group>

        {households.length === 0 && (
          <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
            <Stack align="center" gap="xs">
              <IconUsers size={48} style={{ opacity: 0.3 }} />
              <Text c="dimmed" size="sm">
                No households yet. Click "Add household" to get started.
              </Text>
            </Stack>
          </Paper>
        )}

        {households.length > 0 && (
          <Accordion variant="separated">
            {households.map((household) => (
              <Accordion.Item key={household.id} value={household.id}>
                <Accordion.Control>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <Text fw={500}>{household.name}</Text>
                      <Badge size="sm" variant="light">
                        {household.people.length} {household.people.length === 1 ? 'person' : 'people'}
                      </Badge>
                    </Group>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    <TextInput
                      label="Household name"
                      value={household.name}
                      onChange={(e) =>
                        updateHousehold(household.id, { name: e.currentTarget.value })
                      }
                      placeholder="Enter household name"
                    />

                    <Divider label="People" />

                    {household.people.map((person) => (
                      <Paper key={person.id} p="sm" withBorder>
                        <Stack gap="xs">
                          <Group justify="space-between">
                            <TextInput
                              value={person.name}
                              onChange={(e) =>
                                updatePerson(household.id, person.id, 'name', e.currentTarget.value)
                              }
                              size="sm"
                              style={{ flex: 1 }}
                            />
                            {household.people.length > 1 && (
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                onClick={() => removePerson(household.id, person.id)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            )}
                          </Group>

                          {/* Dynamic variable inputs based on selected variables */}
                          <Group grow>
                            {selectedVariables.map((varName) => {
                              const varMeta = variables[varName] || {};
                              const label = varMeta?.label || varName.replace(/_/g, ' ');
                              const valueType = varMeta?.valueType || 'float';
                              const value = person.variables[varName] ?? 0;

                              // Determine if this is a monetary value
                              const isMonetary = varName.includes('income') ||
                                                 varName.includes('earnings') ||
                                                 varName.includes('wage') ||
                                                 varName.includes('salary');

                              return (
                                <NumberInput
                                  key={varName}
                                  label={label}
                                  value={typeof value === 'number' ? value : parseFloat(value as string) || 0}
                                  onChange={(val) =>
                                    updatePersonVariable(household.id, person.id, varName, val || 0)
                                  }
                                  min={0}
                                  max={varName === 'age' ? 120 : undefined}
                                  prefix={isMonetary ? '$' : undefined}
                                  thousandSeparator={isMonetary ? ',' : undefined}
                                  decimalScale={valueType === 'int' ? 0 : 2}
                                  size="xs"
                                />
                              );
                            })}
                          </Group>
                        </Stack>
                      </Paper>
                    ))}

                    <Group justify="space-between">
                      <Button
                        leftSection={<IconPlus size={14} />}
                        onClick={() => addPerson(household.id)}
                        variant="light"
                        size="xs"
                      >
                        Add person
                      </Button>
                      <Button
                        leftSection={<IconTrash size={14} />}
                        onClick={() => removeHousehold(household.id)}
                        variant="light"
                        color="red"
                        size="xs"
                      >
                        Remove household
                      </Button>
                    </Group>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}

        <Divider />

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={createDatasetMutation.isPending}
            disabled={!name.trim() || households.length === 0 || selectedVariables.length === 0}
          >
            Create population
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
