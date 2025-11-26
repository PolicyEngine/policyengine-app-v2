/**
 * HouseholdBuilderForm - Pure presentation component for household building UI
 *
 * Implements the Mockup 3 design with:
 * - Tax Year (read-only, from report context), Marital Status, Number of Children controls
 * - Individuals accordion with basic inputs (age, employment_income) + custom variables
 * - Household Variables accordion with basic inputs (state_name, etc.) + custom variables
 * - Inline search for adding custom variables per person or household-level
 */

import { useMemo, useState } from 'react';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import { Accordion, Alert, Button, Divider, Group, Select, Stack, Text } from '@mantine/core';
import { Household } from '@/types/ingredients/Household';
import { sortPeopleKeys } from '@/utils/householdIndividuals';
import {
  addVariable,
  addVariableToEntity,
  getInputVariables,
  getVariableEntityDisplayInfo,
  getVariableInfo,
  removeVariable,
  resolveEntity,
} from '@/utils/VariableResolver';
import VariableRow from './VariableRow';
import VariableSearchDropdown from './VariableSearchDropdown';

export interface HouseholdBuilderFormProps {
  household: Household;
  metadata: any;
  year: string;
  maritalStatus: 'single' | 'married';
  numChildren: number;
  basicPersonFields: string[]; // Basic inputs for person entity (e.g., age, employment_income)
  basicNonPersonFields: string[]; // Basic inputs for household-level entities
  onChange: (household: Household) => void;
  onMaritalStatusChange: (status: 'single' | 'married') => void;
  onNumChildrenChange: (num: number) => void;
  disabled?: boolean;
}

export default function HouseholdBuilderForm({
  household,
  metadata,
  year,
  maritalStatus,
  numChildren,
  basicPersonFields,
  basicNonPersonFields,
  onChange,
  onMaritalStatusChange,
  onNumChildrenChange,
  disabled = false,
}: HouseholdBuilderFormProps) {
  // State for custom variables
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);

  // Search state for person variables (per person)
  const [activePersonSearch, setActivePersonSearch] = useState<string | null>(null);
  const [personSearchValue, setPersonSearchValue] = useState('');
  const [isPersonSearchFocused, setIsPersonSearchFocused] = useState(false);

  // Search state for household variables
  const [isHouseholdSearchActive, setIsHouseholdSearchActive] = useState(false);
  const [householdSearchValue, setHouseholdSearchValue] = useState('');
  const [isHouseholdSearchFocused, setIsHouseholdSearchFocused] = useState(false);

  // Warning message state (shown when variable added to different entity than expected)
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Get all input variables from metadata
  const allInputVariables = useMemo(() => getInputVariables(metadata), [metadata]);

  // Get list of people, sorted in display order (you, partner, dependents)
  const people = useMemo(
    () => sortPeopleKeys(Object.keys(household.householdData.people || {})),
    [household]
  );

  // Helper to get person display name
  const getPersonDisplayName = (personKey: string): string => {
    const parts = personKey.split(' ');
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  // Filter variables by search value (no entity filtering - shows all)
  // No artificial limit - dropdown is scrollable with maxHeight
  const getFilteredVariables = (searchValue: string) => {
    if (!searchValue.trim()) {
      return allInputVariables;
    }
    const search = searchValue.toLowerCase();
    return allInputVariables.filter(
      (v) => v.label.toLowerCase().includes(search) || v.name.toLowerCase().includes(search)
    );
  };

  // Get variables for a specific person (custom only, not basic inputs)
  const getPersonVariables = (personName: string): string[] => {
    const personData = household.householdData.people[personName];
    if (!personData) {
      return [];
    }

    return selectedVariables.filter((varName) => {
      const entityInfo = resolveEntity(varName, metadata);
      // Exclude basic inputs - they're shown permanently above
      const isBasicInput = basicPersonFields.includes(varName);
      return entityInfo?.isPerson && personData[varName] !== undefined && !isBasicInput;
    });
  };

  // Get all household-level variables (consolidated from tax_unit, spm_unit, household)
  // Exclude basic inputs which are shown permanently
  const householdLevelVariables = useMemo(() => {
    return selectedVariables
      .filter((varName) => {
        const entityInfo = resolveEntity(varName, metadata);
        // Exclude basic inputs - they're shown permanently above
        const isBasicInput = basicNonPersonFields.includes(varName);
        return !entityInfo?.isPerson && !isBasicInput;
      })
      .map((varName) => {
        const entityInfo = resolveEntity(varName, metadata);
        return { name: varName, entity: entityInfo?.plural || 'households' };
      });
  }, [selectedVariables, metadata, basicNonPersonFields]);

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
    const { isPerson, label: entityLabel } = getVariableEntityDisplayInfo(variable.name, metadata);

    // If non-person variable selected from person context, show warning
    if (!isPerson) {
      setWarningMessage(
        `"${variable.label}" is a ${entityLabel}-level variable and was added to household variables.`
      );
      // Auto-dismiss warning after 5 seconds
      setTimeout(() => setWarningMessage(null), 5000);
    } else {
      setWarningMessage(null);
    }

    // addVariableToEntity handles routing to correct entity based on metadata
    const newHousehold = addVariableToEntity(household, variable.name, metadata, year, person);
    onChange(newHousehold);

    if (!selectedVariables.includes(variable.name)) {
      setSelectedVariables([...selectedVariables, variable.name]);
    }

    setActivePersonSearch(null);
    setPersonSearchValue('');
    setIsPersonSearchFocused(false);
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

  // Handle opening household search
  const handleOpenHouseholdSearch = () => {
    setIsHouseholdSearchActive(true);
    setHouseholdSearchValue('');
    setIsHouseholdSearchFocused(true);
  };

  // Handle household variable selection
  const handleHouseholdVariableSelect = (variable: { name: string; label: string }) => {
    const { isPerson } = getVariableEntityDisplayInfo(variable.name, metadata);

    // If person variable selected from household context, show warning
    if (isPerson) {
      setWarningMessage(
        `"${variable.label}" is a person-level variable and was added to all household members.`
      );
      // Auto-dismiss warning after 5 seconds
      setTimeout(() => setWarningMessage(null), 5000);
    } else {
      setWarningMessage(null);
    }

    let newHousehold: Household;
    if (isPerson) {
      // For person-level variables selected from household, add to ALL people
      // Always call addVariable to ensure new members get it too
      newHousehold = addVariable(household, variable.name, metadata, year);
    } else {
      // For non-person variables, only add if not already present
      if (selectedVariables.includes(variable.name)) {
        setIsHouseholdSearchActive(false);
        setHouseholdSearchValue('');
        setIsHouseholdSearchFocused(false);
        return;
      }
      newHousehold = addVariableToEntity(
        household,
        variable.name,
        metadata,
        year,
        'your household'
      );
    }
    onChange(newHousehold);
    if (!selectedVariables.includes(variable.name)) {
      setSelectedVariables([...selectedVariables, variable.name]);
    }

    setIsHouseholdSearchActive(false);
    setHouseholdSearchValue('');
    setIsHouseholdSearchFocused(false);
  };

  // Handle removing household variable
  const handleRemoveHouseholdVariable = (varName: string) => {
    const newHousehold = removeVariable(household, varName, metadata);
    onChange(newHousehold);
    setSelectedVariables(selectedVariables.filter((v) => v !== varName));
  };

  return (
    <Stack gap="lg">
      {/* Floating notification when variable added to different entity */}
      {warningMessage && (
        <Alert
          icon={<IconInfoCircle size={16} />}
          color="blue"
          withCloseButton
          onClose={() => setWarningMessage(null)}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            maxWidth: 400,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          {warningMessage}
        </Alert>
      )}

      {/* Household Information */}
      <Stack gap="md">
        {/* Marital Status and Children - side by side */}
        <Group grow>
          <Select
            label="Marital Status"
            value={maritalStatus}
            onChange={(val) => onMaritalStatusChange((val || 'single') as 'single' | 'married')}
            data={[
              { value: 'single', label: 'Single' },
              { value: 'married', label: 'Married' },
            ]}
            disabled={disabled}
          />

          <Select
            label="Number of Children"
            value={numChildren.toString()}
            onChange={(val) => onNumChildrenChange(parseInt(val || '0', 10))}
            data={[
              { value: '0', label: '0' },
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5' },
            ]}
            disabled={disabled}
          />
        </Group>
      </Stack>

      <Divider />

      {/* Main Accordion Sections - all open by default */}
      <Accordion defaultValue={['individuals', 'household-vars']} multiple>
        {/* Individuals / Members Section */}
        <Accordion.Item value="individuals">
          <Accordion.Control>
            <Text fw={500}>Individuals</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Accordion key={people.join(',')} defaultValue={people} multiple>
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
                        {/* Basic person inputs (dynamically from metadata) */}
                        {basicPersonFields.map((fieldName) => {
                          const variable = getVariableInfo(fieldName, metadata);
                          if (!variable) {
                            return null;
                          }
                          return (
                            <VariableRow
                              key={fieldName}
                              variable={variable}
                              household={household}
                              metadata={metadata}
                              year={year}
                              entityName={person}
                              onChange={onChange}
                              disabled={disabled}
                            />
                          );
                        })}

                        {/* Custom variables for this person */}
                        {personVars.map((varName) => {
                          const variable = allInputVariables.find((v) => v.name === varName);
                          if (!variable) {
                            return null;
                          }
                          return (
                            <VariableRow
                              key={varName}
                              variable={variable}
                              household={household}
                              metadata={metadata}
                              year={year}
                              entityName={person}
                              onChange={onChange}
                              onRemove={() => handleRemovePersonVariable(varName, person)}
                              disabled={disabled}
                            />
                          );
                        })}

                        {/* Add variable search or link */}
                        {activePersonSearch === person ? (
                          <VariableSearchDropdown
                            searchValue={personSearchValue}
                            onSearchChange={setPersonSearchValue}
                            isFocused={isPersonSearchFocused}
                            onFocusChange={setIsPersonSearchFocused}
                            filteredVariables={getFilteredVariables(personSearchValue)}
                            onSelect={(variable) => handlePersonVariableSelect(variable, person)}
                            getBadgeInfo={(variable) => {
                              const { isPerson, label: entityLabel } = getVariableEntityDisplayInfo(
                                variable.name,
                                metadata
                              );
                              return { show: !isPerson, label: entityLabel };
                            }}
                            disabled={disabled}
                          />
                        ) : (
                          <Button
                            variant="subtle"
                            size="compact-sm"
                            leftSection={<IconPlus size={14} />}
                            onClick={() => handleOpenPersonSearch(person)}
                            styles={{ label: { fontStyle: 'italic' } }}
                          >
                            Add variable to {getPersonDisplayName(person)}
                          </Button>
                        )}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Household Variables Section */}
        <Accordion.Item value="household-vars">
          <Accordion.Control>
            <Text fw={500}>Household</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              {/* Basic household inputs (like state_name) */}
              {basicNonPersonFields.map((fieldName) => {
                const variable = getVariableInfo(fieldName, metadata);
                if (!variable) {
                  return null;
                }
                return (
                  <VariableRow
                    key={fieldName}
                    variable={variable}
                    household={household}
                    metadata={metadata}
                    year={year}
                    onChange={onChange}
                    disabled={disabled}
                  />
                );
              })}

              {/* Custom household-level variables */}
              {householdLevelVariables.map(({ name: varName, entity }) => {
                const variable = allInputVariables.find((v) => v.name === varName);
                if (!variable) {
                  return null;
                }
                return (
                  <VariableRow
                    key={`${entity}-${varName}`}
                    variable={variable}
                    household={household}
                    metadata={metadata}
                    year={year}
                    onChange={onChange}
                    onRemove={() => handleRemoveHouseholdVariable(varName)}
                    disabled={disabled}
                  />
                );
              })}

              {/* Add variable search or link */}
              {isHouseholdSearchActive ? (
                <VariableSearchDropdown
                  searchValue={householdSearchValue}
                  onSearchChange={setHouseholdSearchValue}
                  isFocused={isHouseholdSearchFocused}
                  onFocusChange={setIsHouseholdSearchFocused}
                  filteredVariables={getFilteredVariables(householdSearchValue)}
                  onSelect={handleHouseholdVariableSelect}
                  getBadgeInfo={(variable) => {
                    const { isPerson } = getVariableEntityDisplayInfo(variable.name, metadata);
                    return { show: isPerson, label: 'person' };
                  }}
                  disabled={disabled}
                />
              ) : (
                <Button
                  variant="subtle"
                  size="compact-sm"
                  leftSection={<IconPlus size={14} />}
                  onClick={handleOpenHouseholdSearch}
                  styles={{ label: { fontStyle: 'italic' } }}
                >
                  Add variable
                </Button>
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
