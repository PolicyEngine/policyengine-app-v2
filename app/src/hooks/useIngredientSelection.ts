import { useCallback, useState } from 'react';

export function useIngredientSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectionChange = useCallback((recordId: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, recordId] : prev.filter((id) => id !== recordId)
    );
  }, []);

  const isSelected = useCallback(
    (recordId: string) => selectedIds.includes(recordId),
    [selectedIds]
  );

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const selectAll = useCallback((ids: string[]) => setSelectedIds(ids), []);

  return {
    selectedIds,
    handleSelectionChange,
    isSelected,
    clearSelection,
    selectAll,
  };
}
