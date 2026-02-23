import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import DataTable from '@/components/common/DataTable';
import {
  EMPTY_DATA,
  TEST_COLUMNS,
  TEST_DATA,
  type MockRowData,
} from '@/tests/fixtures/components/common/DataTableMocks';

describe('DataTable', () => {
  test('given data then renders all column headers', () => {
    // When
    render(<DataTable<MockRowData> data={TEST_DATA} columns={TEST_COLUMNS} />);

    // Then
    TEST_COLUMNS.forEach((col) => {
      expect(screen.getByText(col.header)).toBeInTheDocument();
    });
  });

  test('given data then renders all row values', () => {
    // When
    render(<DataTable<MockRowData> data={TEST_DATA} columns={TEST_COLUMNS} />);

    // Then
    expect(screen.getByText('Income tax')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('Child benefit')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Housing allowance')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    // "Benefit" appears in two rows
    expect(screen.getAllByText('Benefit')).toHaveLength(2);
    expect(screen.getByText('Tax')).toBeInTheDocument();
  });

  test('given empty data then renders headers but no rows', () => {
    // When
    render(<DataTable<MockRowData> data={EMPTY_DATA} columns={TEST_COLUMNS} />);

    // Then
    TEST_COLUMNS.forEach((col) => {
      expect(screen.getByText(col.header)).toBeInTheDocument();
    });
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryAllByRole('row')).toHaveLength(1); // header row only
  });

  test('given table renders then it is wrapped in a scrollable container', () => {
    // When
    const { container } = render(
      <DataTable<MockRowData> data={TEST_DATA} columns={TEST_COLUMNS} />
    );

    // Then — the table's parent div has overflow-x: auto
    const table = container.querySelector('table')!;
    const scrollWrapper = table.parentElement!;
    expect(scrollWrapper.style.overflowX).toBe('auto');
  });
});
