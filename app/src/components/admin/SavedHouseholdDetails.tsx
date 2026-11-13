import { useSelector } from 'react-redux';
import { Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useAdminSavedHousehold, type AdminSavedHousehold } from '@/hooks/useAdminSavedHousehold';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { Household } from '@/models/Household';
import type { RootState } from '@/store';
import { extractGroupEntities, type EntityVariable } from '@/utils/householdIndividuals';
import { formatValue } from '@/utils/parameterValues';
import {
  OtherCountryNotice,
  SavedItemHeader,
  SavedItemLoading,
  SavedItemReadError,
  savedOn,
  SECONDARY_TEXT,
} from './AdminSavedItemPanel';

/** A row of a household table: the input's name and its value, as the policy table's rows look. */
const VALUE_ROW: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 220px)',
  alignItems: 'center',
  columnGap: spacing.md,
  padding: `${spacing.sm} 0`,
  borderBottom: `1px solid ${colors.border.light}`,
};

const VALUE_HEADING: React.CSSProperties = {
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.secondary,
};

const VALUE_NAME: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.primary,
};

const VALUE: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: colors.text.primary,
  fontVariantNumeric: 'tabular-nums',
};

/** One person's or one group's values, named by `name`. */
interface ValueSet {
  name: string;
  values: EntityVariable[];
}

/**
 * Each person's values, then each group's (the household's state, a tax
 * unit's values) that sets any, as the report pages read a household.
 */
function valueSets(household: Household, variables: RootState['metadata']['variables']) {
  const sets: ValueSet[] = [];
  for (const entity of extractGroupEntities(household, variables)) {
    for (const instance of entity.instances) {
      if (entity.entityType === 'people') {
        sets.push({ name: instance.name, values: instance.members[0]?.variables ?? [] });
      } else if (instance.variables && instance.variables.length > 0) {
        sets.push({ name: instance.name, values: instance.variables });
      }
    }
  }
  return sets;
}

/** A value as the policy table reads it: True/False, money and percentages by the input's unit. */
function displayValue(value: unknown, unit: string | undefined): string {
  return typeof value === 'boolean' ? (value ? 'True' : 'False') : formatValue(value, unit ?? null);
}

function ValueTable({
  valueSet,
  variables,
}: {
  valueSet: ValueSet;
  variables: RootState['metadata']['variables'];
}) {
  return (
    <Stack style={{ gap: spacing.xs }}>
      <Title order={3} style={{ margin: 0, fontSize: typography.fontSize.base }}>
        {valueSet.name}
      </Title>
      {valueSet.values.length === 0 ? (
        <Text style={SECONDARY_TEXT}>No values set.</Text>
      ) : (
        <div role="table" aria-label={valueSet.name}>
          <div role="row" style={{ ...VALUE_ROW, paddingTop: 0 }}>
            {['Input', 'Value'].map((heading) => (
              <span key={heading} role="columnheader" style={VALUE_HEADING}>
                {heading}
              </span>
            ))}
          </div>
          {valueSet.values.map((value) => (
            <div key={value.paramName} role="row" style={VALUE_ROW}>
              <span role="cell" style={VALUE_NAME}>
                {variables?.[value.paramName]?.label ?? value.label}
              </span>
              <span role="cell" style={VALUE}>
                {displayValue(value.value, value.unit)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Stack>
  );
}

/** "2 people · 2026 · saved Oct 12, 2026"; the date alone until read. */
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

/**
 * One of a user's saved households in the admin page's panel, read only:
 * its name, how many people it has, its year and when it was saved, then
 * the values set for each person and for the household. Names and units
 * come from the loaded metadata, so only a household saved in this page's
 * country is read and shown.
 */
export default function SavedHouseholdDetails({ household }: { household: AdminSavedHousehold }) {
  const countryId = useCurrentCountry();
  const variables = useSelector((state: RootState) => state.metadata.variables);
  const inThisCountry = household.country_id === countryId;
  const read = useAdminSavedHousehold(household, inThisCountry);
  return (
    <>
      <SavedItemHeader
        name={household.name}
        description={householdDescription(household.created_at, read.data)}
      />
      {!inThisCountry ? (
        <OtherCountryNotice subject="household" countryId={household.country_id} />
      ) : read.error ? (
        <SavedItemReadError
          subject="household"
          error={read.error}
          onRetry={() => void read.refetch()}
        />
      ) : read.data === undefined ? (
        <SavedItemLoading subject="household" />
      ) : (
        valueSets(read.data, variables).map((valueSet) => (
          <ValueTable key={valueSet.name} valueSet={valueSet} variables={variables} />
        ))
      )}
    </>
  );
}
