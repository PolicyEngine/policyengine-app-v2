import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@test-utils';
import { Provider } from 'react-redux';
import { describe, expect, test } from 'vitest';
import VariableArithmetic from '@/components/household/VariableArithmetic';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import metadataReducer from '@/reducers/metadataReducer';
import { REAL_SHAPE_PARTS_VARIABLE } from '@/tests/fixtures/api/publicApi/catalogVariablesRealShape';
import {
  REAL_SHAPE_V2_METADATA,
  taxUnitWithDeductions,
} from '@/tests/fixtures/components/household/variableArithmeticRealShapeMocks';

function renderBreakdown(year: string): void {
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: { metadata: REAL_SHAPE_V2_METADATA },
  });
  render(
    <Provider store={store}>
      <ReportYearProvider year={year}>
        <VariableArithmetic
          variableName={REAL_SHAPE_PARTS_VARIABLE.name}
          baseline={taxUnitWithDeductions(year)}
          reform={null}
          isAdd
          defaultExpanded
        />
      </ReportYearProvider>
    </Provider>
  );
}

describe('VariableArithmetic on a real variable whose parts a parameter names', () => {
  test('given a 2017 report then the list in force in 2017 applies', () => {
    // When
    renderBreakdown('2017');

    // Then
    expect(screen.getByText(/Domestic production deduction/)).toBeInTheDocument();
    expect(screen.getByText(/Student loan interest deduction/)).toBeInTheDocument();
  });

  test('given a 2018 report then the list from 2018 applies, without the dropped part', () => {
    // When
    renderBreakdown('2018');

    // Then
    expect(screen.queryByText(/Domestic production deduction/)).not.toBeInTheDocument();
    expect(screen.getByText(/Student loan interest deduction/)).toBeInTheDocument();
  });
});
