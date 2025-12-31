/**
 * Type definitions for ReportBuilder components
 */
import { ReactNode } from 'react';
import {
  SimulationStateProps,
  PopulationStateProps,
} from '@/types/pathwayState';

// ============================================================================
// CORE STATE TYPES
// ============================================================================

export interface ReportBuilderState {
  label: string | null;
  year: string;
  simulations: SimulationStateProps[];
}

export type IngredientType = 'policy' | 'population' | 'dynamics';
export type ViewMode = 'cards' | 'rows';

export interface IngredientPickerState {
  isOpen: boolean;
  simulationIndex: number;
  ingredientType: IngredientType;
}

// ============================================================================
// COLOR CONFIG
// ============================================================================

export interface IngredientColorConfig {
  icon: string;
  bg: string;
  border: string;
  accent: string;
}

// ============================================================================
// DATA TYPES
// ============================================================================

export interface SavedPolicy {
  id: string;
  label: string;
  paramCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecentPopulation {
  id: string;
  label: string;
  type: 'geography' | 'household';
  population: PopulationStateProps;
}

// ============================================================================
// MODAL TEMPLATE TYPES
// ============================================================================

export interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: string | number;
  isActive?: boolean;
  onClick: () => void;
}

export interface BrowseModalSidebarSection {
  id: string;
  label: string;
  items: SidebarItem[];
}

export interface BrowseModalTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  headerIcon: ReactNode;
  headerTitle: string;
  headerSubtitle: string;
  colorConfig: IngredientColorConfig;
  sidebarSections: BrowseModalSidebarSection[];
  renderMainContent: () => ReactNode;
  statusHeader?: ReactNode;
  footer?: ReactNode;
}

// ============================================================================
// CREATION STATUS HEADER TYPES
// ============================================================================

export interface CreationStatusHeaderProps {
  colorConfig: IngredientColorConfig;
  icon: ReactNode;
  label: string;
  placeholder: string;
  isEditingLabel: boolean;
  onLabelChange: (value: string) => void;
  onStartEditing: () => void;
  onStopEditing: () => void;
  statusText: string;
  hasChanges: boolean;
  children?: ReactNode;
}

// ============================================================================
// CHIP COMPONENT TYPES
// ============================================================================

export interface OptionChipSquareProps {
  icon: ReactNode;
  label: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  colorConfig: IngredientColorConfig;
}

export interface OptionChipRowProps {
  icon: ReactNode;
  label: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  colorConfig: IngredientColorConfig;
}

export interface CreateCustomChipProps {
  label: string;
  onClick: () => void;
  variant: 'square' | 'row';
  colorConfig: IngredientColorConfig;
}

export interface BrowseMoreChipProps {
  label: string;
  description?: string;
  onClick: () => void;
  variant: 'square' | 'row';
  colorConfig: IngredientColorConfig;
}

// ============================================================================
// SECTION COMPONENT TYPES
// ============================================================================

export interface IngredientSectionProps {
  type: IngredientType;
  currentId?: string;
  countryId?: 'us' | 'uk';
  onQuickSelectPolicy?: (type: 'current-law') => void;
  onSelectSavedPolicy?: (id: string, label: string, paramCount: number) => void;
  onQuickSelectPopulation?: (type: 'nationwide') => void;
  onSelectRecentPopulation?: (population: PopulationStateProps) => void;
  onDeselectPopulation?: () => void;
  onDeselectPolicy?: () => void;
  onCreateCustom: () => void;
  onBrowseMore?: () => void;
  isInherited?: boolean;
  inheritedPopulationType?: 'household' | 'nationwide' | null;
  savedPolicies?: SavedPolicy[];
  recentPopulations?: RecentPopulation[];
  viewMode: ViewMode;
}

export interface SimulationBlockProps {
  simulation: SimulationStateProps;
  index: number;
  countryId: 'us' | 'uk';
  onLabelChange: (label: string) => void;
  onQuickSelectPolicy: () => void;
  onSelectSavedPolicy: (id: string, label: string, paramCount: number) => void;
  onQuickSelectPopulation: () => void;
  onSelectRecentPopulation: (population: PopulationStateProps) => void;
  onDeselectPolicy: () => void;
  onDeselectPopulation: () => void;
  onCreateCustomPolicy: () => void;
  onBrowseMorePolicies: () => void;
  onBrowseMorePopulations: () => void;
  onRemove?: () => void;
  canRemove: boolean;
  isRequired?: boolean;
  populationInherited?: boolean;
  inheritedPopulation?: PopulationStateProps;
  savedPolicies: SavedPolicy[];
  recentPopulations: RecentPopulation[];
  viewMode: ViewMode;
}

export interface AddSimulationCardProps {
  onClick: () => void;
  disabled?: boolean;
}

// ============================================================================
// MODAL COMPONENT TYPES
// ============================================================================

export interface IngredientPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: IngredientType;
  onSelect: (value: string) => void;
  onCreateNew: () => void;
}

export interface PolicyBrowseState {
  isOpen: boolean;
  simulationIndex: number;
}

export interface PolicyBrowseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (policyId: string, label: string, paramCount: number) => void;
  savedPolicies: SavedPolicy[];
  policiesLoading?: boolean;
}

export interface PopulationBrowseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (population: PopulationStateProps) => void;
  onCreateNew?: () => void;
}

export interface PolicyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPolicyCreated: (policyId: string, label: string, paramCount: number) => void;
}

// ============================================================================
// CANVAS AND PAGE TYPES
// ============================================================================

export interface SimulationCanvasProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  pickerState: IngredientPickerState;
  setPickerState: React.Dispatch<React.SetStateAction<IngredientPickerState>>;
  viewMode: ViewMode;
}

export interface ReportMetaPanelProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  isReportConfigured: boolean;
}

// ============================================================================
// POPULATION CATEGORIES
// ============================================================================

export type PopulationCategory =
  | 'national'
  | 'states'
  | 'districts'
  | 'countries'
  | 'constituencies'
  | 'local-authorities'
  | 'my-households';
