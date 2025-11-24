import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import StreamlitEmbed from '@/components/interactive/StreamlitEmbed';
import {
  MOCK_SESSION_STORAGE_KEY,
  MOCK_STREAMLIT_PROPS,
  MOCK_STREAMLIT_PROPS_WITH_DIMENSIONS,
  TEST_IFRAME_TITLE,
  TEST_STREAMLIT_DIRECT_URL,
} from '@/tests/fixtures/components/interactive/StreamlitEmbedMocks';

describe('StreamlitEmbed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  test('given component renders then iframe is displayed', () => {
    // When
    render(<StreamlitEmbed {...MOCK_STREAMLIT_PROPS} />);

    // Then
    const iframe = screen.getByTitle(TEST_IFRAME_TITLE);
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', MOCK_STREAMLIT_PROPS.embedUrl);
  });

  test('given initial render then alert banner is visible', () => {
    // When
    render(<StreamlitEmbed {...MOCK_STREAMLIT_PROPS} />);

    // Then
    expect(screen.getByText(/if the app is sleeping/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /wake it up/i })
    ).toBeInTheDocument();
  });

  test('given wake up link then opens in new tab with correct URL', () => {
    // When
    render(<StreamlitEmbed {...MOCK_STREAMLIT_PROPS} />);

    // Then
    const wakeUpLink = screen.getByRole('link', { name: /wake it up/i });
    expect(wakeUpLink).toHaveAttribute('href', TEST_STREAMLIT_DIRECT_URL);
    expect(wakeUpLink).toHaveAttribute('target', '_blank');
    expect(wakeUpLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('given user clicks close button then alert banner is hidden', async () => {
    // Given
    const user = userEvent.setup();
    render(<StreamlitEmbed {...MOCK_STREAMLIT_PROPS} />);

    // When
    await user.click(screen.getByRole('button', { name: /close notice/i }));

    // Then
    expect(
      screen.queryByText(/if the app is sleeping/i)
    ).not.toBeInTheDocument();
  });

  test('given user dismisses alert then stores dismissal in session storage', async () => {
    // Given
    const user = userEvent.setup();
    render(<StreamlitEmbed {...MOCK_STREAMLIT_PROPS} />);

    // When
    await user.click(screen.getByRole('button', { name: /close notice/i }));

    // Then
    expect(sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY)).toBe('true');
  });

  test('given previously dismissed notice then alert banner is not shown', () => {
    // Given
    sessionStorage.setItem(MOCK_SESSION_STORAGE_KEY, 'true');

    // When
    render(<StreamlitEmbed {...MOCK_STREAMLIT_PROPS} />);

    // Then
    expect(
      screen.queryByText(/if the app is sleeping/i)
    ).not.toBeInTheDocument();
  });

  test('given custom dimensions then iframe uses specified height and width', () => {
    // When
    render(<StreamlitEmbed {...MOCK_STREAMLIT_PROPS_WITH_DIMENSIONS} />);

    // Then
    const iframe = screen.getByTitle(TEST_IFRAME_TITLE);
    expect(iframe).toHaveStyle({ height: '600px', width: '800px' });
  });

  test('given no custom dimensions then iframe uses default dimensions', () => {
    // When
    render(<StreamlitEmbed {...MOCK_STREAMLIT_PROPS} />);

    // Then
    const iframe = screen.getByTitle(TEST_IFRAME_TITLE);
    expect(iframe).toHaveStyle({ height: '100%', width: '100%' });
  });

  test('given component renders then container is present', () => {
    // When
    render(<StreamlitEmbed {...MOCK_STREAMLIT_PROPS} />);

    // Then
    const iframe = screen.getByTitle(TEST_IFRAME_TITLE);
    expect(iframe.parentElement).toBeInTheDocument();
  });

  test('given alert banner then displays with close button', () => {
    // When
    render(<StreamlitEmbed {...MOCK_STREAMLIT_PROPS} />);

    // Then
    const alertText = screen.getByText(/if the app is sleeping/i);
    expect(alertText).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close notice/i })).toBeInTheDocument();
  });
});
