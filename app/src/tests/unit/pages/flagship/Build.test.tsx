import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import BuildPage from '@/pages/flagship/Build.page';

describe('BuildPage', () => {
  test('given the default view then search leads and the tree is out of the way', () => {
    render(<BuildPage />);

    expect(screen.getByRole('button', { name: /or browse the policy tree/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByText(/loading the policy tree/i)).not.toBeInTheDocument();
  });

  test('given the toggle is clicked then the policy tree opens', async () => {
    const user = userEvent.setup();
    render(<BuildPage />);

    await user.click(screen.getByRole('button', { name: /or browse the policy tree/i }));

    expect(screen.getByText(/loading the policy tree/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hide the policy tree/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  test('given the tree is open then clicking again closes it', async () => {
    const user = userEvent.setup();
    render(<BuildPage />);

    await user.click(screen.getByRole('button', { name: /or browse the policy tree/i }));
    await user.click(screen.getByRole('button', { name: /hide the policy tree/i }));

    expect(screen.queryByText(/loading the policy tree/i)).not.toBeInTheDocument();
  });
});
