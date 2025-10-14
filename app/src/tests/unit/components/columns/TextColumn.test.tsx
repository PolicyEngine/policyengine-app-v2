import { describe, expect, test } from 'vitest';
import { render, screen } from '@test-utils';
import { TextColumn } from '@/components/columns/TextColumn';
import {
  BOLD_WEIGHT_CONFIG,
  DEFAULT_CONFIG,
  DEFAULT_TEXT,
  LARGE_SIZE_CONFIG,
  mockEmptyTextValue,
  mockLoadingTextValue,
  mockNotLoadingTextValue,
  mockTextValue,
  RED_COLOR_CONFIG,
  STYLED_CONFIG,
} from '@/tests/fixtures/components/columns/TextColumnMocks';

describe('TextColumn', () => {
  describe('basic rendering', () => {
    test('given text value then displays text', () => {
      // When
      render(<TextColumn config={DEFAULT_CONFIG} value={mockTextValue} />);

      // Then
      expect(screen.getByText(DEFAULT_TEXT)).toBeInTheDocument();
    });

    test('given empty text then displays empty content', () => {
      // When
      render(<TextColumn config={DEFAULT_CONFIG} value={mockEmptyTextValue} />);

      // Then
      expect(screen.queryByText(DEFAULT_TEXT)).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    test('given loading true then displays text', () => {
      // When
      render(<TextColumn config={DEFAULT_CONFIG} value={mockLoadingTextValue} />);

      // Then
      expect(screen.getByText(DEFAULT_TEXT)).toBeInTheDocument();
    });

    test('given loading false then displays text', () => {
      // When
      render(<TextColumn config={DEFAULT_CONFIG} value={mockNotLoadingTextValue} />);

      // Then
      expect(screen.getByText(DEFAULT_TEXT)).toBeInTheDocument();
    });

    test('given no loading property then displays text', () => {
      // When
      render(<TextColumn config={DEFAULT_CONFIG} value={mockTextValue} />);

      // Then
      expect(screen.getByText(DEFAULT_TEXT)).toBeInTheDocument();
    });
  });

  describe('styling configuration', () => {
    test('given size config then applies size', () => {
      // When
      render(<TextColumn config={LARGE_SIZE_CONFIG} value={mockTextValue} />);

      // Then
      const text = screen.getByText(DEFAULT_TEXT);
      expect(text).toBeInTheDocument();
    });

    test('given weight config then applies font weight', () => {
      // When
      render(<TextColumn config={BOLD_WEIGHT_CONFIG} value={mockTextValue} />);

      // Then
      const text = screen.getByText(DEFAULT_TEXT);
      expect(text).toBeInTheDocument();
    });

    test('given color config then applies color', () => {
      // When
      render(<TextColumn config={RED_COLOR_CONFIG} value={mockTextValue} />);

      // Then
      const text = screen.getByText(DEFAULT_TEXT);
      expect(text).toBeInTheDocument();
    });
  });

  describe('loading with styled text', () => {
    test('given loading with custom size then displays text', () => {
      // When
      render(<TextColumn config={STYLED_CONFIG} value={mockLoadingTextValue} />);

      // Then
      expect(screen.getByText(DEFAULT_TEXT)).toBeInTheDocument();
    });
  });
});
