import { useCallback, useMemo, type ComponentProps } from 'react';
import { useSelector } from 'react-redux';
import {
  commonHouseholdInputs,
  householdInputDescriptionOf,
  householdInputNameOf,
  householdTopicIcon,
} from '@/components/flagship/report/household/householdPickerInputs';
import HouseholdBuilderForm from '@/components/household/HouseholdBuilderForm';
import type { CountryId } from '@/libs/countries';
import { householdState } from '@/libs/flagship/householdDescription';
import {
  describesAHousehold,
  HOUSEHOLD_INCOME_SUBGROUPS,
  HOUSEHOLD_VARIABLE_GROUPS,
  householdVariableGroupOf,
  householdVariableSubgroupOf,
  listsForState,
  twinsABasicInput,
} from '@/libs/flagship/householdVariableGroups';
import { getBasicInputFields } from '@/libs/metadataUtils';
import type { Household } from '@/models/Household';
import type { RootState } from '@/store';
import type { VariableInfo } from '@/utils/VariableResolver';

type BuilderFormProps = ComponentProps<typeof HouseholdBuilderForm>;

/**
 * A person's name as a country's builder shows it: a UK household's
 * dependants are its children ("your first child"), as the UK model's
 * benefits count them; the US keeps "dependent", which a tax unit's
 * dependants are called. Only the name shown changes, never the key.
 */
export function householdPersonNameOf(
  countryId: string
): ((personKey: string) => string) | undefined {
  return countryId === 'uk'
    ? (personKey) => personKey.replace(/\bdependent\b/, 'child')
    : undefined;
}

/**
 * The household builder as v3 configures it, for the report section and
 * the standalone household report: every input the model takes, grouped
 * by topic with the country's featured inputs first; the variable search
 * lists only the household's own state's programs, only inputs that
 * describe a household (no survey-reported totals), and not the twin of a
 * field the builder already shows; the US SPM geography choice; and each
 * input labelled.
 */
export default function HouseholdBuilderPanel({
  household,
  countryId,
  year,
  onChange,
  disabled,
  suggestedVariables,
  onVariablePickerOpen,
  onVariableAdd,
}: {
  household: Household;
  countryId: CountryId;
  year: string;
  onChange: (household: Household) => void;
  disabled?: boolean;
  /** Inputs the reform reads, which lead the variable search as related to it. */
  suggestedVariables?: string[];
  onVariablePickerOpen?: BuilderFormProps['onVariablePickerOpen'];
  onVariableAdd?: BuilderFormProps['onVariableAdd'];
}) {
  const metadata = useSelector((state: RootState) => state.metadata);
  const basicInputFields = useSelector(getBasicInputFields);
  const composition = useMemo(() => household.deriveBuilderComposition(year), [household, year]);
  const basicNonPersonFields = useMemo(
    () =>
      Object.entries(basicInputFields)
        .filter(([key]) => key !== 'person')
        .flatMap(([, fields]) => fields),
    [basicInputFields]
  );
  const stateCode = householdState(household, year, countryId);
  const basicPersonFields = basicInputFields.person;
  const variableFilter = useCallback(
    (variable: VariableInfo) =>
      listsForState(variable, stateCode) &&
      describesAHousehold(variable, countryId) &&
      !twinsABasicInput(variable, basicPersonFields ?? []),
    [stateCode, countryId, basicPersonFields]
  );
  // The picker's groups, featured inputs and names, for the country's model.
  const picker = useMemo(
    () => ({
      groupOf: householdVariableGroupOf(countryId),
      subgroupOf: householdVariableSubgroupOf(countryId),
      common: commonHouseholdInputs(countryId),
      nameOf: householdInputNameOf(countryId),
      describe: householdInputDescriptionOf(countryId),
      personNameOf: householdPersonNameOf(countryId),
    }),
    [countryId]
  );

  return (
    <HouseholdBuilderForm
      household={household}
      metadata={metadata}
      year={year}
      maritalStatus={composition.maritalStatus}
      numChildren={composition.numChildren}
      basicPersonFields={basicPersonFields || []}
      basicNonPersonFields={basicNonPersonFields}
      onChange={onChange}
      onMaritalStatusChange={(status) => onChange(household.withBuilderMaritalStatus(year, status))}
      onNumChildrenChange={(count) => onChange(household.withBuilderChildCount(year, count))}
      disabled={disabled}
      layout="columns"
      suggestedVariables={suggestedVariables}
      suggestedLabel="Related to this reform"
      searchRanking="relevance"
      variableGroupOf={picker.groupOf}
      variableGroupOrder={HOUSEHOLD_VARIABLE_GROUPS}
      variableFilter={variableFilter}
      variableSubgroupOf={picker.subgroupOf}
      variableSubgroupOrder={HOUSEHOLD_INCOME_SUBGROUPS}
      searchByEntity
      variablePickerCommon={picker.common}
      variableGroupIcon={householdTopicIcon}
      variableNameOf={picker.nameOf}
      variableDescribe={picker.describe}
      personDisplayNameOf={picker.personNameOf}
      labelInputs
      onVariablePickerOpen={onVariablePickerOpen}
      onVariableAdd={onVariableAdd}
    />
  );
}
