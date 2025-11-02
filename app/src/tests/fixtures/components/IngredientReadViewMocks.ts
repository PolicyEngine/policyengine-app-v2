import { ColumnConfig, IngredientRecord } from '@/components/columns';

export const MOCK_INGREDIENT = {
  NAME: 'Policy',
  TITLE: 'My Policies',
  SUBTITLE: 'Create and manage policy reforms',
} as const;

export const MOCK_COLUMNS: ColumnConfig[] = [
  {
    key: 'name',
    header: 'Name',
    type: 'text',
  },
  {
    key: 'status',
    header: 'Status',
    type: 'text',
  },
];

export const MOCK_DATA: IngredientRecord[] = [
  {
    id: '1',
    name: 'Test Policy 1',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Test Policy 2',
    status: 'Draft',
  },
];

export const EMPTY_DATA: IngredientRecord[] = [];
