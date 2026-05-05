import { useEffect, useState, type KeyboardEvent } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Stack,
} from '@/components/ui';

interface SaveAsNewNameDialogProps {
  open: boolean;
  ingredientType: 'policy' | 'household';
  currentName: string;
  isSaving?: boolean;
  onCancel: () => void;
  onKeepSameName: () => void;
  onSaveWithName: (name: string) => void;
}

export function SaveAsNewNameDialog({
  open,
  ingredientType,
  currentName,
  isSaving = false,
  onCancel,
  onKeepSameName,
  onSaveWithName,
}: SaveAsNewNameDialogProps) {
  const [draftName, setDraftName] = useState(currentName);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraftName(currentName);
      setValidationError(null);
    }
  }, [currentName, open]);

  const ingredientLabel = capitalize(ingredientType);

  const handleSaveWithName = () => {
    const trimmedName = draftName.trim();

    if (!trimmedName) {
      setValidationError(`${ingredientLabel} name cannot be empty`);
      return;
    }

    if (trimmedName.length > 100) {
      setValidationError(`${ingredientLabel} name must be 100 characters or less`);
      return;
    }

    onSaveWithName(trimmedName);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSaveWithName();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent
        style={{
          width: 'max-content',
          maxWidth: 'calc(100vw - 2rem)',
        }}
      >
        <DialogHeader>
          <DialogTitle>Save as new {ingredientType}</DialogTitle>
          <DialogDescription>
            Choose a name for the new {ingredientType}, or keep the current one.
          </DialogDescription>
        </DialogHeader>
        <Stack gap="md">
          <div>
            <Label htmlFor={`save-as-new-${ingredientType}-name`}>New {ingredientType} name</Label>
            <Input
              id={`save-as-new-${ingredientType}-name`}
              value={draftName}
              placeholder={`Enter new ${ingredientType} name`}
              onChange={(event) => {
                setDraftName(event.currentTarget.value);
                setValidationError(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              autoFocus
            />
            {validationError && (
              <p className="tw:text-sm tw:text-red-500 tw:mt-xs">{validationError}</p>
            )}
          </div>
        </Stack>
        <DialogFooter className="tw:grid tw:grid-cols-1 tw:gap-2 tw:sm:grid-cols-[auto_auto_auto] tw:sm:justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isSaving} className="tw:w-full">
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={onKeepSameName}
            disabled={isSaving}
            className="tw:w-full"
          >
            Keep same name
          </Button>
          <Button
            onClick={handleSaveWithName}
            disabled={!draftName.trim() || isSaving}
            className="tw:w-full"
          >
            Save with new name
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
