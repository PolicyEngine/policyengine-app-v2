import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import AskPage from '@/pages/flagship/Ask.page';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ countryId: 'us' }),
  };
});

describe('AskPage', () => {
  test('given an empty input then the ask button is disabled', () => {
    render(<AskPage />);

    expect(screen.getByRole('button', { name: /ask/i })).toBeDisabled();
  });

  test('given user clicks an example then it fills the input', async () => {
    // Given
    const user = userEvent.setup();
    render(<AskPage />);

    // When
    await user.click(
      screen.getByRole('button', { name: /what if the child tax credit rose to \$3,600\?/i })
    );

    // Then
    expect(screen.getByRole('textbox', { name: /policy question/i })).toHaveValue(
      'What if the child tax credit rose to $3,600?'
    );
  });

  test('given a question is submitted then it routes to the build flow', async () => {
    // Given
    const user = userEvent.setup();
    render(<AskPage />);
    await user.type(screen.getByRole('textbox', { name: /policy question/i }), 'double the CTC');

    // When
    await user.click(screen.getByRole('button', { name: /ask/i }));

    // Then
    expect(mockNavigate).toHaveBeenCalledWith('/us/build');
  });
});
