/**
 * Mockup 1: Current Household Builder Design
 *
 * Uses the existing HouseholdBuilderView with mock data.
 * Shows current design with advanced settings collapsed at bottom.
 */

import { useState } from 'react';
import { Container, Title, Text, Stack } from '@mantine/core';
import HouseholdBuilderView from '@/components/household/HouseholdBuilderView';
import { mockDataMarried } from './data/householdBuilderMockData';
import { Household } from '@/types/ingredients/Household';
import * as HouseholdQueries from '@/utils/HouseholdQueries';
import { getValue } from '@/utils/VariableResolver';
import { getFieldLabel } from '@/libs/metadataUtils';
import { getInputFormattingProps } from '@/utils/householdValues';

export default function HouseholdBuilderMockup1() {
  const [household, setHousehold] = useState<Household>(mockDataMarried.household);
  const [taxYear, setTaxYear] = useState(mockDataMarried.formState.taxYear);
  const [maritalStatus, setMaritalStatus] = useState(mockDataMarried.formState.maritalStatus);
  const [numChildren, setNumChildren] = useState(mockDataMarried.formState.numChildren);

  // Helper functions
  const getPersonVariable = (person: string, field: string) => {
    return HouseholdQueries.getPersonVariable(household, person, field, taxYear);
  };

  const getFieldValue = (field: string) => {
    return getValue(household, field, mockDataMarried.metadata, taxYear);
  };

  const handlePersonFieldChange = (person: string, field: string, value: number) => {
    const updatedHousehold = { ...household };
    if (!updatedHousehold.householdData.people[person]) {
      updatedHousehold.householdData.people[person] = {};
    }
    if (!updatedHousehold.householdData.people[person][field]) {
      updatedHousehold.householdData.people[person][field] = {};
    }
    updatedHousehold.householdData.people[person][field][taxYear] = value;
    setHousehold(updatedHousehold);
  };

  const handleFieldChange = (field: string, value: any) => {
    // For now, just log - in real implementation would use VariableResolver.setValue
    console.log('Field change:', field, value);
  };

  // Field options for dropdowns
  const fieldOptionsMap: Record<string, Array<{ value: string; label: string }>> = {
    state_name: mockDataMarried.metadata.variables.state_name.possibleValues,
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={2}>Mockup 1: Current Design</Title>
          <Text c="dimmed">
            Current household builder with advanced settings collapsed at the bottom
          </Text>
        </Stack>

        <HouseholdBuilderView
          household={household}
          metadata={mockDataMarried.metadata}
          taxYear={taxYear}
          maritalStatus={maritalStatus}
          numChildren={numChildren}
          taxYears={mockDataMarried.taxYears}
          basicInputFields={mockDataMarried.basicInputFields}
          fieldOptionsMap={fieldOptionsMap}
          onTaxYearChange={setTaxYear}
          onMaritalStatusChange={setMaritalStatus}
          onNumChildrenChange={setNumChildren}
          onPersonFieldChange={handlePersonFieldChange}
          onFieldChange={handleFieldChange}
          onHouseholdChange={setHousehold}
          getPersonVariable={getPersonVariable}
          getFieldValue={getFieldValue}
          getFieldLabel={getFieldLabel}
          getInputFormatting={getInputFormattingProps}
        />
      </Stack>
    </Container>
  );
}
