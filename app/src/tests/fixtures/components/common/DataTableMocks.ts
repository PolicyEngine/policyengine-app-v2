/**
 * Mock data and fixtures for DataTable tests
 */

export interface MockRowData {
  name: string;
  value: number;
  category: string;
}

export const TEST_COLUMNS = [
  { key: 'name' as const, header: 'Name' },
  { key: 'value' as const, header: 'Value' },
  { key: 'category' as const, header: 'Category' },
];

export const TEST_DATA: MockRowData[] = [
  { name: 'Income tax', value: 1000, category: 'Tax' },
  { name: 'Child benefit', value: 500, category: 'Benefit' },
  { name: 'Housing allowance', value: 300, category: 'Benefit' },
];

export const EMPTY_DATA: MockRowData[] = [];
