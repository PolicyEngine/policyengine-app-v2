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

    test('given component renders then displays clickable button', () => {
      // When
      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      // Then - Component renders as a button element
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('tw:cursor-pointer');
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
      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      // Then - Button uses border-border-light when not selected
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('tw:border-border-light');
    });

    test('given isSelected is true then shows active styling', () => {
      // When
      render(
        <DefaultBaselineOption countryId={TEST_COUNTRIES.US} isSelected onClick={mockOnClick} />
      );

      // Then - Button uses border-primary-500 and bg-secondary-100 when selected
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('tw:border-primary-500');
      expect(button).toHaveClass('tw:bg-secondary-100');
    });
  });

  describe('User interactions', () => {
    test('given button is clicked then onClick callback is invoked', async () => {
      // Given
      const user = userEvent.setup();
      const mockCallback = vi.fn();

      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          isSelected={false}
          onClick={mockCallback}
        />
      );

      // When
      await user.click(screen.getByRole('button'));

      // Then
      expect(mockCallback).toHaveBeenCalledOnce();
    });

    test('given button is clicked multiple times then onClick is called each time', async () => {
      // Given
      const user = userEvent.setup();
      const mockCallback = vi.fn();

      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          isSelected={false}
          onClick={mockCallback}
        />
      );

      const button = screen.getByRole('button');

      // When
      await user.click(button);
      await user.click(button);
      await user.click(button);

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
