/**
 * HouseholdCreationContent - Household creation form wrapper
 */
import HouseholdBuilderForm from '@/components/household/HouseholdBuilderForm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/Spinner';
import { Household } from '@/types/ingredients/Household';
import { MetadataState } from '@/types/metadata';

interface HouseholdCreationContentProps {
  householdDraft: Household | null;
  metadata: MetadataState;
  reportYear: string;
  maritalStatus: 'single' | 'married';
  numChildren: number;
  basicPersonFields: string[];
  basicNonPersonFields: string[];
  isCreating: boolean;
  onChange: (household: Household) => void;
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
  onChange,
  onMaritalStatusChange,
  onNumChildrenChange,
}: HouseholdCreationContentProps) {
  if (!householdDraft) {
    return null;
  }

  return (
    <ScrollArea style={{ flex: 1 }}>
      <div style={{ position: 'relative' }}>
        {isCreating && (
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
          disabled={isCreating}
        />
      </div>
    </ScrollArea>
  );
}
