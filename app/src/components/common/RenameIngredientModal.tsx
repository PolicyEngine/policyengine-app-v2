import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
  Stack,
} from '@/components/ui';

interface RenameIngredientModalProps {
  opened: boolean;
  onClose: () => void;
  currentLabel: string;
  onRename: (newLabel: string) => void;
  isLoading?: boolean;
  ingredientType: 'report' | 'simulation' | 'policy' | 'household' | 'geography';
  /** Error message from a failed rename attempt (e.g., API error) */
  submissionError?: string | null;
}

export function RenameIngredientModal({
  opened,
  onClose,
  currentLabel,
  onRename,
  isLoading = false,
  ingredientType,
  submissionError = null,
}: RenameIngredientModalProps) {
  const [localLabel, setLocalLabel] = useState(currentLabel);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Combine validation and submission errors for display
  const displayError = validationError || submissionError;

  // Reset local state when modal opens with new current label
  useEffect(() => {
    if (opened) {
      setLocalLabel(currentLabel);
      setValidationError(null);
    }
  }, [opened, currentLabel]);

  const handleSubmit = () => {
    // Validation
    const trimmed = localLabel.trim();

    if (!trimmed) {
      setValidationError(`${capitalize(ingredientType)} name cannot be empty`);
      return;
    }

    if (trimmed.length > 100) {
      setValidationError(`${capitalize(ingredientType)} name must be 100 characters or less`);
      return;
    }

    if (trimmed === currentLabel) {
      // No change, just close
      onClose();
      return;
    }

    // Call the rename handler
    onRename(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <strong>Rename {ingredientType}</strong>
          </DialogTitle>
        </DialogHeader>
        <Stack gap="md">
          <div>
            <Label htmlFor="rename-input">{capitalize(ingredientType)} name</Label>
            <Input
              id="rename-input"
              placeholder={`Enter new ${ingredientType} name`}
              value={localLabel}
              onChange={(e) => {
                setLocalLabel(e.currentTarget.value);
                setValidationError(null); // Clear validation error on change
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              autoFocus
            />
            {displayError && <p className="tw:text-sm tw:text-red-500 tw:mt-xs">{displayError}</p>}
          </div>
        </Stack>
        <DialogFooter>
          <div className="tw:grid tw:grid-cols-2 tw:gap-md tw:w-full">
            <Button onClick={onClose} variant="outline" disabled={isLoading} className="tw:w-full">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!localLabel.trim() || isLoading}
              className="tw:w-full"
            >
              {isLoading && <Spinner size="sm" />}
              Rename
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
