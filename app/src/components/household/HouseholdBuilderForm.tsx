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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
} from '@/components/ui';
import { colors, spacing } from '@/designTokens';
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
  const people = useMemo(
    () => sortPeopleKeys(Object.keys(household.householdData.people || {})),
    [household]
  );

  // Helper to get person display name (entirely lowercase)
  const getPersonDisplayName = (personKey: string): string => {
    return personKey.toLowerCase();
  };

  // Helper to get person display name with first letter capitalized
  const getPersonDisplayNameCapitalized = (personKey: string): string => {
    const lowercase = personKey.toLowerCase();
    return lowercase.charAt(0).toUpperCase() + lowercase.slice(1);
  };

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
          variant="default"
          className="tw:fixed tw:z-[1000] tw:opacity-100 tw:bg-white"
          style={{
            top: `calc(60px + ${spacing.xl})`,
            right: spacing.xl,
            maxWidth: 'min(400px, calc(100vw - 40px))',
            border: `1px solid ${colors.primary[500]}`,
          }}
        >
          <IconInfoCircle size={16} />
          <AlertDescription>{warningMessage}</AlertDescription>
          <button
            type="button"
            onClick={() => setWarningMessage(null)}
            className="tw:absolute tw:top-2 tw:right-2 tw:bg-transparent tw:border-none tw:cursor-pointer tw:p-1"
          >
            ×
          </button>
        </Alert>
      )}

      {/* Household Information */}
      <Stack gap="md">
        {/* Marital Status and Children - side by side */}
        <div className="tw:grid tw:grid-cols-2 tw:gap-4">
          <div>
            <Label>Marital status</Label>
            <Select
              value={maritalStatus}
              onValueChange={(val) =>
                onMaritalStatusChange((val || 'single') as 'single' | 'married')
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Number of children</Label>
            <Select
              value={numChildren.toString()}
              onValueChange={(val) => onNumChildrenChange(parseInt(val || '0', 10))}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Stack>

      <hr className="tw:border-border-light" />

      {/* Main Accordion Sections - all open by default */}
      <Accordion type="multiple" defaultValue={['individuals', 'household-vars']}>
        {/* Individuals / Members Section */}
        <AccordionItem value="individuals">
          <AccordionTrigger>
            <Text fw={500}>Individuals</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Accordion type="multiple" key={people.join(',')} defaultValue={people}>
              {people.map((person) => {
                const personVars = getPersonVariables(person);

                return (
                  <AccordionItem key={person} value={person}>
                    <AccordionTrigger>
                      <Text fw={600} size="sm">
                        {getPersonDisplayNameCapitalized(person)}
                      </Text>
                    </AccordionTrigger>
                    <AccordionContent>
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
                            onFocusChange={setIsPersonSearchFocused}
                            filteredVariables={filteredPersonVariables.variables}
                            truncated={filteredPersonVariables.truncated}
                            onSelect={(variable) => handlePersonVariableSelect(variable, person)}
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
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPersonSearch(person)}
                            className="tw:self-start"
                          >
                            <IconPlus size={14} />
                            Add variable to {getPersonDisplayName(person)}
                          </Button>
                        )}
                      </Stack>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </AccordionContent>
        </AccordionItem>

        {/* Household Variables Section */}
        <AccordionItem value="household-vars">
          <AccordionTrigger>
            <Text fw={500}>Household</Text>
          </AccordionTrigger>
          <AccordionContent>
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
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenHouseholdSearch}
                  className="tw:self-start"
                >
                  <IconPlus size={14} />
                  Add variable to your household
                </Button>
              )}
            </Stack>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Stack>
  );
}
