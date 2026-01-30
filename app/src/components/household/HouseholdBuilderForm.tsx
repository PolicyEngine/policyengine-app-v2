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
import { colors, spacing } from '@/designTokens';
import { Household, HouseholdPerson } from '@/types/ingredients/Household';
import { getPersonDisplayName, sortPeopleByOrder } from '@/utils/householdIndividuals';
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
  const [activePersonSearch, setActivePersonSearch] = useState<number | null>(null);
  const [personSearchValue, setPersonSearchValue] = useState('');
  const [, setIsPersonSearchFocused] = useState(false);

  // Search state for household variables
  const [isHouseholdSearchActive, setIsHouseholdSearchActive] = useState(false);
  const [householdSearchValue, setHouseholdSearchValue] = useState('');
  const [, setIsHouseholdSearchFocused] = useState(false);

  // Warning message state (shown when variable added to different entity than expected)
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Get all input variables from metadata
  const allInputVariables = useMemo(() => getInputVariables(metadata), [metadata]);

  // Get list of people, sorted in display order (you, partner, dependents)
  const sortedPeople = useMemo(() => sortPeopleByOrder(household.people || []), [household]);

  // Maximum number of results to display in dropdown for performance
  const MAX_DROPDOWN_RESULTS = 100;

  // Filter variables by search value with result limit for performance
  const filterVariables = (searchValue: string) => {
    if (!searchValue.trim()) {
      return {
        variables: allInputVariables.slice(0, MAX_DROPDOWN_RESULTS),
        truncated: allInputVariables.length > MAX_DROPDOWN_RESULTS,
      };
    }
    const search = searchValue.toLowerCase();
    const filtered = allInputVariables.filter(
      (v) => v.label.toLowerCase().includes(search) || v.name.toLowerCase().includes(search)
    );
    return {
      variables: filtered.slice(0, MAX_DROPDOWN_RESULTS),
      truncated: filtered.length > MAX_DROPDOWN_RESULTS,
    };
  };

  // Memoized filtered variables for person search
  const filteredPersonVariables = useMemo(
    () => filterVariables(personSearchValue),
    [personSearchValue, allInputVariables]
  );

  // Memoized filtered variables for household search
  const filteredHouseholdVariables = useMemo(
    () => filterVariables(householdSearchValue),
    [householdSearchValue, allInputVariables]
  );

  // Get variables for a specific person (custom only, not basic inputs)
  const getPersonVariables = (person: HouseholdPerson): string[] => {
    return selectedVariables.filter((varName) => {
      const entityInfo = resolveEntity(varName, metadata);
      // Exclude basic inputs - they're shown permanently above
      const isBasicInput = basicPersonFields.includes(varName);
      return entityInfo?.isPerson && person[varName] !== undefined && !isBasicInput;
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
  const handleOpenPersonSearch = (personId: number) => {
    setActivePersonSearch(personId);
    setPersonSearchValue('');
    setIsPersonSearchFocused(true);
  };

  // Handle person variable selection
  const handlePersonVariableSelect = (
    variable: { name: string; label: string },
    personId: number
  ) => {
    const { isPerson } = getVariableEntityDisplayInfo(variable.name, metadata);

    // If non-person variable selected from person context, show warning
    if (!isPerson) {
      setWarningMessage(
        `"${variable.label}" is a variable applied household-wide. It was added to your household variables.`
      );
      // Auto-dismiss warning after 5 seconds
      setTimeout(() => setWarningMessage(null), 5000);
    } else {
      setWarningMessage(null);
    }

    // addVariableToEntity handles routing to correct entity based on metadata
    const newHousehold = addVariableToEntity(household, variable.name, metadata, personId);
    onChange(newHousehold);

    if (!selectedVariables.includes(variable.name)) {
      setSelectedVariables([...selectedVariables, variable.name]);
    }

    setActivePersonSearch(null);
    setPersonSearchValue('');
    setIsPersonSearchFocused(false);
  };

  // Handle removing person variable
  const handleRemovePersonVariable = (varName: string, personId: number) => {
    // Remove the variable data from this person's household data
    const newHousehold = JSON.parse(JSON.stringify(household)) as Household;
    const person = newHousehold.people.find((p) => p.person_id === personId);
    if (person && person[varName] !== undefined) {
      delete person[varName];
    }
    onChange(newHousehold);

    // Check if any other person still has this variable
    const stillUsedByOthers = newHousehold.people.some(
      (p) => p.person_id !== personId && p[varName] !== undefined
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
        `"${variable.label}" is a variable applied to an individual. It was added to all household members.`
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
      newHousehold = addVariable(household, variable.name, metadata);
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
        0 // Default entity ID
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
          color="teal"
          variant="outline"
          withCloseButton
          onClose={() => setWarningMessage(null)}
          style={{
            position: 'fixed',
            top: `calc(${spacing.appShell.header.height} + ${spacing.xl})`,
            right: spacing.xl,
            maxWidth: 400,
            zIndex: 1000,
            opacity: 1,
            backgroundColor: colors.white,
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
            label="Marital status"
            value={maritalStatus}
            onChange={(val) => onMaritalStatusChange((val || 'single') as 'single' | 'married')}
            data={[
              { value: 'single', label: 'Single' },
              { value: 'married', label: 'Married' },
            ]}
            disabled={disabled}
          />

          <Select
            label="Number of children"
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
            <Accordion
              key={sortedPeople.map((p) => p.person_id).join(',')}
              defaultValue={sortedPeople.map((p) => String(p.person_id ?? 0))}
              multiple
            >
              {sortedPeople.map((person) => {
                const personId = person.person_id ?? 0;
                const displayName = getPersonDisplayName(person);
                const displayNameCapitalized =
                  displayName.charAt(0).toUpperCase() + displayName.slice(1);
                const personVars = getPersonVariables(person);

                return (
                  <Accordion.Item key={personId} value={String(personId)}>
                    <Accordion.Control>
                      <Text fw={600} size="sm">
                        {displayNameCapitalized}
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
                              entityId={personId}
                              onChange={onChange}
                              disabled={disabled}
                              showRemoveColumn
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
                              entityId={personId}
                              onChange={onChange}
                              onRemove={() => handleRemovePersonVariable(varName, personId)}
                              disabled={disabled}
                            />
                          );
                        })}

                        {/* Add variable search or link */}
                        {activePersonSearch === personId ? (
                          <VariableSearchDropdown
                            searchValue={personSearchValue}
                            onSearchChange={setPersonSearchValue}
                            onFocusChange={setIsPersonSearchFocused}
                            filteredVariables={filteredPersonVariables.variables}
                            truncated={filteredPersonVariables.truncated}
                            onSelect={(variable) => handlePersonVariableSelect(variable, personId)}
                            getEntityHint={(variable) => {
                              const { isPerson } = getVariableEntityDisplayInfo(
                                variable.name,
                                metadata
                              );
                              return { show: !isPerson, label: 'Household' };
                            }}
                            disabled={disabled}
                            onClose={() => {
                              setActivePersonSearch(null);
                              setPersonSearchValue('');
                              setIsPersonSearchFocused(false);
                            }}
                          />
                        ) : (
                          <Button
                            // variant="default"
                            variant="subtle"
                            size="compact-sm"
                            leftSection={<IconPlus size={14} />}
                            onClick={() => handleOpenPersonSearch(personId)}
                            style={{ alignSelf: 'flex-start' }}
                          >
                            Add variable to {displayName}
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
                    onChange={onChange}
                    disabled={disabled}
                    showRemoveColumn
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
                  onFocusChange={setIsHouseholdSearchFocused}
                  filteredVariables={filteredHouseholdVariables.variables}
                  truncated={filteredHouseholdVariables.truncated}
                  onSelect={handleHouseholdVariableSelect}
                  getEntityHint={(variable) => {
                    const { isPerson } = getVariableEntityDisplayInfo(variable.name, metadata);
                    return { show: isPerson, label: 'Person' };
                  }}
                  disabled={disabled}
                  onClose={() => {
                    setIsHouseholdSearchActive(false);
                    setHouseholdSearchValue('');
                    setIsHouseholdSearchFocused(false);
                  }}
                />
              ) : (
                <Button
                  variant="subtle"
                  size="compact-sm"
                  leftSection={<IconPlus size={14} />}
                  onClick={handleOpenHouseholdSearch}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Add variable to your household
                </Button>
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
