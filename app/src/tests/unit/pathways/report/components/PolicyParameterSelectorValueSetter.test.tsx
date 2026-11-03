import { cleanup, render, screen } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import PolicyParameterSelectorValueSetter from '@/pathways/report/components/PolicyParameterSelectorValueSetter';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedYearListMetadata } from '@/tests/fixtures/libs/yearListMocks';
import {
  CTC_BASE_PARAMETER,
  EMPTY_POLICY,
  HOUSEHOLD_YEAR_BOUNDS,
  POLICY_EDITOR_YEAR_LISTS,
} from '@/tests/fixtures/pathways/report/components/valueSetters/policyEditorYearMocks';

describe('PolicyParameterSelectorValueSetter', () => {
  beforeEach(() => {
    seedYearListMetadata(POLICY_EDITOR_YEAR_LISTS);
  });

  afterEach(() => {
    // Unmount first, so clearing the store updates nothing on screen.
    cleanup();
    store.dispatch(clearMetadata());
  });

  test('given household years beyond the society-wide years then a value can start in any household year', () => {
    // When
    render(
      <PolicyParameterSelectorValueSetter
        param={CTC_BASE_PARAMETER}
        policy={EMPTY_POLICY}
        onPolicyUpdate={vi.fn()}
      />
    );

    // Then
    const startYear = screen.getByPlaceholderText('Pick a year');
    expect(startYear).toHaveAttribute('min', HOUSEHOLD_YEAR_BOUNDS.min);
    expect(startYear).toHaveAttribute('max', HOUSEHOLD_YEAR_BOUNDS.max);
  });
});
