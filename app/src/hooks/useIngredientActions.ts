import { useCallback } from 'react';

export type IngredientType = 'policy' | 'population' | 'simulation' | 'dynamic' | 'report' | 'dataset';

export type ActionType = 'view' | 'bookmark' | 'edit' | 'share' | 'delete' | 'add-to-report' | null;

export interface UseIngredientActionsProps {
  ingredient: IngredientType;
  onView?: (id: string) => void;
  onBookmark?: (id: string) => void;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddToReport?: (id: string) => void;
}

export function useIngredientActions({
  ingredient,
  onView,
  onBookmark,
  onEdit,
  onShare,
  onDelete,
  onAddToReport,
}: UseIngredientActionsProps) {
  const handleMenuAction = useCallback(
    (action: string, recordId: string) => {
      switch (action) {
        case `view-${ingredient}`:
        case 'view':
          if (onView) {
            onView(recordId);
          } else {
            console.log(`View ${ingredient} details:`, recordId);
          }
          break;
        case 'bookmark':
          if (onBookmark) {
            onBookmark(recordId);
          } else {
            console.log(`Bookmark ${ingredient}:`, recordId);
          }
          break;
        case 'edit':
          if (onEdit) {
            onEdit(recordId);
          } else {
            console.log(`Edit ${ingredient}:`, recordId);
          }
          break;
        case 'share':
          if (onShare) {
            onShare(recordId);
          } else {
            console.log(`Share ${ingredient}:`, recordId);
          }
          break;
        case 'delete':
          if (onDelete) {
            onDelete(recordId);
          } else {
            console.log(`Delete ${ingredient}:`, recordId);
          }
          break;
        case 'add-to-report':
          if (onAddToReport) {
            onAddToReport(recordId);
          } else {
            console.log(`Add ${ingredient} to report:`, recordId);
          }
          break;
        default:
          console.error('Unknown action:', action);
      }
    },
    [ingredient, onView, onBookmark, onEdit, onShare, onDelete, onAddToReport]
  );

  const getDefaultActions = () => {
    // Special case for reports - show Edit action
    if (ingredient === 'report') {
      return [
        { label: 'Edit report', action: 'edit' },
      ];
    }

    // Return empty array for other ingredients
    return [];
  };

  return {
    handleMenuAction,
    getDefaultActions,
  };
}
