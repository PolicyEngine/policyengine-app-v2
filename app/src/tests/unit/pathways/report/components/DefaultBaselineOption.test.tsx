import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import DefaultBaselineOption from '@/pathways/report/components/DefaultBaselineOption';
import {
  DEFAULT_BASELINE_LABELS,
  mockOnClick,
  resetAllMocks,
  TEST_COUNTRIES,
} from '@/tests/fixtures/pathways/report/components/DefaultBaselineOptionMocks';

describe('DefaultBaselineOption', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('given component renders then displays default baseline label', () => {
      // When
      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      // Then
      expect(screen.getByText(DEFAULT_BASELINE_LABELS.US)).toBeInTheDocument();
      expect(
        screen.getByText('Use current law with all households nationwide as baseline')
      ).toBeInTheDocument();
    });

    test('given UK country then displays UK label', () => {
      // When
      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.UK}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      // Then
      expect(screen.getByText(DEFAULT_BASELINE_LABELS.UK)).toBeInTheDocument();
    });

    test('given component renders then displays clickable card', () => {
      // When
      const { container } = render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      // Then - Card is now a div with cursor-pointer class, not a button
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('tw:cursor-pointer');
    });

    test('given component renders then displays chevron icon', () => {
      // When
      const { container } = render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      // Then
      const chevronIcon = container.querySelector('svg');
      expect(chevronIcon).toBeInTheDocument();
    });
  });

  describe('Selection state', () => {
    test('given isSelected is false then shows inactive styling', () => {
      // When
      const { container } = render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      // Then - Card uses border-gray-200 when not selected
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('tw:border-gray-200');
    });

    test('given isSelected is true then shows active styling', () => {
      // When
      const { container } = render(
        <DefaultBaselineOption countryId={TEST_COUNTRIES.US} isSelected onClick={mockOnClick} />
      );

      // Then - Card uses border-primary-500 and bg-primary-50 when selected
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('tw:border-primary-500');
      expect(card).toHaveClass('tw:bg-primary-50');
    });
  });

  describe('User interactions', () => {
    test('given card is clicked then onClick callback is invoked', async () => {
      // Given
      const user = userEvent.setup();
      const mockCallback = vi.fn();

      const { container } = render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          isSelected={false}
          onClick={mockCallback}
        />
      );

      const card = container.querySelector('[data-slot="card"]')!;

      // When
      await user.click(card);

      // Then
      expect(mockCallback).toHaveBeenCalledOnce();
    });

    test('given card is clicked multiple times then onClick is called each time', async () => {
      // Given
      const user = userEvent.setup();
      const mockCallback = vi.fn();

      const { container } = render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          isSelected={false}
          onClick={mockCallback}
        />
      );

      const card = container.querySelector('[data-slot="card"]')!;

      // When
      await user.click(card);
      await user.click(card);
      await user.click(card);

      // Then
      expect(mockCallback).toHaveBeenCalledTimes(3);
    });
  });

  describe('Props handling', () => {
    test('given different country IDs then generates correct labels', () => {
      // Test US
      const { rerender } = render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          isSelected={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText(DEFAULT_BASELINE_LABELS.US)).toBeInTheDocument();

      // Test UK
      rerender(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.UK}
          isSelected={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText(DEFAULT_BASELINE_LABELS.UK)).toBeInTheDocument();
    });
  });
});
