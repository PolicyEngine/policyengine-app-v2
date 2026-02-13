/**
 * HouseholdCreationContent - Household creation form wrapper
 */
import { Box, LoadingOverlay, ScrollArea } from '@mantine/core';
import HouseholdBuilderForm from '@/components/household/HouseholdBuilderForm';
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
    <ScrollArea style={{ flex: 1 }} offsetScrollbars>
      <Box pos="relative">
        <LoadingOverlay visible={isCreating} />
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
      </Box>
    </ScrollArea>
  );
}
