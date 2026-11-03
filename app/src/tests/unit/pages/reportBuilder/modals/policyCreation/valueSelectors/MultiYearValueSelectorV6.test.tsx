import { cleanup, render, screen } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { MultiYearValueSelectorV6 } from '@/pages/reportBuilder/modals/policyCreation/valueSelectors/MultiYearValueSelectorV6';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedYearListMetadata } from '@/tests/fixtures/libs/yearListMocks';
import {
  CTC_BASE_PARAMETER,
  EDITOR_REPORT_YEAR,
  EMPTY_POLICY,
  HOUSEHOLD_YEARS_FROM_REPORT_YEAR,
  POLICY_EDITOR_YEAR_LISTS,
  valueSetterProps,
} from '@/tests/fixtures/pathways/report/components/valueSetters/policyEditorYearMocks';

describe('MultiYearValueSelectorV6', () => {
  beforeEach(() => {
    seedYearListMetadata(POLICY_EDITOR_YEAR_LISTS);
  });

  afterEach(() => {
    // Unmount first, so clearing the store updates nothing on screen.
    cleanup();
    store.dispatch(clearMetadata());
  });

  test('given household years beyond the society-wide years then it sets values for the household years', () => {
    // When
    render(
      <MultiYearValueSelectorV6
        {...valueSetterProps()}
        param={CTC_BASE_PARAMETER}
        policy={EMPTY_POLICY}
        reportYear={EDITOR_REPORT_YEAR}
      />
    );

    // Then: the years run down two columns, the first five then the rest
    const shownYears = screen.getAllByText(/^\d{4}$/).map((label) => label.textContent);
    expect(shownYears).toEqual(HOUSEHOLD_YEARS_FROM_REPORT_YEAR);
  });
});
