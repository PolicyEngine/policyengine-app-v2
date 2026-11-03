import { cleanup, render, screen } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { MultiYearValueSelector } from '@/pathways/report/components/valueSetters/MultiYearValueSelector';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedYearListMetadata } from '@/tests/fixtures/libs/yearListMocks';
import {
  CTC_BASE_PARAMETER,
  EMPTY_POLICY,
  HOUSEHOLD_YEARS_FROM_REPORT_YEAR,
  POLICY_EDITOR_YEAR_LISTS,
  valueSetterProps,
} from '@/tests/fixtures/pathways/report/components/valueSetters/policyEditorYearMocks';

describe('MultiYearValueSelector', () => {
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
      <MultiYearValueSelector
        {...valueSetterProps()}
        param={CTC_BASE_PARAMETER}
        policy={EMPTY_POLICY}
      />
    );

    // Then
    const shownYears = screen.getAllByText(/^\d{4}$/).map((label) => label.textContent);
    expect(shownYears).toEqual(HOUSEHOLD_YEARS_FROM_REPORT_YEAR);
  });
});
