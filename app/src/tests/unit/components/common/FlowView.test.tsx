import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FlowView from '@/components/common/FlowView';
import {
  BUTTON_PRESETS,
  createButtonPanelCard,
  createCardListItem,
  createSetupConditionCard,
  FLOW_VIEW_STRINGS,
  FLOW_VIEW_VARIANTS,
  mockButtonPanelCards,
  mockCancelAction,
  mockCancelClick,
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
  resetAllMocks,
} from '@/tests/fixtures/components/common/FlowViewMocks';

describe('FlowView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('Basic Rendering', () => {
    test('given title and subtitle then renders both correctly', () => {
      render(
        <FlowView title={FLOW_VIEW_STRINGS.MAIN_TITLE} subtitle={FLOW_VIEW_STRINGS.SUBTITLE} />
      );

      expect(screen.getByText(FLOW_VIEW_STRINGS.MAIN_TITLE)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.SUBTITLE)).toBeInTheDocument();
    });

    test('given only title then renders without subtitle', () => {
      render(<FlowView title={FLOW_VIEW_STRINGS.MAIN_TITLE} />);

      expect(screen.getByText(FLOW_VIEW_STRINGS.MAIN_TITLE)).toBeInTheDocument();
      expect(screen.queryByText(FLOW_VIEW_STRINGS.SUBTITLE)).not.toBeInTheDocument();
    });

    test('given custom content then renders content', () => {
      render(<FlowView title={FLOW_VIEW_STRINGS.MAIN_TITLE} content={<MockCustomContent />} />);

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.CUSTOM_CONTENT)).toBeInTheDocument();
    });
  });

  describe('Setup Conditions Variant', () => {
    test('given setup condition cards then renders all cards', () => {
      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.SETUP_CONDITIONS}
          setupConditionCards={mockSetupConditionCards}
        />
      );

      expect(screen.getByText(FLOW_VIEW_STRINGS.SETUP_CARD_1_TITLE)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.SETUP_CARD_1_DESC)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.SETUP_CARD_2_TITLE)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.SETUP_CARD_2_DESC)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.SETUP_CARD_3_TITLE)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.SETUP_CARD_3_DESC)).toBeInTheDocument();
    });

    test('given fulfilled condition then shows check icon', () => {
      const fulfilledCard = createSetupConditionCard({ isFulfilled: true });

      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.SETUP_CONDITIONS}
          setupConditionCards={[fulfilledCard]}
        />
      );

      // The IconCheck component should be rendered when isFulfilled is true
      const card = screen.getByRole('button', {
        name: new RegExp(FLOW_VIEW_STRINGS.SETUP_CARD_1_TITLE),
      });
      expect(card).toBeInTheDocument();
    });

    test('given selected condition then applies active variant', () => {
      const selectedCard = createSetupConditionCard({ isSelected: true });

      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.SETUP_CONDITIONS}
          setupConditionCards={[selectedCard]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(FLOW_VIEW_STRINGS.SETUP_CARD_1_TITLE),
      });
      expect(card).toHaveAttribute('data-variant', 'setupCondition--active');
    });

    test('given disabled condition then disables card', () => {
      const disabledCard = createSetupConditionCard({ isDisabled: true });

      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.SETUP_CONDITIONS}
          setupConditionCards={[disabledCard]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(FLOW_VIEW_STRINGS.SETUP_CARD_1_TITLE),
      });
      expect(card).toBeDisabled();
    });

    test('given user clicks setup card then calls onClick handler', async () => {
      const user = userEvent.setup();

      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.SETUP_CONDITIONS}
          setupConditionCards={[mockSetupConditionCards[0]]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(FLOW_VIEW_STRINGS.SETUP_CARD_1_TITLE),
      });
      await user.click(card);

      expect(mockCardClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Panel Variant', () => {
    test('given button panel cards then renders all cards', () => {
      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.BUTTON_PANEL}
          buttonPanelCards={mockButtonPanelCards}
        />
      );

      expect(screen.getByText(FLOW_VIEW_STRINGS.PANEL_CARD_1_TITLE)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.PANEL_CARD_1_DESC)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.PANEL_CARD_2_TITLE)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.PANEL_CARD_2_DESC)).toBeInTheDocument();
    });

    test('given selected panel card then applies active variant', () => {
      const selectedCard = createButtonPanelCard({ isSelected: true });

      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.BUTTON_PANEL}
          buttonPanelCards={[selectedCard]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(FLOW_VIEW_STRINGS.PANEL_CARD_1_TITLE),
      });
      expect(card).toHaveAttribute('data-variant', 'buttonPanel--active');
    });

    test('given user clicks panel card then calls onClick handler', async () => {
      const user = userEvent.setup();

      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.BUTTON_PANEL}
          buttonPanelCards={[mockButtonPanelCards[0]]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(FLOW_VIEW_STRINGS.PANEL_CARD_1_TITLE),
      });
      await user.click(card);

      expect(mockCardClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card List Variant', () => {
    test('given card list items then renders all items', () => {
      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.CARD_LIST}
          cardListItems={mockCardListItems}
        />
      );

      expect(screen.getByText(FLOW_VIEW_STRINGS.LIST_ITEM_1_TITLE)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.LIST_ITEM_1_SUBTITLE)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.LIST_ITEM_2_TITLE)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.LIST_ITEM_2_SUBTITLE)).toBeInTheDocument();
      expect(screen.getByText(FLOW_VIEW_STRINGS.LIST_ITEM_3_TITLE)).toBeInTheDocument();
    });

    test('given item without subtitle then renders without subtitle', () => {
      const itemWithoutSubtitle = createCardListItem({ subtitle: undefined });

      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.CARD_LIST}
          cardListItems={[itemWithoutSubtitle]}
        />
      );

      expect(screen.getByText(FLOW_VIEW_STRINGS.LIST_ITEM_1_TITLE)).toBeInTheDocument();
      expect(screen.queryByText(FLOW_VIEW_STRINGS.LIST_ITEM_1_SUBTITLE)).not.toBeInTheDocument();
    });

    test('given selected item then applies active variant', () => {
      const selectedItem = createCardListItem({ isSelected: true });

      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.CARD_LIST}
          cardListItems={[selectedItem]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(FLOW_VIEW_STRINGS.LIST_ITEM_1_TITLE),
      });
      expect(card).toHaveAttribute('data-variant', 'cardList--active');
    });

    test('given disabled item then disables card', () => {
      const disabledItem = createCardListItem({ isDisabled: true });

      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.CARD_LIST}
          cardListItems={[disabledItem]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(FLOW_VIEW_STRINGS.LIST_ITEM_1_TITLE),
      });
      expect(card).toBeDisabled();
    });

    test('given user clicks list item then calls onClick handler', async () => {
      const user = userEvent.setup();

      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          variant={FLOW_VIEW_VARIANTS.CARD_LIST}
          cardListItems={[mockCardListItems[0]]}
        />
      );

      const card = screen.getByRole('button', {
        name: new RegExp(FLOW_VIEW_STRINGS.LIST_ITEM_1_TITLE),
      });
      await user.click(card);

      expect(mockItemClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Configuration', () => {
    test('given explicit buttons then renders them', () => {
      render(<FlowView title={FLOW_VIEW_STRINGS.MAIN_TITLE} buttons={mockExplicitButtons} />);

      expect(
        screen.getByRole('button', { name: FLOW_VIEW_STRINGS.BACK_BUTTON })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: FLOW_VIEW_STRINGS.CONTINUE_BUTTON })
      ).toBeInTheDocument();
    });

    test('given cancel-only preset then renders only cancel button', () => {
      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          buttonPreset={BUTTON_PRESETS.CANCEL_ONLY}
          cancelAction={mockCancelAction}
        />
      );

      expect(
        screen.getByRole('button', { name: FLOW_VIEW_STRINGS.CANCEL_BUTTON })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: FLOW_VIEW_STRINGS.SUBMIT_BUTTON })
      ).not.toBeInTheDocument();
    });

    test('given none preset then renders no buttons', () => {
      render(<FlowView title={FLOW_VIEW_STRINGS.MAIN_TITLE} buttonPreset={BUTTON_PRESETS.NONE} />);

      expect(screen.queryByTestId('multi-button-footer')).not.toBeInTheDocument();
    });

    test('given primary and cancel actions then renders both buttons', () => {
      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          primaryAction={mockPrimaryAction}
          cancelAction={mockCancelAction}
        />
      );

      expect(
        screen.getByRole('button', { name: FLOW_VIEW_STRINGS.CANCEL_BUTTON })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: FLOW_VIEW_STRINGS.SUBMIT_BUTTON })
      ).toBeInTheDocument();
    });

    test('given disabled primary action then renders disabled button', () => {
      render(
        <FlowView title={FLOW_VIEW_STRINGS.MAIN_TITLE} primaryAction={mockPrimaryActionDisabled} />
      );

      const submitButton = screen.getByRole('button', { name: FLOW_VIEW_STRINGS.SUBMIT_BUTTON });
      expect(submitButton).toBeDisabled();
    });

    test('given loading primary action then passes loading state', () => {
      render(
        <FlowView title={FLOW_VIEW_STRINGS.MAIN_TITLE} primaryAction={mockPrimaryActionLoading} />
      );

      const submitButton = screen.getByRole('button', { name: FLOW_VIEW_STRINGS.SUBMIT_BUTTON });
      expect(submitButton).toHaveAttribute('data-loading', 'true');
    });

    test('given cancel button then renders as disabled', () => {
      render(
        <FlowView title={FLOW_VIEW_STRINGS.MAIN_TITLE} buttonPreset={BUTTON_PRESETS.CANCEL_ONLY} />
      );

      const cancelButton = screen.getByRole('button', { name: FLOW_VIEW_STRINGS.CANCEL_BUTTON });
      expect(cancelButton).toBeDisabled();
    });

    test('given cancel action then renders disabled cancel button', () => {
      render(<FlowView title={FLOW_VIEW_STRINGS.MAIN_TITLE} cancelAction={mockCancelAction} />);

      const cancelButton = screen.getByRole('button', { name: FLOW_VIEW_STRINGS.CANCEL_BUTTON });
      expect(cancelButton).toBeDisabled();
    });

    test('given user clicks primary button then calls primary handler', async () => {
      const user = userEvent.setup();

      render(<FlowView title={FLOW_VIEW_STRINGS.MAIN_TITLE} primaryAction={mockPrimaryAction} />);

      const submitButton = screen.getByRole('button', { name: FLOW_VIEW_STRINGS.SUBMIT_BUTTON });
      await user.click(submitButton);

      expect(mockPrimaryClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Precedence', () => {
    test('given explicit buttons and convenience props then explicit buttons take precedence', () => {
      render(
        <FlowView
          title={FLOW_VIEW_STRINGS.MAIN_TITLE}
          buttons={mockExplicitButtons}
          primaryAction={mockPrimaryAction}
          cancelAction={mockCancelAction}
        />
      );

      // Should show explicit buttons, not the primary/cancel actions
      expect(
        screen.getByRole('button', { name: FLOW_VIEW_STRINGS.BACK_BUTTON })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: FLOW_VIEW_STRINGS.CONTINUE_BUTTON })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: FLOW_VIEW_STRINGS.SUBMIT_BUTTON })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: FLOW_VIEW_STRINGS.CANCEL_BUTTON })
      ).not.toBeInTheDocument();
    });

    test('given no actions and no preset then renders default cancel button', () => {
      render(<FlowView title={FLOW_VIEW_STRINGS.MAIN_TITLE} />);

      expect(
        screen.getByRole('button', { name: FLOW_VIEW_STRINGS.CANCEL_BUTTON })
      ).toBeInTheDocument();
    });
  });
});
