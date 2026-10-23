import { useState } from 'react';
import { render, screen, userEvent, within } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import PolicyBrowser from '@/components/flagship/policyBrowser/PolicyBrowser';
import { DRAFTABLE, POLICY_TREE } from '@/tests/fixtures/components/flagship/policyTreeFixtures';

function Harness({
  onAdd = vi.fn(),
  draftPaths = new Set<string>(),
  initialPath = null,
}: {
  onAdd?: (path: string) => void;
  draftPaths?: Set<string>;
  initialPath?: string | null;
}) {
  const [path, setPath] = useState<string | null>(initialPath);
  return (
    <PolicyBrowser
      tree={POLICY_TREE}
      addablePaths={DRAFTABLE}
      draftPaths={draftPaths}
      path={path}
      onNavigate={setPath}
      onAdd={onAdd}
      valueFor={(path) => (path === 'gov.irs.credits.ctc_amount' ? '$2,200' : null)}
    />
  );
}

const location = () => screen.getByRole('navigation', { name: /policy tree location/i });
const folderTitle = (name: string) => screen.getByRole('heading', { level: 3, name });

describe('PolicyBrowser', () => {
  test('given the top level then programs show as cards with their counts', () => {
    render(<Harness />);

    const irs = screen.getByRole('button', { name: 'Open Internal Revenue Service (IRS)' });
    expect(irs).toHaveTextContent('3 parameters');
    expect(screen.queryByRole('button', { name: /bureau of labor/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /policy tree location/i })).toBeNull();
  });

  test('given a program is opened then its folder shows as a titled list', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Open Internal Revenue Service (IRS)' }));
    await user.click(screen.getByRole('button', { name: 'Open Credits' }));

    expect(folderTitle('Credits')).toBeInTheDocument();
    expect(
      within(location()).getByRole('button', { name: 'Internal Revenue Service (IRS)' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open EITC maximum' })).toHaveTextContent('2');
  });

  test('given a parameter row then it shows its value and keeps the description as a tooltip', () => {
    render(<Harness initialPath="gov.irs.credits" />);

    const row = screen.getByRole('button', { name: 'Add Child tax credit amount to your draft' });
    expect(row).toHaveTextContent('$2,200');
    expect(row).not.toHaveTextContent('Maximum credit per qualifying child.');
    expect(row).toHaveAttribute('title', 'Maximum credit per qualifying child.');
  });

  test('given subfolders and parameters then subfolders list first', () => {
    render(<Harness initialPath="gov.irs.credits" />);

    const rows = screen
      .getAllByRole('button')
      .filter((button) => /^(Open|Add) /.test(button.getAttribute('aria-label') ?? ''));
    expect(rows.map((row) => row.getAttribute('aria-label'))).toEqual([
      'Open EITC maximum',
      'Add Child tax credit amount to your draft',
    ]);
  });

  test('given a breadcrumb ancestor is clicked then that folder opens', async () => {
    const user = userEvent.setup();
    render(<Harness initialPath="gov.irs.credits.eitc.max" />);

    await user.click(
      within(location()).getByRole('button', { name: 'Internal Revenue Service (IRS)' })
    );

    expect(folderTitle('Internal Revenue Service (IRS)')).toBeInTheDocument();
  });

  test('given all programs in the breadcrumb is clicked then the program cards return', async () => {
    const user = userEvent.setup();
    render(<Harness initialPath="gov.irs.credits" />);

    await user.click(within(location()).getByRole('button', { name: 'All programs' }));

    expect(
      screen.getByRole('button', { name: 'Open Internal Revenue Service (IRS)' })
    ).toBeInTheDocument();
  });

  test('given a parameter row is clicked then it is added by path', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<Harness onAdd={onAdd} initialPath="gov.irs.credits" />);

    await user.click(screen.getByRole('button', { name: /add child tax credit amount/i }));

    expect(onAdd).toHaveBeenCalledWith('gov.irs.credits.ctc_amount');
  });

  test('given a parameter already in the draft then its row reopens it instead of adding', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <Harness
        onAdd={onAdd}
        initialPath="gov.irs.credits"
        draftPaths={new Set(['gov.irs.credits.ctc_amount'])}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /edit child tax credit amount, in your draft/i })
    );

    expect(onAdd).toHaveBeenCalledWith('gov.irs.credits.ctc_amount');
  });

  test('given a path the tree does not hold then the top level shows', () => {
    render(<Harness initialPath="gov.nowhere" />);

    expect(
      screen.getByRole('button', { name: 'Open Internal Revenue Service (IRS)' })
    ).toBeInTheDocument();
  });

  test('given no tree yet then a loading state stands in', () => {
    render(
      <PolicyBrowser
        tree={null}
        addablePaths={DRAFTABLE}
        draftPaths={new Set()}
        path={null}
        onNavigate={vi.fn()}
        onAdd={vi.fn()}
        valueFor={() => null}
      />
    );

    expect(screen.getByText(/loading the policy tree/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /browse the policy tree/i })).toBeInTheDocument();
  });
});
