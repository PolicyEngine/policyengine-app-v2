import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@test-utils';
import { Provider } from 'react-redux';
import { describe, expect, test } from 'vitest';
import VariableArithmetic from '@/components/household/VariableArithmetic';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import metadataReducer from '@/reducers/metadataReducer';
import {
  household,
  V1_METADATA,
  V2_METADATA,
} from '@/tests/fixtures/components/household/variableArithmeticParameterPartsMocks';
import type { MetadataState } from '@/types/metadata';

function renderBreakdown(metadata: MetadataState, year: string, variableName: string): void {
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: { metadata },
  });
  const ui: ReactNode = (
    <VariableArithmetic
      variableName={variableName}
      baseline={household(year)}
      reform={null}
      isAdd
      defaultExpanded
    />
  );
  render(
    <Provider store={store}>
      <ReportYearProvider year={year}>{ui}</ReportYearProvider>
    </Provider>
  );
}

describe('VariableArithmetic with parts named by a parameter', () => {
  test('given v2 metadata and a 2025 report then benefits add the list in force in 2025', () => {
    // When
    renderBreakdown(V2_METADATA, '2025', 'household_benefits');

    // Then
    expect(screen.getByText(/Your SNAP/)).toBeInTheDocument();
    expect(screen.queryByText(/Your SSI/)).not.toBeInTheDocument();
  });

  test('given v2 metadata and a report for the year the list changes then the new list applies', () => {
    // When
    renderBreakdown(V2_METADATA, '2026', 'household_benefits');

    // Then
    expect(screen.getByText(/Your SNAP/)).toBeInTheDocument();
    expect(screen.getByText(/Your SSI/)).toBeInTheDocument();
  });

  test('given v2 metadata and a parameter without values then nothing is subtracted', () => {
    // When
    renderBreakdown(V2_METADATA, '2026', 'countable_income');

    // Then
    expect(screen.getByText(/Your earnings/)).toBeInTheDocument();
    expect(screen.queryByText(/Your SNAP/)).not.toBeInTheDocument();
  });

  test('given v1 metadata then the parts still come from the whole parameter list', () => {
    // When
    renderBreakdown(V1_METADATA, '2025', 'household_benefits');

    // Then
    expect(screen.getByText(/Your SNAP/)).toBeInTheDocument();
    expect(screen.queryByText(/Your SSI/)).not.toBeInTheDocument();
  });
});
