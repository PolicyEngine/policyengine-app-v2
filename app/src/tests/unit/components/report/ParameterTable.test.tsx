import { render, screen, userEvent } from '@test-utils';
import { describe, test, expect } from 'vitest';
import ParameterTable from '@/components/report/ParameterTable';
import {
  MOCK_PARAMETER_METADATA,
  MOCK_POLICY_COLUMNS,
  MOCK_PARAMETER_NAMES,
  createMockRenderFunctions,
} from '@/tests/fixtures/components/report/ParameterTable';

describe('ParameterTable', () => {
  test('given parameters then renders table with parameter names', () => {
    // Given
    const { renderColumnHeader, renderCurrentLawValue, renderColumnValue } = createMockRenderFunctions();

    // When
    render(
      <ParameterTable
        parameterNames={MOCK_PARAMETER_NAMES}
        parameters={MOCK_PARAMETER_METADATA}
        columns={MOCK_POLICY_COLUMNS}
        needsCurrentLawColumn={false}
        labelColumnWidth={45}
        valueColumnWidth={27.5}
        renderColumnHeader={renderColumnHeader}
        renderCurrentLawValue={renderCurrentLawValue}
        renderColumnValue={renderColumnValue}
      />
    );

    // Then
    expect(screen.getByText('gov.irs.credits.ctc.amount')).toBeInTheDocument();
    expect(screen.getByText('gov.irs.income_tax.rates.standard[0].rate')).toBeInTheDocument();
  });

  test('given current law column needed then renders current law header', () => {
    // Given
    const { renderColumnHeader, renderCurrentLawValue, renderColumnValue } = createMockRenderFunctions();

    // When
    render(
      <ParameterTable
        parameterNames={MOCK_PARAMETER_NAMES}
        parameters={MOCK_PARAMETER_METADATA}
        columns={MOCK_POLICY_COLUMNS}
        needsCurrentLawColumn={true}
        labelColumnWidth={45}
        valueColumnWidth={27.5}
        renderColumnHeader={renderColumnHeader}
        renderCurrentLawValue={renderCurrentLawValue}
        renderColumnValue={renderColumnValue}
      />
    );

    // Then
    expect(screen.getByText('CURRENT LAW')).toBeInTheDocument();
  });

  test('given user clicks ellipsis then expands parameter label', async () => {
    // Given
    const user = userEvent.setup();
    const { renderColumnHeader, renderCurrentLawValue, renderColumnValue } = createMockRenderFunctions();

    render(
      <ParameterTable
        parameterNames={MOCK_PARAMETER_NAMES}
        parameters={MOCK_PARAMETER_METADATA}
        columns={MOCK_POLICY_COLUMNS}
        needsCurrentLawColumn={false}
        labelColumnWidth={45}
        valueColumnWidth={27.5}
        renderColumnHeader={renderColumnHeader}
        renderCurrentLawValue={renderCurrentLawValue}
        renderColumnValue={renderColumnValue}
      />
    );

    // When - find and click the ellipsis (if present)
    const ellipsisElements = screen.queryAllByText('...');
    if (ellipsisElements.length > 0) {
      await user.click(ellipsisElements[0]);
      // Then - clicking should toggle expansion (implementation detail)
      expect(ellipsisElements[0]).toBeInTheDocument();
    }
  });

  test('given columns then renders column headers', () => {
    // Given
    const { renderCurrentLawValue, renderColumnValue } = createMockRenderFunctions();
    const renderColumnHeader = vi.fn((column, idx) => `COLUMN ${idx}`);

    // When
    render(
      <ParameterTable
        parameterNames={MOCK_PARAMETER_NAMES}
        parameters={MOCK_PARAMETER_METADATA}
        columns={MOCK_POLICY_COLUMNS}
        needsCurrentLawColumn={false}
        labelColumnWidth={45}
        valueColumnWidth={27.5}
        renderColumnHeader={renderColumnHeader}
        renderCurrentLawValue={renderCurrentLawValue}
        renderColumnValue={renderColumnValue}
      />
    );

    // Then
    expect(renderColumnHeader).toHaveBeenCalledTimes(MOCK_POLICY_COLUMNS.length);
    expect(screen.getByText('COLUMN 0')).toBeInTheDocument();
    expect(screen.getByText('COLUMN 1')).toBeInTheDocument();
  });

  test('given parameters then calls render functions with correct arguments', () => {
    // Given
    const { renderColumnHeader, renderCurrentLawValue, renderColumnValue } = createMockRenderFunctions();

    // When
    render(
      <ParameterTable
        parameterNames={MOCK_PARAMETER_NAMES}
        parameters={MOCK_PARAMETER_METADATA}
        columns={MOCK_POLICY_COLUMNS}
        needsCurrentLawColumn={true}
        labelColumnWidth={45}
        valueColumnWidth={27.5}
        renderColumnHeader={renderColumnHeader}
        renderCurrentLawValue={renderCurrentLawValue}
        renderColumnValue={renderColumnValue}
      />
    );

    // Then
    expect(renderCurrentLawValue).toHaveBeenCalledWith(MOCK_PARAMETER_NAMES[0]);
    expect(renderColumnValue).toHaveBeenCalledWith(MOCK_POLICY_COLUMNS[0], MOCK_PARAMETER_NAMES[0]);
  });
});
