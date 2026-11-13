import { useSelector } from 'react-redux';
import {
  displayValue,
  PARAMETER_HEADING,
  PARAMETER_ROW,
  PARAMETER_VALUE,
} from '@/components/flagship/ReformParameterTable';
import { savedOn } from '@/components/flagship/SavedReformView';
import { Stack, Text, Title } from '@/components/ui';
import { spacing, typography } from '@/designTokens';
import { useAdminSavedHousehold, type AdminSavedHousehold } from '@/hooks/useAdminSavedHousehold';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { Household, HouseholdVariableEntry } from '@/models/Household';
import { flattenForYear } from '@/models/household/utils';
import type { RootState } from '@/store';
import { formatValue } from '@/utils/parameterValues';
import {
  OtherCountryNote,
  SavedItemHeader,
  SavedItemLoading,
  SavedItemReadError,
  SECONDARY_TEXT,
} from './AdminSavedItemDialog';

/** A row of a household table, an input and its value, in the parameter table's style. */
const VALUE_ROW: React.CSSProperties = {
  ...PARAMETER_ROW,
  gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 220px)',
};

type VariablesMetadata = RootState['metadata']['variables'];

/** The household model's group kinds, as a table's name says them. */
const GROUP_KIND_NAMES: Record<string, string> = {
  households: 'household',
  taxUnits: 'tax unit',
  spmUnits: 'SPM unit',
  families: 'family',
  maritalUnits: 'marital unit',
  benunits: 'benefit unit',
};

/**
 * A model key as words: "your first dependent" → "Your first dependent",
 * "employment_income" → "Employment income", and the app's generated group
 * keys, "taxUnit1" → "Tax unit 1".
 */
function readableKey(key: string): string {
  const words = key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * A group's table name: its own key, which v1 households make readable
 * ("your tax unit"), followed by its kind when the key doesn't say it, since
 * v1 names the household and the SPM unit both "your household".
 */
function groupName(entityName: string, groupKey: string): string {
  const name = readableKey(groupKey);
  const kind = GROUP_KIND_NAMES[entityName] ?? readableKey(entityName).toLowerCase();
  return name.toLowerCase().includes(kind.toLowerCase()) ? name : `${name} (${kind})`;
}

/** One input as its row shows it. */
interface ValueRow {
  name: string;
  label: string;
  value: string;
}

/** One person's or one group's inputs. */
interface ValueSet {
  key: string;
  name: string;
  rows: ValueRow[];
}

/**
 * An input's row. With `variables` (this country's model) it takes the
 * input's label, its unit and, for a choice, the chosen option's label;
 * without, its name in the model and its stored value.
 */
function valueRow(
  { name, value }: HouseholdVariableEntry,
  year: number | null,
  variables: VariablesMetadata | undefined
): ValueRow {
  const variable = variables?.[name];
  // The household's year is the latest year it sets anything for; an input
  // with no value that year shows its latest one.
  const stored = flattenForYear(value, year);
  const option = Array.isArray(variable?.possibleValues)
    ? (variable.possibleValues as Array<{ value: unknown; label: string }>).find(
        (possibleValue) => possibleValue.value === stored
      )
    : undefined;
  return {
    name,
    label: variable?.label ?? readableKey(name),
    value: option
      ? option.label
      : typeof stored === 'boolean'
        ? displayValue(stored, null)
        : formatValue(stored, variable?.unit ?? null),
  };
}

/** Each person's inputs, then each group's that sets any (the household's state, a tax unit's). */
function valueSets(household: Household, variables: VariablesMetadata | undefined): ValueSet[] {
  const year = household.year;
  const people = household.personNames.map((person) => ({
    key: `people:${person}`,
    name: readableKey(person),
    rows: household
      .getPersonVariableEntries(person)
      .map((entry) => valueRow(entry, year, variables)),
  }));
  const groups = household
    .getConfiguredGroupsWithVariables()
    .map(({ entityName, groupName: groupKey, variables: entries }) => ({
      key: `${entityName}:${groupKey}`,
      name: groupName(entityName, groupKey),
      rows: entries.map((entry) => valueRow(entry, year, variables)),
    }));
  return [...people, ...groups];
}

function ValueTable({ valueSet }: { valueSet: ValueSet }) {
  return (
    <Stack style={{ gap: spacing.xs }}>
      <Title order={3} style={{ margin: 0, fontSize: typography.fontSize.base }}>
        {valueSet.name}
      </Title>
      {valueSet.rows.length === 0 ? (
        <Text style={SECONDARY_TEXT}>No values set.</Text>
      ) : (
        <div role="table" aria-label={valueSet.name}>
          <div role="row" style={{ ...VALUE_ROW, paddingTop: 0 }}>
            {['Input', 'Value'].map((heading) => (
              <span key={heading} role="columnheader" style={PARAMETER_HEADING}>
                {heading}
              </span>
            ))}
          </div>
          {valueSet.rows.map((row) => (
            <div key={row.name} role="row" style={VALUE_ROW}>
              <span role="cell" style={PARAMETER_VALUE}>
                {row.label}
              </span>
              <span
                role="cell"
                style={{ ...PARAMETER_VALUE, fontWeight: typography.fontWeight.normal }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </Stack>
  );
}

/** "4 people · 2026 · saved Oct 12, 2026"; the date alone until read. */
function householdDescription(createdAt: string, household: Household | undefined) {
  if (household === undefined) {
    return `Saved ${savedOn(createdAt)}`;
  }
  const count = household.personNames.length;
  return [
    `${count} ${count === 1 ? 'person' : 'people'}`,
    ...(household.year === null ? [] : [String(household.year)]),
    `saved ${savedOn(createdAt)}`,
  ].join(' · ');
}

/** The household's inputs, or that it has no people. */
function HouseholdValues({
  household,
  variables,
}: {
  household: Household;
  variables: VariablesMetadata | undefined;
}) {
  if (household.personNames.length === 0) {
    return <Text style={SECONDARY_TEXT}>This household has no people.</Text>;
  }
  return (
    <>
      {valueSets(household, variables).map((valueSet) => (
        <ValueTable key={valueSet.key} valueSet={valueSet} />
      ))}
    </>
  );
}

/**
 * One of a user's saved households in the admin page's dialog, read only:
 * its name, how many people it has, its year and when it was saved, then
 * the inputs set for each person and for each group, in its year. Labels,
 * units and options come from the page's country's model, so a household
 * saved in another country shows its inputs by their names in the model,
 * and says so.
 */
export default function SavedHouseholdDetails({ household }: { household: AdminSavedHousehold }) {
  const countryId = useCurrentCountry();
  const pageVariables = useSelector((state: RootState) => state.metadata.variables);
  const inThisCountry = household.country_id === countryId;
  const read = useAdminSavedHousehold(household);
  return (
    <>
      <SavedItemHeader
        name={household.name}
        summary={householdDescription(household.created_at, read.data)}
      />
      {!inThisCountry && (
        <OtherCountryNote
          subject="household"
          itemCountryId={household.country_id}
          pageCountryId={countryId}
          shownAs="its inputs show without their labels, units or option names"
        />
      )}
      {read.error ? (
        <SavedItemReadError
          subject="household"
          error={read.error}
          onRetry={() => void read.refetch()}
        />
      ) : read.data === undefined ? (
        <SavedItemLoading subject="household" />
      ) : (
        <HouseholdValues
          household={read.data}
          variables={inThisCountry ? pageVariables : undefined}
        />
      )}
    </>
  );
}
