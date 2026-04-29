/**
 * HouseholdBuilderForm - Pure presentation component for household building UI
 *
 * Implements the Mockup 3 design with:
 * - Tax Year (read-only, from report context), Marital Status, Number of Children controls
 * - Individuals accordion with basic inputs (age, employment_income) + custom variables
 * - Household Variables accordion with basic inputs (state_name, etc.) + custom variables
 * - Inline search for adding custom variables per person or household-level
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { Household as HouseholdModel } from '@/models/Household';
import { GROUP_META_KEYS, PERSON_META_KEYS } from '@/models/household/schema';
import { sortPeopleKeys } from '@/utils/householdIndividuals';
import {
  addVariable,
  addVariableToEntity,
  getInputVariables,
  getVariableEntityDisplayInfo,
  getVariableInfo,
  removeVariableFromEntity,
  resolveEntity,
} from '@/utils/VariableResolver';
import VariableRow from './VariableRow';
import VariableSearchDropdown from './VariableSearchDropdown';

export interface HouseholdBuilderFormProps {
  household: HouseholdModel;
  metadata: any;
  year: string;
  maritalStatus: 'single' | 'married';
  numChildren: number;
  basicPersonFields: string[]; // Basic inputs for person entity (e.g., age, employment_income)
  basicNonPersonFields: string[]; // Basic inputs for household-level entities
  onChange: (household: HouseholdModel) => void;
  onMaritalStatusChange: (status: 'single' | 'married') => void;
  onNumChildrenChange: (num: number) => void;
  disabled?: boolean;
  isReadOnly?: boolean;
}

interface BuilderWarning {
  title: string;
  description: string;
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
  isReadOnly = false,
}: HouseholdBuilderFormProps) {
  // Search state for person variables (per person)
  const [activePersonSearch, setActivePersonSearch] = useState<string | null>(null);
  const [personSearchValue, setPersonSearchValue] = useState('');
  const [, setIsPersonSearchFocused] = useState(false);

  // Search state for household variables
  const [isHouseholdSearchActive, setIsHouseholdSearchActive] = useState(false);
  const [householdSearchValue, setHouseholdSearchValue] = useState('');
  const [, setIsHouseholdSearchFocused] = useState(false);

  // Warning message state (shown when variable added to different entity than expected)
  const [warningMessage, setWarningMessage] = useState<BuilderWarning | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, []);

  const householdData = useMemo(() => household.householdData, [household]);

  // Get all input variables from metadata
  const allInputVariables = useMemo(() => getInputVariables(metadata), [metadata]);
  const inputVariableLookup = useMemo(
    () => new Map(allInputVariables.map((variable) => [variable.name, variable])),
    [allInputVariables]
  );

  // Get list of people, sorted in display order (you, partner, dependents)
  const people = useMemo(
    () => sortPeopleKeys(Object.keys(householdData.people || {})),
    [householdData]
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

  const resolveDefaultGroupInstanceName = (variableName: string): string | undefined => {
    const entityInfo = resolveEntity(variableName, metadata);
    if (!entityInfo || entityInfo.isPerson) {
      return undefined;
    }

    return household.getPreferredGroupName(entityInfo.plural);
  };

  const showWarning = (warning: BuilderWarning) => {
    setWarningMessage(warning);

    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    warningTimerRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, 5000);
  };

  // Get variables for a specific person (custom only, not basic inputs)
  const getPersonVariables = (personName: string): string[] => {
    const personData = householdData.people[personName];
    if (!personData) {
      return [];
    }

    return Object.keys(personData)
      .filter((varName) => {
        if (PERSON_META_KEYS.has(varName) || basicPersonFields.includes(varName)) {
          return false;
        }

        const entityInfo = resolveEntity(varName, metadata);
        return (
          entityInfo?.isPerson &&
          personData[varName] !== undefined &&
          inputVariableLookup.has(varName)
        );
      })
      .sort((left, right) =>
        (inputVariableLookup.get(left)?.label || left).localeCompare(
          inputVariableLookup.get(right)?.label || right
        )
      );
  };

  // Get all household-level variables (consolidated from tax_unit, spm_unit, household)
  // Exclude basic inputs which are shown permanently
  const householdLevelVariables = useMemo(() => {
    const variables: Array<{ name: string; entity: string; entityName: string }> = [];

    household.getConfiguredGroupCollections().forEach(({ entityName, groups }) => {
      Object.entries(groups).forEach(([groupName, group]) => {
        Object.keys(group)
          .filter((varName) => {
            if (GROUP_META_KEYS.has(varName) || basicNonPersonFields.includes(varName)) {
              return false;
            }

            const entityInfo = resolveEntity(varName, metadata);
            return (
              !entityInfo?.isPerson &&
              group[varName] !== undefined &&
              inputVariableLookup.has(varName)
            );
          })
          .forEach((varName) => {
            variables.push({
              name: varName,
              entity: entityName,
              entityName: groupName,
            });
          });
      });
    });

    return variables.sort((left, right) =>
      `${inputVariableLookup.get(left.name)?.label || left.name}:${left.entityName}`.localeCompare(
        `${inputVariableLookup.get(right.name)?.label || right.name}:${right.entityName}`
      )
    );
  }, [basicNonPersonFields, household, inputVariableLookup, metadata]);

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
      showWarning({
        title: 'Added to household variables',
        description: `"${variable.label}" applies household-wide, so it was added under Household.`,
      });
    } else {
      setWarningMessage(null);
    }

    // addVariableToEntity handles routing to correct entity based on metadata
    const newHousehold = addVariableToEntity(household, variable.name, metadata, year, person);
    onChange(newHousehold);

    setActivePersonSearch(null);
    setPersonSearchValue('');
    setIsPersonSearchFocused(false);
  };

  // Handle removing person variable
  const handleRemovePersonVariable = (varName: string, person: string) => {
    const newHousehold = removeVariableFromEntity(household, varName, metadata, person);
    onChange(newHousehold);
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
      showWarning({
        title: 'Added to all household members',
        description: `"${variable.label}" applies to individuals, so it was added to each household member.`,
      });
    } else {
      setWarningMessage(null);
    }

    let newHousehold: HouseholdModel;
    if (isPerson) {
      // For person-level variables selected from household, add to ALL people
      // Always call addVariable to ensure new members get it too
      newHousehold = addVariable(household, variable.name, metadata, year);
    } else {
      // For non-person variables, only add if not already present
      const existingEntityInfo = householdLevelVariables.find(
        (entry) => entry.name === variable.name
      );
      if (existingEntityInfo) {
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
        resolveDefaultGroupInstanceName(variable.name)
      );
    }
    onChange(newHousehold);

    setIsHouseholdSearchActive(false);
    setHouseholdSearchValue('');
    setIsHouseholdSearchFocused(false);
  };

  // Handle removing household variable
  const handleRemoveHouseholdVariable = (varName: string, entityName: string) => {
    const newHousehold = removeVariableFromEntity(household, varName, metadata, entityName);
    onChange(newHousehold);
  };

  return (
    <Stack gap="lg">
      {/* Floating notification when variable added to different entity */}
      {warningMessage && (
        <div
          className="tw:fixed tw:z-[1000]"
          style={{
            top: `calc(60px + ${spacing.xl})`,
            right: spacing.xl,
            maxWidth: 'min(400px, calc(100vw - 40px))',
          }}
        >
          <Card className="tw:gap-0 tw:border-border/70 tw:shadow-lg">
            <CardContent className="tw:px-4 tw:py-4">
              <div className="tw:flex tw:items-start tw:gap-3">
                <div className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary-100 tw:text-primary-700">
                  <IconInfoCircle size={20} />
                </div>
                <div className="tw:min-w-0 tw:flex-1">
                  <Text fw={typography.fontWeight.semibold}>{warningMessage.title}</Text>
                  <Text
                    size="sm"
                    style={{
                      color: colors.gray[600],
                      marginTop: spacing.xs,
                    }}
                  >
                    {warningMessage.description}
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Household Information */}
      <Stack gap="md">
        {/* Marital Status and Children - side by side */}
        <div className="tw:grid tw:grid-cols-2 tw:gap-4">
          <div className="tw:flex tw:flex-col tw:gap-[6px]">
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

          <div className="tw:flex tw:flex-col tw:gap-[6px]">
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
            <Text fw={typography.fontWeight.medium}>Individuals</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Accordion type="multiple" key={people.join(',')} defaultValue={people}>
              {people.map((person) => {
                const personVars = getPersonVariables(person);

                return (
                  <AccordionItem key={person} value={person}>
                    <AccordionTrigger>
                      <Text fw={typography.fontWeight.semibold} size="sm">
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
                          const variable = inputVariableLookup.get(varName);
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
                              onRemove={
                                isReadOnly
                                  ? undefined
                                  : () => handleRemovePersonVariable(varName, person)
                              }
                              disabled={disabled}
                            />
                          );
                        })}

                        {/* Add variable search or link */}
                        {!isReadOnly && activePersonSearch === person ? (
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
                        ) : !isReadOnly ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPersonSearch(person)}
                            className="tw:self-start"
                          >
                            <IconPlus size={14} />
                            Add variable to {getPersonDisplayName(person)}
                          </Button>
                        ) : null}
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
            <Text fw={typography.fontWeight.medium}>Household</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Stack gap="md">
              {/* Basic household inputs (like state_name) */}
              {basicNonPersonFields.map((fieldName) => {
                const variable = getVariableInfo(fieldName, metadata);
                if (!variable) {
                  return null;
                }
                const entityName = resolveDefaultGroupInstanceName(fieldName);
                return (
                  <VariableRow
                    key={fieldName}
                    variable={variable}
                    household={household}
                    metadata={metadata}
                    year={year}
                    entityName={entityName}
                    onChange={onChange}
                    disabled={disabled}
                    showRemoveColumn
                  />
                );
              })}

              {/* Custom household-level variables */}
              {householdLevelVariables.map(({ name: varName, entity, entityName }) => {
                const variable = inputVariableLookup.get(varName);
                if (!variable) {
                  return null;
                }
                return (
                  <VariableRow
                    key={`${entity}-${entityName}-${varName}`}
                    variable={variable}
                    household={household}
                    metadata={metadata}
                    year={year}
                    entityName={entityName}
                    onChange={onChange}
                    onRemove={
                      isReadOnly
                        ? undefined
                        : () => handleRemoveHouseholdVariable(varName, entityName)
                    }
                    disabled={disabled}
                  />
                );
              })}

              {/* Add variable search or link */}
              {!isReadOnly && isHouseholdSearchActive ? (
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
              ) : !isReadOnly ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenHouseholdSearch}
                  className="tw:self-start"
                >
                  <IconPlus size={14} />
                  Add variable to your household
                </Button>
              ) : null}
            </Stack>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Stack>
  );
}
