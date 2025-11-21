/**
 * HouseholdBuilderView - Pure presentation component
 *
 * Accepts all data as props and calls callbacks for interactions.
 * No Redux, no hooks - just UI rendering and event handling.
 */

import { Divider, Group, NumberInput, Select, Stack, Text } from '@mantine/core';
import { Household } from '@/types/ingredients/Household';
import AdvancedSettings from './AdvancedSettings';

export interface HouseholdBuilderViewProps {
  // Data
  household: Household;
  metadata: any;
  taxYear: string;
  maritalStatus: 'single' | 'married';
  numChildren: number;

  // Options
  taxYears: Array<{ value: string; label: string }>;
  basicInputFields: {
    person: string[];
    household: string[];
    taxUnit: string[];
    spmUnit: string[];
    family: string[];
    maritalUnit: string[];
  };
  fieldOptionsMap: Record<string, Array<{ value: string; label: string }>>;

  // State
  loading?: boolean;
  disabled?: boolean;

  // Callbacks
  onTaxYearChange: (year: string) => void;
  onMaritalStatusChange: (status: 'single' | 'married') => void;
  onNumChildrenChange: (num: number) => void;
  onPersonFieldChange: (person: string, field: string, value: number) => void;
  onFieldChange: (field: string, value: any) => void;
  onHouseholdChange: (household: Household) => void;

  // Helpers
  getPersonVariable: (person: string, field: string) => any;
  getFieldValue: (field: string) => any;
  getFieldLabel: (field: string) => string;
  getInputFormatting: (variable: any) => any;
}

export default function HouseholdBuilderView({
  household,
  metadata,
  taxYear,
  maritalStatus,
  numChildren,
  taxYears,
  basicInputFields,
  fieldOptionsMap,
  loading = false,
  disabled = false,
  onTaxYearChange,
  onMaritalStatusChange,
  onNumChildrenChange,
  onPersonFieldChange,
  onFieldChange,
  onHouseholdChange,
  getPersonVariable,
  getFieldValue,
  getFieldLabel,
  getInputFormatting,
}: HouseholdBuilderViewProps) {
  const variables = metadata.variables;

  // Render non-person fields
  const renderNonPersonFields = () => {
    const nonPersonFields = [
      ...basicInputFields.household,
      ...basicInputFields.taxUnit,
      ...basicInputFields.spmUnit,
      ...basicInputFields.family,
      ...basicInputFields.maritalUnit,
    ];

    if (!nonPersonFields.length) {
      return null;
    }

    return (
      <Stack gap="xs">
        <Text fw={500} size="sm" c="dimmed">
          Location & Geographic Information
        </Text>
        {nonPersonFields.map((field) => {
          const fieldVariable = variables?.[field];
          const isDropdown = !!(
            fieldVariable?.possibleValues && Array.isArray(fieldVariable.possibleValues)
          );
          const fieldLabel = getFieldLabel(field);
          const fieldValue = getFieldValue(field) || '';

          if (isDropdown) {
            const options = fieldOptionsMap[field] || [];
            return (
              <Select
                key={field}
                label={fieldLabel}
                value={fieldValue?.toString() || ''}
                onChange={(val) => onFieldChange(field, val)}
                data={options}
                placeholder={`Select ${fieldLabel}`}
                searchable
                disabled={disabled}
              />
            );
          }

          return (
            <Select
              key={field}
              label={fieldLabel}
              value={fieldValue?.toString() || ''}
              onChange={(val) => onFieldChange(field, val)}
              data={[]}
              placeholder={`Select ${fieldLabel}`}
              searchable
              disabled={disabled}
            />
          );
        })}
      </Stack>
    );
  };

  // Render adults section
  const renderAdults = () => {
    const ageVariable = variables?.age;
    const employmentIncomeVariable = variables?.employment_income;
    const ageFormatting = ageVariable ? getInputFormatting(ageVariable) : {};
    const incomeFormatting = employmentIncomeVariable
      ? getInputFormatting(employmentIncomeVariable)
      : {};

    return (
      <Stack gap="md">
        <Text fw={500} size="sm" c="dimmed">
          Adults
        </Text>

        {/* Primary adult */}
        <Group gap="xs">
          <Text size="sm" fw={500} style={{ flex: 0, minWidth: 100 }}>
            You
          </Text>
          <NumberInput
            value={getPersonVariable('you', 'age') || 0}
            onChange={(val) => onPersonFieldChange('you', 'age', Number(val) || 0)}
            min={18}
            max={120}
            placeholder="Age"
            style={{ flex: 1 }}
            disabled={disabled}
            {...ageFormatting}
          />
          <NumberInput
            value={getPersonVariable('you', 'employment_income') || 0}
            onChange={(val) => onPersonFieldChange('you', 'employment_income', Number(val) || 0)}
            min={0}
            placeholder="Employment Income"
            style={{ flex: 2 }}
            disabled={disabled}
            {...incomeFormatting}
          />
        </Group>

        {/* Spouse */}
        {maritalStatus === 'married' && (
          <Group gap="xs">
            <Text size="sm" fw={500} style={{ flex: 0, minWidth: 100 }}>
              Your Partner
            </Text>
            <NumberInput
              value={getPersonVariable('your partner', 'age') || 0}
              onChange={(val) => onPersonFieldChange('your partner', 'age', Number(val) || 0)}
              min={18}
              max={120}
              placeholder="Age"
              style={{ flex: 1 }}
              disabled={disabled}
              {...ageFormatting}
            />
            <NumberInput
              value={getPersonVariable('your partner', 'employment_income') || 0}
              onChange={(val) =>
                onPersonFieldChange('your partner', 'employment_income', Number(val) || 0)
              }
              min={0}
              placeholder="Employment Income"
              style={{ flex: 2 }}
              disabled={disabled}
              {...incomeFormatting}
            />
          </Group>
        )}
      </Stack>
    );
  };

  // Render children section
  const renderChildren = () => {
    if (numChildren === 0) {
      return null;
    }

    const ageVariable = variables?.age;
    const employmentIncomeVariable = variables?.employment_income;
    const ageFormatting = ageVariable ? getInputFormatting(ageVariable) : {};
    const incomeFormatting = employmentIncomeVariable
      ? getInputFormatting(employmentIncomeVariable)
      : {};

    const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
    const children = Array.from({ length: numChildren }, (_, i) => {
      const childName = `your ${ordinals[i] || `${i + 1}th`} dependent`;
      return childName;
    });

    return (
      <Stack gap="md">
        <Text fw={500} size="sm" c="dimmed">
          Children
        </Text>
        {children.map((childName) => (
          <Group key={childName} gap="xs">
            <Text size="sm" fw={500} style={{ flex: 0, minWidth: 100 }}>
              {childName
                .split(' ')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')}
            </Text>
            <NumberInput
              value={getPersonVariable(childName, 'age') || 0}
              onChange={(val) => onPersonFieldChange(childName, 'age', Number(val) || 0)}
              min={0}
              max={17}
              placeholder="Age"
              style={{ flex: 1 }}
              disabled={disabled}
              {...ageFormatting}
            />
            <NumberInput
              value={getPersonVariable(childName, 'employment_income') || 0}
              onChange={(val) =>
                onPersonFieldChange(childName, 'employment_income', Number(val) || 0)
              }
              min={0}
              placeholder="Employment Income"
              style={{ flex: 2 }}
              disabled={disabled}
              {...incomeFormatting}
            />
          </Group>
        ))}
      </Stack>
    );
  };

  return (
    <Stack gap="md" style={{ opacity: loading ? 0.6 : 1 }}>
      {/* Structural controls */}
      <Group gap="md">
        <Select
          label="Tax Year"
          value={taxYear}
          onChange={(val) => val && onTaxYearChange(val)}
          data={taxYears}
          style={{ flex: 1 }}
          disabled={disabled}
        />
        <Select
          label="Marital Status"
          value={maritalStatus}
          onChange={(val) => val && onMaritalStatusChange(val as 'single' | 'married')}
          data={[
            { value: 'single', label: 'Single' },
            { value: 'married', label: 'Married' },
          ]}
          style={{ flex: 1 }}
          disabled={disabled}
        />
        <Select
          label="Number of Children"
          value={numChildren.toString()}
          onChange={(val) => val && onNumChildrenChange(parseInt(val, 10))}
          data={[
            { value: '0', label: '0' },
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' },
          ]}
          style={{ flex: 1 }}
          disabled={disabled}
        />
      </Group>

      {/* Non-person fields */}
      {renderNonPersonFields()}

      <Divider />

      {/* Adults */}
      {renderAdults()}

      {numChildren > 0 && <Divider />}

      {/* Children */}
      {renderChildren()}

      <Divider />

      {/* Advanced Settings */}
      <AdvancedSettings
        household={household}
        metadata={metadata}
        year={taxYear}
        onChange={onHouseholdChange}
        disabled={disabled || loading}
      />
    </Stack>
  );
}
