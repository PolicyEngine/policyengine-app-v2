import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import ActionButton from '@/components/shared/static/ActionButton';
import {
  MOCK_ACTION_BUTTON_PROPS,
  MOCK_ACTION_BUTTON_PROPS_MULTILINE,
  MOCK_ACTION_BUTTON_PROPS_WITH_CAPTION,
  TEST_BUTTON_HREF,
  TEST_BUTTON_TEXT,
  TEST_CAPTION,
} from '@/tests/fixtures/components/shared/static/ActionButtonMocks';

describe('ActionButton', () => {
  test('given button text then link with text is rendered', () => {
    // Given / When
    render(<ActionButton {...MOCK_ACTION_BUTTON_PROPS} />);

    // Then
    const link = screen.getByRole('link', { name: TEST_BUTTON_TEXT });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', TEST_BUTTON_HREF);
  });

  test('given href then link opens in new tab', () => {
    // Given / When
    render(<ActionButton {...MOCK_ACTION_BUTTON_PROPS} />);

    // Then
    const link = screen.getByRole('link', { name: TEST_BUTTON_TEXT });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('given caption then caption text is rendered', () => {
    // Given / When
    render(<ActionButton {...MOCK_ACTION_BUTTON_PROPS_WITH_CAPTION} />);

    // Then
    expect(screen.getByText(TEST_CAPTION)).toBeInTheDocument();
  });

  test('given no caption then caption is not rendered', () => {
    // Given / When
    render(<ActionButton {...MOCK_ACTION_BUTTON_PROPS} />);

    // Then
    expect(screen.queryByText(TEST_CAPTION)).not.toBeInTheDocument();
  });

  test('given multiline text then text is rendered', () => {
    // Given / When
    render(<ActionButton {...MOCK_ACTION_BUTTON_PROPS_MULTILINE} />);

    // Then
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  test('given primary variant then button is rendered', () => {
    // Given / When
    render(<ActionButton {...MOCK_ACTION_BUTTON_PROPS} variant="primary" />);

    // Then
    expect(screen.getByRole('link', { name: TEST_BUTTON_TEXT })).toBeInTheDocument();
  });

  test('given secondary variant then button is rendered', () => {
    // Given / When
    render(<ActionButton {...MOCK_ACTION_BUTTON_PROPS} variant="secondary" />);

    // Then
    expect(screen.getByRole('link', { name: TEST_BUTTON_TEXT })).toBeInTheDocument();
  });

  test('given inverted variant then button is rendered', () => {
    // Given / When
    render(<ActionButton {...MOCK_ACTION_BUTTON_PROPS} variant="inverted" />);

    // Then
    expect(screen.getByRole('link', { name: TEST_BUTTON_TEXT })).toBeInTheDocument();
  });
});
