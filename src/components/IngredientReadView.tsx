// components/IngredientReadView.tsx

import DataTable from './common/DataTable';
import EmptyState from './common/EmptyState';

interface IngredientReadViewProps<T> {
  ingredient: string; // "Policy", "Sim", etc.
  data: T[];
  columns: { key: keyof T; header: string }[];
  onCreate: () => void;
}

export default function IngredientReadView<T>({
  ingredient,
  data,
  columns,
  onCreate,
}: IngredientReadViewProps<T>) {
  return data.length > 0 ? (
    <DataTable data={data} columns={columns} />
  ) : (
    <EmptyState ingredient={ingredient} onAction={onCreate} />
  );
}
