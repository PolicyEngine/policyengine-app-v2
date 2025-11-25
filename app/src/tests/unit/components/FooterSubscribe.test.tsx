import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FooterSubscribe from '@/components/FooterSubscribe';
import { submitToMailchimp } from '@/utils/mailchimpSubscription';

// Mock the mailchimp subscription utility
vi.mock('@/utils/mailchimpSubscription', () => ({
  submitToMailchimp: vi.fn(),
}));

describe('FooterSubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given component renders then displays title and input', () => {
    // When
    render(<FooterSubscribe />);

    // Then
    expect(screen.getByText('Subscribe to PolicyEngine')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  test('given user enters email and clicks subscribe then submits to mailchimp', async () => {
    // Given
    const user = userEvent.setup();
    vi.mocked(submitToMailchimp).mockResolvedValue({
      isSuccessful: true,
      message: 'Thank you for subscribing!',
    });

    render(<FooterSubscribe />);

    // When
    await user.type(screen.getByPlaceholderText('Enter your email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /subscribe/i }));

    // Then
    expect(submitToMailchimp).toHaveBeenCalledWith('test@example.com');
  });

  test('given successful subscription then displays success message', async () => {
    // Given
    const user = userEvent.setup();
    vi.mocked(submitToMailchimp).mockResolvedValue({
      isSuccessful: true,
      message: 'Thank you for subscribing!',
    });

    render(<FooterSubscribe />);

    // When
    await user.type(screen.getByPlaceholderText('Enter your email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /subscribe/i }));

    // Then
    expect(await screen.findByText('Thank you for subscribing!')).toBeInTheDocument();
  });

  test('given failed subscription then displays error message', async () => {
    // Given
    const user = userEvent.setup();
    vi.mocked(submitToMailchimp).mockResolvedValue({
      isSuccessful: false,
      message: 'This email is already subscribed.',
    });

    render(<FooterSubscribe />);

    // When
    await user.type(screen.getByPlaceholderText('Enter your email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /subscribe/i }));

    // Then
    expect(await screen.findByText('This email is already subscribed.')).toBeInTheDocument();
  });

  test('given network error then displays error message', async () => {
    // Given
    const user = userEvent.setup();
    vi.mocked(submitToMailchimp).mockRejectedValue(
      new Error('There was an issue processing your subscription; please try again later.')
    );

    render(<FooterSubscribe />);

    // When
    await user.type(screen.getByPlaceholderText('Enter your email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /subscribe/i }));

    // Then
    expect(
      await screen.findByText(
        'There was an issue processing your subscription; please try again later.'
      )
    ).toBeInTheDocument();
  });

  test('given empty email then displays validation error', async () => {
    // Given
    const user = userEvent.setup();
    render(<FooterSubscribe />);

    // When
    await user.click(screen.getByRole('button', { name: /subscribe/i }));

    // Then
    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(submitToMailchimp).not.toHaveBeenCalled();
  });

  test('given successful subscription then clears email input', async () => {
    // Given
    const user = userEvent.setup();
    vi.mocked(submitToMailchimp).mockResolvedValue({
      isSuccessful: true,
      message: 'Thank you for subscribing!',
    });

    render(<FooterSubscribe />);
    const input = screen.getByPlaceholderText('Enter your email address') as HTMLInputElement;

    // When
    await user.type(input, 'test@example.com');
    await user.click(screen.getByRole('button', { name: /subscribe/i }));

    // Then
    await screen.findByText('Thank you for subscribing!');
    expect(input.value).toBe('');
  });

  test('given loading state then disables input and button', async () => {
    // Given
    const user = userEvent.setup();
    vi.mocked(submitToMailchimp).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<FooterSubscribe />);

    // When
    await user.type(screen.getByPlaceholderText('Enter your email address'), 'test@example.com');
    const button = screen.getByRole('button', { name: /subscribe/i });
    const input = screen.getByPlaceholderText('Enter your email address');

    await user.click(button);

    // Then
    expect(button).toBeDisabled();
    expect(input).toBeDisabled();
  });
});
