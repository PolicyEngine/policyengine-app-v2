import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import VariableInfoTip from '@/components/household/VariableInfoTip';

const DESCRIPTION = 'Wages and salaries, including tips and commissions.';

describe('VariableInfoTip', () => {
  test('given no period and no description then no tip shows', () => {
    render(<VariableInfoTip label="Employment income" description="  " />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('given a period then it leads, before the description', async () => {
    const user = userEvent.setup();
    render(
      <VariableInfoTip label="Employment income" period="Per year" description={DESCRIPTION} />
    );

    await user.click(screen.getByRole('button', { name: 'About Employment income' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent(`Per year${DESCRIPTION}`);
  });

  test('given a period and no description then the period shows alone', async () => {
    const user = userEvent.setup();
    render(<VariableInfoTip label="Payroll tax" period="Per year" />);

    await user.click(screen.getByRole('button', { name: 'About Payroll tax' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent(/^Per year$/);
  });

  test('given a click then the description shows, and a second click hides it', async () => {
    const user = userEvent.setup();
    render(<VariableInfoTip label="Employment income" description={DESCRIPTION} />);
    const tip = screen.getByRole('button', { name: 'About Employment income' });

    await user.click(tip);
    expect(screen.getByRole('tooltip')).toHaveTextContent(DESCRIPTION);
    expect(tip).toHaveAttribute('aria-expanded', 'true');

    await user.click(tip);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('given the mouse over it then the description shows, and leaving hides it', async () => {
    const user = userEvent.setup();
    render(<VariableInfoTip label="Employment income" description={DESCRIPTION} />);
    const tip = screen.getByRole('button', { name: 'About Employment income' });

    await user.hover(tip);
    expect(screen.getByRole('tooltip')).toHaveTextContent(DESCRIPTION);

    await user.unhover(tip);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('given the keyboard then Enter shows the description and Escape hides it', async () => {
    const user = userEvent.setup();
    render(<VariableInfoTip label="Employment income" description={DESCRIPTION} />);

    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('tooltip')).toHaveTextContent(DESCRIPTION);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'About Employment income' })).toHaveFocus();
  });
});
