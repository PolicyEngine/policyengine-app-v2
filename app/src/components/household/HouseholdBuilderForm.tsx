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
import {
  addVariable,
  addVariableToEntity,
  getInputVariables,
  getVariableEntityDisplayInfo,
  getVariableInfo,
  removeVariableFromEntity,
  resolveEntity,
  VariableInfo,
} from '@/utils/VariableResolver';
import SPMGeographyChoice from './SPMGeographyChoice';
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
  /** Leave out the SPM geography choice; the household keeps its own. */
  hideSpmGeography?: boolean;
  /** "columns" sets the sections side by side on a wide screen; stacked by default. */
  layout?: 'stacked' | 'columns';
  /** Variables to list first in the variable search, in order, under their own heading. */
  suggestedVariables?: string[];
  /** The heading over the suggested variables. */
  suggestedLabel?: string;
  /**
   * "relevance" ranks matches (whole words before parts of words, all
   * words of the search required); "substring", the default, lists every
   * label containing the text, in metadata order.
   */
  searchRanking?: 'substring' | 'relevance';
  /** Groups the variable search (see VariableSearchDropdown); a plain list when unset. */
  variableGroupOf?: (variable: VariableInfo) => string;
  variableGroupOrder?: readonly string[];
  /** Leaves variables out of the search, e.g. other states' programs. */
  variableFilter?: (variable: VariableInfo) => boolean;
}

/**
 * How well one search word matches a variable: its whole label or name
 * (0), the start of either (1), the start of a word in them (2), or
 * inside a word (3, so "rent" still finds "parent" but after "Rent").
 */
function wordMatchScore(word: string, label: string, name: string): number | null {
  if (label === word || name === word) {
    return 0;
  }
  if (label.startsWith(word) || name.startsWith(word)) {
    return 1;
  }
  const wordStart = new RegExp(`(^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  if (wordStart.test(label) || wordStart.test(name.replaceAll('_', ' '))) {
    return 2;
  }
  if (label.includes(word) || name.includes(word)) {
    return 3;
  }
  return null;
}

/** Variables matching every word of the search, best matches first, then shorter labels. */
export function rankVariablesBySearch(variables: VariableInfo[], search: string): VariableInfo[] {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  const scored: Array<{ variable: VariableInfo; score: number }> = [];
  for (const variable of variables) {
    const label = variable.label.toLowerCase();
    const name = variable.name.toLowerCase();
    let score = 0;
    for (const word of words) {
      const wordScore = wordMatchScore(word, label, name);
      if (wordScore === null) {
        score = -1;
        break;
      }
      score += wordScore;
    }
    if (score >= 0) {
      scored.push({ variable, score });
    }
  }
  return scored
    .sort((a, b) => a.score - b.score || a.variable.label.length - b.variable.label.length)
    .map(({ variable }) => variable);
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
  hideSpmGeography = false,
  layout = 'stacked',
  suggestedVariables,
  suggestedLabel = 'Suggested',
  searchRanking = 'substring',
  variableGroupOf,
  variableGroupOrder,
  variableFilter,
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

  // Get all input variables from metadata
  const allInputVariables = useMemo(
    () =>
      variableFilter
        ? getInputVariables(metadata).filter(variableFilter)
        : getInputVariables(metadata),
    [metadata, variableFilter]
  );
  const inputVariableLookup = useMemo(
    () => new Map(allInputVariables.map((variable) => [variable.name, variable])),
    [allInputVariables]
  );

  // Get list of people, sorted in display order (you, partner, dependents)
  const people = useMemo(() => household.getSortedPersonNames(), [household]);

  // Helper to get person display name (entirely lowercase)
  const getPersonDisplayName = (personKey: string): string => {
    return personKey.toLowerCase();
  };

  // Helper to get person display name with first letter capitalized
  const getPersonDisplayNameCapitalized = (personKey: string): string => {
    const lowercase = personKey.toLowerCase();
    return lowercase.charAt(0).toUpperCase() + lowercase.slice(1);
  };

  // Maximum number of results to display in dropdown for performance; a
  // grouped list shows a few per group, so it takes every match.
  const MAX_DROPDOWN_RESULTS = variableGroupOf ? Infinity : 100;

  // Suggested variables lead the list, in their own order; the rest keep theirs.
  const suggestedOrder = useMemo(
    () => new Map((suggestedVariables ?? []).map((name, index) => [name, index])),
    [suggestedVariables]
  );
  const leadWithSuggested = (list: VariableInfo[]): VariableInfo[] =>
    suggestedOrder.size === 0
      ? list
      : [
          ...list
            .filter((variable) => suggestedOrder.has(variable.name))
            .sort((a, b) => suggestedOrder.get(a.name)! - suggestedOrder.get(b.name)!),
          ...list.filter((variable) => !suggestedOrder.has(variable.name)),
        ];

  // Filter variables by search value with result limit for performance
  const filterVariables = (searchValue: string) => {
    if (!searchValue.trim()) {
      return {
        variables: leadWithSuggested(allInputVariables).slice(0, MAX_DROPDOWN_RESULTS),
        truncated: allInputVariables.length > MAX_DROPDOWN_RESULTS,
      };
    }
    const search = searchValue.toLowerCase();
    const filtered =
      searchRanking === 'relevance'
        ? rankVariablesBySearch(allInputVariables, searchValue)
        : allInputVariables.filter(
            (v) => v.label.toLowerCase().includes(search) || v.name.toLowerCase().includes(search)
          );
    return {
      // A typed search ranks by its own match; suggestions lead only the open list.
      variables: filtered.slice(0, MAX_DROPDOWN_RESULTS),
      truncated: filtered.length > MAX_DROPDOWN_RESULTS,
    };
  };

  // Memoized filtered variables for person search
  const filteredPersonVariables = useMemo(
    () => filterVariables(personSearchValue),
    [personSearchValue, allInputVariables, suggestedOrder]
  );

  // Memoized filtered variables for household search
  const filteredHouseholdVariables = useMemo(
    () => filterVariables(householdSearchValue),
    [householdSearchValue, allInputVariables, suggestedOrder]
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
    return household
      .getPersonLevelVariables(personName)
      .filter((varName) => {
        if (basicPersonFields.includes(varName)) {
          return false;
        }

        const entityInfo = resolveEntity(varName, metadata);
        return entityInfo?.isPerson && inputVariableLookup.has(varName);
      })
      .sort((left, right) =>
        (inputVariableLookup.get(left)?.label || left).localeCompare(
          inputVariableLookup.get(right)?.label || right
        )
      );
  };

  // Exclude basic inputs which are shown permanently.
  const householdLevelVariables = useMemo(() => {
    return household
      .getHouseholdLevelVariables()
      .filter(({ name }) => {
        if (basicNonPersonFields.includes(name)) {
          return false;
        }

        const entityInfo = resolveEntity(name, metadata);
        return !entityInfo?.isPerson && inputVariableLookup.has(name);
      })
      .sort((left, right) =>
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

  const columns = layout === 'columns';

  return (
    // In columns, each section (family, individuals, household) is a column of the grid.
    <Stack
      gap="lg"
      className={columns ? 'tw:lg:grid tw:lg:grid-cols-3 tw:lg:items-start tw:lg:gap-6' : undefined}
    >
      {!hideSpmGeography && (
        <SPMGeographyChoice
          household={household}
          year={year}
          metadata={metadata}
          onChange={onChange}
          disabled={disabled}
          isReadOnly={isReadOnly}
        />
      )}
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

      {!columns && <hr className="tw:border-border-light" />}

      {/* Main Accordion Sections - all open by default */}
      <Accordion
        type="multiple"
        defaultValue={['individuals', 'household-vars']}
        className={columns ? 'tw:lg:contents' : undefined}
      >
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
                            suggested={
                              suggestedOrder.size > 0 && !personSearchValue.trim()
                                ? suggestedOrder
                                : undefined
                            }
                            suggestedLabel={suggestedLabel}
                            groupOf={variableGroupOf}
                            groupOrder={variableGroupOrder}
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
                  suggested={
                    suggestedOrder.size > 0 && !householdSearchValue.trim()
                      ? suggestedOrder
                      : undefined
                  }
                  suggestedLabel={suggestedLabel}
                  groupOf={variableGroupOf}
                  groupOrder={variableGroupOrder}
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
