import { vi } from 'vitest';
import { ButtonConfig } from '@/components/common/FlowView';

// Test constants for strings
export const FLOW_VIEW_STRINGS = {
  // Titles
  MAIN_TITLE: 'Test Flow Title',
  SUBTITLE: 'This is a test subtitle',

  // Button labels
  CANCEL_BUTTON: 'Cancel',
  SUBMIT_BUTTON: 'Submit',
  CONTINUE_BUTTON: 'Continue',
  BACK_BUTTON: 'Back',

  // Setup condition cards
  SETUP_CARD_1_TITLE: 'First Setup Condition',
  SETUP_CARD_1_DESC: 'Description for first setup condition',
  SETUP_CARD_2_TITLE: 'Second Setup Condition',
  SETUP_CARD_2_DESC: 'Description for second setup condition',
  SETUP_CARD_3_TITLE: 'Third Setup Condition',
  SETUP_CARD_3_DESC: 'Description for third setup condition',

  // Button panel cards
  PANEL_CARD_1_TITLE: 'Option One',
  PANEL_CARD_1_DESC: 'Description for option one',
  PANEL_CARD_2_TITLE: 'Option Two',
  PANEL_CARD_2_DESC: 'Description for option two',

  // Card list items
  LIST_ITEM_1_TITLE: 'List Item One',
  LIST_ITEM_1_SUBTITLE: 'Subtitle for item one',
  LIST_ITEM_2_TITLE: 'List Item Two',
  LIST_ITEM_2_SUBTITLE: 'Subtitle for item two',
  LIST_ITEM_3_TITLE: 'List Item Three',

  // Content
  CUSTOM_CONTENT: 'Custom content for testing',

  // Console log messages
  CANCEL_CLICKED_MSG: 'Cancel clicked',
} as const;

// Test constants for variants
export const FLOW_VIEW_VARIANTS = {
  SETUP_CONDITIONS: 'setupConditions' as const,
  BUTTON_PANEL: 'buttonPanel' as const,
  CARD_LIST: 'cardList' as const,
} as const;

// Test constants for button presets
export const BUTTON_PRESETS = {
  CANCEL_ONLY: 'cancel-only' as const,
  CANCEL_PRIMARY: 'cancel-primary' as const,
  NONE: 'none' as const,
} as const;

// Test constants for button variants
export const BUTTON_VARIANTS = {
  DEFAULT: 'default' as const,
  FILLED: 'filled' as const,
  DISABLED: 'disabled' as const,
} as const;

// Mock functions
export const mockOnClick = vi.fn();
export const mockCancelClick = vi.fn();
export const mockPrimaryClick = vi.fn();
export const mockCardClick = vi.fn();
export const mockItemClick = vi.fn();

// Mock setup condition cards
export const mockSetupConditionCards = [
  {
    title: FLOW_VIEW_STRINGS.SETUP_CARD_1_TITLE,
    description: FLOW_VIEW_STRINGS.SETUP_CARD_1_DESC,
    onClick: mockCardClick,
    isSelected: false,
    isDisabled: false,
    isFulfilled: false,
  },
  {
    title: FLOW_VIEW_STRINGS.SETUP_CARD_2_TITLE,
    description: FLOW_VIEW_STRINGS.SETUP_CARD_2_DESC,
    onClick: mockCardClick,
    isSelected: true,
    isDisabled: false,
    isFulfilled: false,
  },
  {
    title: FLOW_VIEW_STRINGS.SETUP_CARD_3_TITLE,
    description: FLOW_VIEW_STRINGS.SETUP_CARD_3_DESC,
    onClick: mockCardClick,
    isSelected: false,
    isDisabled: false,
    isFulfilled: true,
  },
];

// Mock button panel cards
export const mockButtonPanelCards = [
  {
    title: FLOW_VIEW_STRINGS.PANEL_CARD_1_TITLE,
    description: FLOW_VIEW_STRINGS.PANEL_CARD_1_DESC,
    onClick: mockCardClick,
    isSelected: false,
    isDisabled: false,
  },
  {
    title: FLOW_VIEW_STRINGS.PANEL_CARD_2_TITLE,
    description: FLOW_VIEW_STRINGS.PANEL_CARD_2_DESC,
    onClick: mockCardClick,
    isSelected: true,
    isDisabled: false,
  },
];

// Mock card list items
export const mockCardListItems = [
  {
    title: FLOW_VIEW_STRINGS.LIST_ITEM_1_TITLE,
    subtitle: FLOW_VIEW_STRINGS.LIST_ITEM_1_SUBTITLE,
    onClick: mockItemClick,
    isSelected: false,
    isDisabled: false,
  },
  {
    title: FLOW_VIEW_STRINGS.LIST_ITEM_2_TITLE,
    subtitle: FLOW_VIEW_STRINGS.LIST_ITEM_2_SUBTITLE,
    onClick: mockItemClick,
    isSelected: true,
    isDisabled: false,
  },
  {
    title: FLOW_VIEW_STRINGS.LIST_ITEM_3_TITLE,
    onClick: mockItemClick,
    isSelected: false,
    isDisabled: true,
  },
];

// Mock button configurations
export const mockExplicitButtons: ButtonConfig[] = [
  {
    label: FLOW_VIEW_STRINGS.BACK_BUTTON,
    variant: BUTTON_VARIANTS.DEFAULT,
    onClick: mockOnClick,
  },
  {
    label: FLOW_VIEW_STRINGS.CONTINUE_BUTTON,
    variant: BUTTON_VARIANTS.FILLED,
    onClick: mockOnClick,
  },
];

export const mockPrimaryAction = {
  label: FLOW_VIEW_STRINGS.SUBMIT_BUTTON,
  onClick: mockPrimaryClick,
  isLoading: false,
  isDisabled: false,
};

export const mockPrimaryActionDisabled = {
  label: FLOW_VIEW_STRINGS.SUBMIT_BUTTON,
  onClick: mockPrimaryClick,
  isLoading: false,
  isDisabled: true,
};

export const mockPrimaryActionLoading = {
  label: FLOW_VIEW_STRINGS.SUBMIT_BUTTON,
  onClick: mockPrimaryClick,
  isLoading: true,
  isDisabled: false,
};

export const mockCancelAction = {
  label: FLOW_VIEW_STRINGS.CANCEL_BUTTON,
  onClick: mockCancelClick,
};

// Mock custom content component
export const MockCustomContent = () => (
  <div data-testid="custom-content">{FLOW_VIEW_STRINGS.CUSTOM_CONTENT}</div>
);

// Helper function to reset all mocks
export const resetAllMocks = () => {
  mockOnClick.mockClear();
  mockCancelClick.mockClear();
  mockPrimaryClick.mockClear();
  mockCardClick.mockClear();
  mockItemClick.mockClear();
};

// Mock the MultiButtonFooter component
vi.mock('@/components/common/MultiButtonFooter', () => ({
  default: vi.fn(({ buttons }: { buttons: ButtonConfig[] }) => (
    <div data-testid="multi-button-footer">
      {buttons.map((button, index) => (
        <button
          key={index}
          type="button"
          onClick={button.onClick}
          disabled={button.variant === BUTTON_VARIANTS.DISABLED}
          data-loading={button.isLoading}
        >
          {button.label}
        </button>
      ))}
    </div>
  )),
}));

// Test data generators
export const createSetupConditionCard = (overrides = {}) => ({
  title: FLOW_VIEW_STRINGS.SETUP_CARD_1_TITLE,
  description: FLOW_VIEW_STRINGS.SETUP_CARD_1_DESC,
  onClick: mockCardClick,
  isSelected: false,
  isDisabled: false,
  isFulfilled: false,
  ...overrides,
});

export const createButtonPanelCard = (overrides = {}) => ({
  title: FLOW_VIEW_STRINGS.PANEL_CARD_1_TITLE,
  description: FLOW_VIEW_STRINGS.PANEL_CARD_1_DESC,
  onClick: mockCardClick,
  isSelected: false,
  isDisabled: false,
  ...overrides,
});

export const createCardListItem = (overrides = {}) => ({
  title: FLOW_VIEW_STRINGS.LIST_ITEM_1_TITLE,
  subtitle: FLOW_VIEW_STRINGS.LIST_ITEM_1_SUBTITLE,
  onClick: mockItemClick,
  isSelected: false,
  isDisabled: false,
  ...overrides,
});
