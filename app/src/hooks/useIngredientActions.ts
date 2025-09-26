import { useCallback } from 'react';

export type IngredientType = 'policy' | 'population' | 'simulation' | 'dynamic';

export type ActionType = 'view' | 'bookmark' | 'edit' | 'share' | 'delete' | 'add-to-report';

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
    const baseActions = [
      { label: 'View details', action: `view-${ingredient}` },
      { label: 'Bookmark', action: 'bookmark' },
      { label: 'Edit', action: 'edit' },
      { label: 'Share', action: 'share' },
      { label: 'Delete', action: 'delete', color: 'red' },
    ];

    if (ingredient === 'simulation') {
      return [
        { label: 'Add to Report', action: 'add-to-report' },
        { label: 'Delete', action: 'delete', color: 'red' },
      ];
    }

    return baseActions;
  };

  return {
    handleMenuAction,
    getDefaultActions,
  };
}
