/**
 * ReportBuilder Module
 *
 * This folder contains the refactored ReportBuilder page and its components.
 *
 * Structure:
 * - types.ts: All TypeScript interfaces and types
 * - constants.ts: Configuration constants (FONT_SIZES, INGREDIENT_COLORS, etc.)
 * - styles.ts: Shared style objects
 * - components/: Reusable UI components
 *   - chips/: Chip components (OptionChipSquare, OptionChipRow, etc.)
 *   - shared/: Shared components (CreationStatusHeader, ProgressDot, etc.)
 *   - IngredientSection, SimulationBlock, AddSimulationCard, etc.
 * - modals/: Modal components
 *   - BrowseModalTemplate.tsx: Template for browse modals
 *   - PolicyBrowseModal.tsx: Policy browsing and creation
 *   - PopulationBrowseModal.tsx: Population browsing and creation
 *   - PolicyCreationModal.tsx: Policy creation form
 */

// Main page component
export { default } from './ReportBuilderPage';

// Types
export * from './types';

// Constants
export * from './constants';

// Styles
export * from './styles';

// Components
export * from './components';

// Modals
export * from './modals';
