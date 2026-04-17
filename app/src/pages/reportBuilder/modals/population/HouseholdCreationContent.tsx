/**
 * HouseholdCreationContent - Household creation form wrapper
 */
import HouseholdBuilderForm from '@/components/household/HouseholdBuilderForm';
import { Alert, AlertDescription } from '@/components/ui';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/Spinner';
import type { AppHouseholdInputEnvelope } from '@/models/household/appTypes';
import { MetadataState } from '@/types/metadata';

interface HouseholdCreationContentProps {
  householdDraft: AppHouseholdInputEnvelope | null;
  metadata: MetadataState;
  reportYear: string;
  maritalStatus: 'single' | 'married';
  numChildren: number;
  basicPersonFields: string[];
  basicNonPersonFields: string[];
  isCreating: boolean;
  validationMessage?: string | null;
  isReadOnly?: boolean;
  onChange: (household: AppHouseholdInputEnvelope) => void;
  onMaritalStatusChange: (status: 'single' | 'married') => void;
  onNumChildrenChange: (count: number) => void;
}

export function HouseholdCreationContent({
  householdDraft,
  metadata,
  reportYear,
  maritalStatus,
  numChildren,
  basicPersonFields,
  basicNonPersonFields,
  isCreating,
  validationMessage,
  isReadOnly = false,
  onChange,
  onMaritalStatusChange,
  onNumChildrenChange,
}: HouseholdCreationContentProps) {
  if (!householdDraft) {
    return null;
  }

  return (
    <ScrollArea style={{ flex: 1 }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {validationMessage && (
          <Alert variant="default">
            <AlertDescription>{validationMessage}</AlertDescription>
          </Alert>
        )}
        {isCreating && !isReadOnly && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.8)',
              zIndex: 10,
            }}
          >
            <Spinner />
          </div>
        )}
        <HouseholdBuilderForm
          household={householdDraft}
          metadata={metadata}
          year={reportYear}
          maritalStatus={maritalStatus}
          numChildren={numChildren}
          basicPersonFields={basicPersonFields}
          basicNonPersonFields={basicNonPersonFields}
          onChange={onChange}
          onMaritalStatusChange={onMaritalStatusChange}
          onNumChildrenChange={onNumChildrenChange}
          disabled={isCreating || isReadOnly}
          isReadOnly={isReadOnly}
        />
      </div>
    </ScrollArea>
  );
}
