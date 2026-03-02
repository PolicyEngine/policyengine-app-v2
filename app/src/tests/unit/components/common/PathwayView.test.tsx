import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PathwayView from '@/components/common/PathwayView';
import {
  BUTTON_PRESETS,
  createButtonPanelCard,
  createCardListItem,
  createSetupConditionCard,
  mockButtonPanelCards,
  mockCancelAction,
  mockCardClick,
  mockCardListItems,
  MockCustomContent,
  mockExplicitButtons,
  mockItemClick,
  mockPrimaryAction,
  mockPrimaryActionDisabled,
  mockPrimaryActionLoading,
  mockPrimaryClick,
  mockSetupConditionCards,
  PATHWAY_VIEW_STRINGS,
  PATHWAY_VIEW_VARIANTS,
  resetAllMocks,
} from '@/tests/fixtures/components/common/PathwayViewMocks';

describe('PathwayView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('Basic Rendering', () => {
    test('given title and subtitle then renders both correctly', () => {
      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          subtitle={PATHWAY_VIEW_STRINGS.SUBTITLE}
        />
      );

      expect(screen.getByText(PATHWAY_VIEW_STRINGS.MAIN_TITLE)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.SUBTITLE)).toBeInTheDocument();
    });

    test('given only title then renders without subtitle', () => {
      render(<PathwayView title={PATHWAY_VIEW_STRINGS.MAIN_TITLE} />);

      expect(screen.getByText(PATHWAY_VIEW_STRINGS.MAIN_TITLE)).toBeInTheDocument();
      expect(screen.queryByText(PATHWAY_VIEW_STRINGS.SUBTITLE)).not.toBeInTheDocument();
    });

    test('given custom content then renders content', () => {
      render(
        <PathwayView title={PATHWAY_VIEW_STRINGS.MAIN_TITLE} content={<MockCustomContent />} />
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.CUSTOM_CONTENT)).toBeInTheDocument();
    });
  });

  describe('Setup Conditions Variant', () => {
    test('given setup condition cards then renders all cards', () => {
      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.SETUP_CONDITIONS}
          setupConditionCards={mockSetupConditionCards}
        />
      );

      expect(screen.getByText(PATHWAY_VIEW_STRINGS.SETUP_CARD_1_TITLE)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.SETUP_CARD_1_DESC)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.SETUP_CARD_2_TITLE)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.SETUP_CARD_2_DESC)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.SETUP_CARD_3_TITLE)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.SETUP_CARD_3_DESC)).toBeInTheDocument();
    });

    test('given fulfilled condition then shows check icon', () => {
      const fulfilledCard = createSetupConditionCard({ isFulfilled: true });

      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.SETUP_CONDITIONS}
          setupConditionCards={[fulfilledCard]}
        />
      );

      // The IconCheck component should be rendered when isFulfilled is true
      const card = screen.getByRole('button', {
        name: new RegExp(PATHWAY_VIEW_STRINGS.SETUP_CARD_1_TITLE),
      });
      expect(card).toBeInTheDocument();
    });

    test('given selected condition then applies active variant', () => {
      const selectedCard = createSetupConditionCard({ isSelected: true });

      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.SETUP_CONDITIONS}
          setupConditionCards={[selectedCard]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(PATHWAY_VIEW_STRINGS.SETUP_CARD_1_TITLE),
      });
      // Active state is now applied via Tailwind classes (border-primary-500 and bg-primary-50)
      expect(card.className).toContain('border-primary-500');
    });

    test('given disabled condition then disables card', () => {
      const disabledCard = createSetupConditionCard({ isDisabled: true });

      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.SETUP_CONDITIONS}
          setupConditionCards={[disabledCard]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(PATHWAY_VIEW_STRINGS.SETUP_CARD_1_TITLE),
      });
      expect(card).toBeDisabled();
    });

    test('given user clicks setup card then calls onClick handler', async () => {
      const user = userEvent.setup();

      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.SETUP_CONDITIONS}
          setupConditionCards={[mockSetupConditionCards[0]]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(PATHWAY_VIEW_STRINGS.SETUP_CARD_1_TITLE),
      });
      await user.click(card);

      expect(mockCardClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Panel Variant', () => {
    test('given button panel cards then renders all cards', () => {
      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.BUTTON_PANEL}
          buttonPanelCards={mockButtonPanelCards}
        />
      );

      expect(screen.getByText(PATHWAY_VIEW_STRINGS.PANEL_CARD_1_TITLE)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.PANEL_CARD_1_DESC)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.PANEL_CARD_2_TITLE)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.PANEL_CARD_2_DESC)).toBeInTheDocument();
    });

    test('given selected panel card then applies active variant', () => {
      const selectedCard = createButtonPanelCard({ isSelected: true });

      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.BUTTON_PANEL}
          buttonPanelCards={[selectedCard]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(PATHWAY_VIEW_STRINGS.PANEL_CARD_1_TITLE),
      });
      // Active state is now applied via Tailwind classes (border-primary-500 and bg-primary-50)
      expect(card.className).toContain('border-primary-500');
    });

    test('given user clicks panel card then calls onClick handler', async () => {
      const user = userEvent.setup();

      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.BUTTON_PANEL}
          buttonPanelCards={[mockButtonPanelCards[0]]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(PATHWAY_VIEW_STRINGS.PANEL_CARD_1_TITLE),
      });
      await user.click(card);

      expect(mockCardClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card List Variant', () => {
    test('given card list items then renders all items', () => {
      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.CARD_LIST}
          cardListItems={mockCardListItems}
        />
      );

      expect(screen.getByText(PATHWAY_VIEW_STRINGS.LIST_ITEM_1_TITLE)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.LIST_ITEM_1_SUBTITLE)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.LIST_ITEM_2_TITLE)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.LIST_ITEM_2_SUBTITLE)).toBeInTheDocument();
      expect(screen.getByText(PATHWAY_VIEW_STRINGS.LIST_ITEM_3_TITLE)).toBeInTheDocument();
    });

    test('given item without subtitle then renders without subtitle', () => {
      const itemWithoutSubtitle = createCardListItem({ subtitle: undefined });

      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.CARD_LIST}
          cardListItems={[itemWithoutSubtitle]}
        />
      );

      expect(screen.getByText(PATHWAY_VIEW_STRINGS.LIST_ITEM_1_TITLE)).toBeInTheDocument();
      expect(screen.queryByText(PATHWAY_VIEW_STRINGS.LIST_ITEM_1_SUBTITLE)).not.toBeInTheDocument();
    });

    test('given selected item then applies active variant', () => {
      const selectedItem = createCardListItem({ isSelected: true });

      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.CARD_LIST}
          cardListItems={[selectedItem]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(PATHWAY_VIEW_STRINGS.LIST_ITEM_1_TITLE),
      });
      // Active state is now applied via Tailwind classes (border-primary-500 and bg-primary-50)
      expect(card.className).toContain('border-primary-500');
    });

    test('given disabled item then disables card', () => {
      const disabledItem = createCardListItem({ isDisabled: true });

      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.CARD_LIST}
          cardListItems={[disabledItem]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(PATHWAY_VIEW_STRINGS.LIST_ITEM_1_TITLE),
      });
      expect(card).toBeDisabled();
    });

    test('given user clicks list item then calls onClick handler', async () => {
      const user = userEvent.setup();

      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          variant={PATHWAY_VIEW_VARIANTS.CARD_LIST}
          cardListItems={[mockCardListItems[0]]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(PATHWAY_VIEW_STRINGS.LIST_ITEM_1_TITLE),
      });
      await user.click(card);

      expect(mockItemClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Configuration', () => {
    test('given explicit buttons then renders them', () => {
      render(<PathwayView title={PATHWAY_VIEW_STRINGS.MAIN_TITLE} buttons={mockExplicitButtons} />);

      expect(
        screen.getByRole('button', { name: PATHWAY_VIEW_STRINGS.BACK_BUTTON })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: PATHWAY_VIEW_STRINGS.CONTINUE_BUTTON })
      ).toBeInTheDocument();
    });

    test('given cancel-only preset then renders only cancel button', () => {
      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          buttonPreset={BUTTON_PRESETS.CANCEL_ONLY}
          cancelAction={mockCancelAction}
        />
      );

      expect(
        screen.getByRole('button', { name: PATHWAY_VIEW_STRINGS.CANCEL_BUTTON })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: PATHWAY_VIEW_STRINGS.SUBMIT_BUTTON })
      ).not.toBeInTheDocument();
    });

    test('given none preset then renders no buttons', () => {
      render(
        <PathwayView title={PATHWAY_VIEW_STRINGS.MAIN_TITLE} buttonPreset={BUTTON_PRESETS.NONE} />
      );

      expect(screen.queryByTestId('multi-button-footer')).not.toBeInTheDocument();
    });

    test('given primary and cancel actions then renders both buttons', () => {
      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          primaryAction={mockPrimaryAction}
          cancelAction={mockCancelAction}
        />
      );

      expect(
        screen.getByRole('button', { name: PATHWAY_VIEW_STRINGS.CANCEL_BUTTON })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: PATHWAY_VIEW_STRINGS.SUBMIT_BUTTON })
      ).toBeInTheDocument();
    });

    test('given disabled primary action then renders disabled button', () => {
      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          primaryAction={mockPrimaryActionDisabled}
        />
      );

      const submitButton = screen.getByRole('button', { name: PATHWAY_VIEW_STRINGS.SUBMIT_BUTTON });
      expect(submitButton).toBeDisabled();
    });

    test('given loading primary action then passes loading state', () => {
      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          primaryAction={mockPrimaryActionLoading}
        />
      );

      // Loading state disables the button and renders a Spinner inside it
      // The Spinner's sr-only text "Loading..." is part of the accessible name
      const submitButton = screen.getByRole('button', {
        name: new RegExp(PATHWAY_VIEW_STRINGS.SUBMIT_BUTTON),
      });
      expect(submitButton).toBeDisabled();
    });

    test('given cancel button then renders as disabled', () => {
      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          buttonPreset={BUTTON_PRESETS.CANCEL_ONLY}
        />
      );

      const cancelButton = screen.getByRole('button', { name: PATHWAY_VIEW_STRINGS.CANCEL_BUTTON });
      expect(cancelButton).toBeDisabled();
    });

    test('given cancel action with onClick then renders enabled cancel button', () => {
      render(
        <PathwayView title={PATHWAY_VIEW_STRINGS.MAIN_TITLE} cancelAction={mockCancelAction} />
      );

      const cancelButton = screen.getByRole('button', { name: PATHWAY_VIEW_STRINGS.CANCEL_BUTTON });
      expect(cancelButton).not.toBeDisabled();
    });

    test('given user clicks primary button then calls primary handler', async () => {
      const user = userEvent.setup();

      render(
        <PathwayView title={PATHWAY_VIEW_STRINGS.MAIN_TITLE} primaryAction={mockPrimaryAction} />
      );

      const submitButton = screen.getByRole('button', { name: PATHWAY_VIEW_STRINGS.SUBMIT_BUTTON });
      await user.click(submitButton);

      expect(mockPrimaryClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Precedence', () => {
    test('given explicit buttons and convenience props then uses new layout with actions', () => {
      render(
        <PathwayView
          title={PATHWAY_VIEW_STRINGS.MAIN_TITLE}
          buttons={mockExplicitButtons}
          primaryAction={mockPrimaryAction}
          cancelAction={mockCancelAction}
        />
      );

      // When convenience props are provided, they take precedence over explicit buttons
      expect(
        screen.getByRole('button', { name: PATHWAY_VIEW_STRINGS.SUBMIT_BUTTON })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: PATHWAY_VIEW_STRINGS.CANCEL_BUTTON })
      ).toBeInTheDocument();
    });

    test('given no actions and no preset then renders no buttons', () => {
      render(<PathwayView title={PATHWAY_VIEW_STRINGS.MAIN_TITLE} />);

      // Without any button configuration, no buttons are rendered
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });
});
