/**
 * Type definitions for ReportBuilder components
 */
import { ReactNode } from 'react';
import { PopulationStateProps, SimulationStateProps } from '@/types/pathwayState';

// ============================================================================
// CORE STATE TYPES
// ============================================================================

export interface ReportBuilderState {
  id?: string;
  label: string | null;
  year: string;
  simulations: SimulationStateProps[];
}

export type IngredientType = 'policy' | 'population' | 'dynamics';

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
  items?: SidebarItem[];
}

export interface BrowseModalTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  headerIcon: ReactNode;
  headerTitle: ReactNode;
  headerSubtitle?: string;
  /** Content to display on the right side of the header (e.g., status indicator) */
  headerRightContent?: ReactNode;
  colorConfig: IngredientColorConfig;
  /** Standard sidebar sections - use for simple browse mode sidebars */
  sidebarSections?: BrowseModalSidebarSection[];
  /** Custom sidebar rendering - use when sidebar needs custom layout (e.g., parameter tree) */
  renderSidebar?: () => ReactNode;
  /** Sidebar width override (default: 220px) */
  sidebarWidth?: number;
  renderMainContent: () => ReactNode;
  /** Status header shown above main content (e.g., creation mode status bar) */
  statusHeader?: ReactNode;
  /** Footer shown below main content (e.g., creation mode buttons) */
  footer?: ReactNode;
  /** Content area padding override (default: spacing.lg). Set to 0 for full-bleed content. */
  contentPadding?: number | string;
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
  onQuickSelectPolicy?: () => void;
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
  currentLabel?: string;
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
// TOP BAR TYPES
// ============================================================================

export interface TopBarAction {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

// ============================================================================
// CANVAS AND PAGE TYPES
// ============================================================================

export interface SimulationCanvasProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  pickerState: IngredientPickerState;
  setPickerState: React.Dispatch<React.SetStateAction<IngredientPickerState>>;
}

export interface ReportMetaPanelProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
}

// ============================================================================
// POPULATION CATEGORIES
// ============================================================================

export type PopulationCategory =
  | 'frequently-selected'
  | 'states'
  | 'districts'
  | 'places'
  | 'countries'
  | 'constituencies'
  | 'local-authorities'
  | 'my-households';
