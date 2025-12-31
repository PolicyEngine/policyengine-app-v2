/**
 * ReportBuilder Module
 *
 * This folder contains the refactored ReportBuilder page and its components.
 * The original ReportBuilder.page.tsx is being progressively migrated here.
 *
 * Structure:
 * - types.ts: All TypeScript interfaces and types
 * - constants.ts: Configuration constants (FONT_SIZES, INGREDIENT_COLORS, etc.)
 * - styles.ts: Shared style objects
 * - components/: Reusable UI components
 *   - chips/: Chip components (OptionChipSquare, OptionChipRow, etc.)
 *   - shared/: Shared components (CreationStatusHeader, ProgressDot, etc.)
 * - modals/: Modal components
 *   - BrowseModalTemplate.tsx: Template for browse modals
 *   - IngredientPickerModal.tsx: Simple ingredient picker
 *   - PolicyBrowseModal.tsx: Policy browsing and creation (TODO: extract)
 *   - PopulationBrowseModal.tsx: Population browsing and creation (TODO: extract)
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Styles
export * from './styles';

// Components
export * from './components';

// Modals
export { BrowseModalTemplate, CreationModeFooter } from './modals/BrowseModalTemplate';
export { IngredientPickerModal } from './modals/IngredientPickerModal';

// Note: The main ReportBuilderPage component is still in ReportBuilder.page.tsx
// It will be migrated once all subcomponents are extracted
