import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import VariableRow from '@/components/household/VariableRow';
import {
  createTestHousehold,
  TEST_PERSON,
  TEST_YEAR,
  VARIABLE_ROW_METADATA,
  variableInfoFor,
  variableInfoWithoutPeriod,
} from '@/tests/fixtures/components/household/variableRowMocks';
import type { VariableInfo } from '@/utils/VariableResolver';

function renderRow(variable: VariableInfo, props: { stacked?: boolean } = {}) {
  return render(
    <VariableRow
      variable={variable}
      household={createTestHousehold()}
      metadata={VARIABLE_ROW_METADATA}
      year={TEST_YEAR}
      entityName={TEST_PERSON}
      onChange={vi.fn()}
      {...props}
    />
  );
}

describe('VariableRow', () => {
  test('given a money input defined per year then "Annually" shows under its name', () => {
    renderRow(variableInfoFor('employment_income'));

    expect(screen.getByText('Employment income')).toBeInTheDocument();
    expect(screen.getByText('Annually')).toBeInTheDocument();
  });

  test('given a money input defined per month then "Annually" shows, as the builder sends the year', () => {
    renderRow(variableInfoFor('monthly_childcare_rate'));

    expect(screen.getByText('Annually')).toBeInTheDocument();
    expect(screen.queryByText('Monthly')).not.toBeInTheDocument();
  });

  test('given a yes or no input then no period shows', () => {
    renderRow(variableInfoFor('is_disabled'));

    expect(screen.getByText('Is disabled')).toBeInTheDocument();
    expect(screen.queryByText('Annually')).not.toBeInTheDocument();
  });

  test('given an age then no period shows', () => {
    renderRow(variableInfoFor('age'));

    expect(screen.queryByText('Annually')).not.toBeInTheDocument();
  });

  test('given a stacked row then the period shows with the field', () => {
    renderRow(variableInfoFor('employment_income'), { stacked: true });

    expect(screen.getByText('Annually')).toBeInTheDocument();
  });

  test('given a variable without its period then the period is read from the metadata', () => {
    renderRow(variableInfoWithoutPeriod('employment_income'));

    expect(screen.getByText('Annually')).toBeInTheDocument();
  });
});
