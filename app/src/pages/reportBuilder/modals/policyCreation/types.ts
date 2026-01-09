/**
 * Shared types for PolicyCreationModal components
 */

import { Dispatch, SetStateAction } from 'react';
import { ValueSetterMode } from '@/pathways/report/components/valueSetters';
import { ParameterTreeNode } from '@/types/metadata';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

/**
 * Modified parameter with formatted changes for display
 */
export interface ModifiedParam {
  paramName: string;
  label: string;
  changes: Array<{
    period: string;
    value: string;
  }>;
}

/**
 * Props for ParameterSidebar component
 */
export interface ParameterSidebarProps {
  parameterTree: { children?: ParameterTreeNode[] } | null;
  metadataLoading: boolean;
  selectedParam: ParameterMetadata | null;
  expandedMenuItems: Set<string>;
  parameterSearch: string;
  searchableParameters: Array<{ value: string; label: string }>;
  onSearchChange: (value: string) => void;
  onSearchSelect: (paramName: string) => void;
  onMenuItemClick: (paramName: string) => void;
}

/**
 * Props for PolicyCreationHeader component
 */
export interface PolicyCreationHeaderProps {
  policyLabel: string;
  isEditingLabel: boolean;
  modificationCount: number;
  onLabelChange: (label: string) => void;
  onEditingChange: (editing: boolean) => void;
  onClose: () => void;
}

/**
 * Props for ParameterHeaderCard component
 */
export interface ParameterHeaderCardProps {
  label: string;
  description?: string;
}

/**
 * Props for ValueSetterCard component
 */
export interface ValueSetterCardProps {
  selectedParam: ParameterMetadata;
  localPolicy: PolicyStateProps;
  minDate: string;
  maxDate: string;
  valueSetterMode: ValueSetterMode;
  intervals: ValueInterval[];
  startDate: string;
  endDate: string;
  onModeChange: (mode: ValueSetterMode) => void;
  onIntervalsChange: Dispatch<SetStateAction<ValueInterval[]>>;
  onStartDateChange: Dispatch<SetStateAction<string>>;
  onEndDateChange: Dispatch<SetStateAction<string>>;
  onSubmit: () => void;
}

/**
 * Props for ChangesCard component
 */
export interface ChangesCardProps {
  modifiedParams: ModifiedParam[];
  modificationCount: number;
  selectedParamName?: string;
  onSelectParam: (paramName: string) => void;
}

/**
 * Props for HistoricalValuesCard component
 */
export interface HistoricalValuesCardProps {
  selectedParam: ParameterMetadata;
  baseValues: ValueIntervalCollection | null;
  reformValues: ValueIntervalCollection | null;
  policyLabel: string;
}

/**
 * Props for EmptyParameterState component
 */
export interface EmptyParameterStateProps {
  message?: string;
}
