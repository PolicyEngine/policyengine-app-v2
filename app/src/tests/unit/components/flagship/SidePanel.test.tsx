import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test } from 'vitest';
import SidePanel from '@/components/flagship/SidePanel';

describe('SidePanel', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('given a storageKey then the fold survives a remount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <SidePanel title="Draft reform" storageKey="draft-test">
        <p>panel body</p>
      </SidePanel>
    );
    await user.click(screen.getByRole('button', { name: /collapse draft reform/i }));
    unmount();

    // Remount, as a page navigation does — the fold must hold.
    render(
      <SidePanel title="Draft reform" storageKey="draft-test">
        <p>panel body</p>
      </SidePanel>
    );

    expect(screen.getByRole('button', { name: /open draft reform/i })).toBeInTheDocument();
    expect(screen.queryByText('panel body')).not.toBeInTheDocument();
  });

  test('given the shell slot exists then the panel renders into it', () => {
    const slot = document.createElement('div');
    slot.id = 'flagship-side-panel-slot';
    document.body.appendChild(slot);
    try {
      render(
        <SidePanel title="Adjust parameters">
          <p>panel body</p>
        </SidePanel>
      );

      expect(slot.textContent).toContain('panel body');
    } finally {
      slot.remove();
    }
  });

  test('given an open panel then its body and header meta show', () => {
    render(
      <SidePanel title="Adjust parameters" meta="2 provisions">
        <p>panel body</p>
      </SidePanel>
    );

    expect(screen.getByText('panel body')).toBeInTheDocument();
    expect(screen.getByText('2 provisions')).toBeInTheDocument();
  });

  test('given the header is clicked then the panel folds to a titled spine', async () => {
    const user = userEvent.setup();
    render(
      <SidePanel title="Adjust parameters">
        <p>panel body</p>
      </SidePanel>
    );

    await user.click(screen.getByRole('button', { name: /collapse adjust parameters/i }));

    // The spine keeps the panel's name and its place in the layout.
    expect(screen.getByRole('button', { name: /open adjust parameters/i })).toBeInTheDocument();
    expect(screen.queryByText('panel body')).not.toBeInTheDocument();
  });

  test('given defaultOpen false then the panel starts folded', () => {
    render(
      <SidePanel title="Adjust parameters" defaultOpen={false}>
        <p>panel body</p>
      </SidePanel>
    );

    expect(screen.getByRole('button', { name: /open adjust parameters/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByText('panel body')).not.toBeInTheDocument();
  });

  test('given a folded panel then reopening restores the body', async () => {
    const user = userEvent.setup();
    render(
      <SidePanel title="Draft reform" defaultOpen={false}>
        <p>panel body</p>
      </SidePanel>
    );

    await user.click(screen.getByRole('button', { name: /open draft reform/i }));

    expect(screen.getByText('panel body')).toBeInTheDocument();
  });
});
