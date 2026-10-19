import { useCallback, useMemo } from 'react';
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
} from '@/libs/flagship/householdVariableGroups';
import { getBasicInputFields } from '@/libs/metadataUtils';
import type { Household } from '@/models/Household';
import type { RootState } from '@/store';
import type { VariableInfo } from '@/utils/VariableResolver';

/**
 * The household builder as v3 configures it: every input the model takes,
 * grouped by topic with featured inputs first, only the household's own
 * state's programs, no survey-only inputs, and the US SPM geography choice.
 * The report section configures its builder the same way.
 */
export default function HouseholdBuilderPanel({
  household,
  countryId,
  year,
  onChange,
  disabled,
  suggestedVariables,
}: {
  household: Household;
  countryId: CountryId;
  year: string;
  onChange: (household: Household) => void;
  disabled?: boolean;
  /** Inputs to lead the variable search with, e.g. those a reform reads. */
  suggestedVariables?: string[];
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
  const variableFilter = useCallback(
    (variable: VariableInfo) =>
      listsForState(variable, stateCode) && describesAHousehold(variable, countryId),
    [stateCode, countryId]
  );
  const picker = useMemo(
    () => ({
      groupOf: householdVariableGroupOf(countryId),
      subgroupOf: householdVariableSubgroupOf(countryId),
      common: commonHouseholdInputs(countryId),
      nameOf: householdInputNameOf(countryId),
      describe: householdInputDescriptionOf(countryId),
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
      basicPersonFields={basicInputFields.person || []}
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
    />
  );
}
