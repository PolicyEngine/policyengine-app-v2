import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
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
    expect(screen.getByText('panel body')).not.toBeVisible();
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

    // The spine keeps the panel's name; the body fades out but stays
    // mounted so the fold can animate — hidden, not removed.
    expect(screen.getByRole('button', { name: /open adjust parameters/i })).toBeInTheDocument();
    expect(screen.getByText('panel body')).not.toBeVisible();
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
    expect(screen.getByText('panel body')).not.toBeVisible();
  });

  test('given a folded panel then reopening restores the body', async () => {
    const user = userEvent.setup();
    render(
      <SidePanel title="Draft reform" defaultOpen={false}>
        <p>panel body</p>
      </SidePanel>
    );

    await user.click(screen.getByRole('button', { name: /open draft reform/i }));

    expect(screen.getByText('panel body')).toBeVisible();
  });

  test('given the fold is toggled then focus moves to the other face', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <SidePanel title="Draft reform">
        <p>panel body</p>
      </SidePanel>
    );

    // When — collapse from the keyboard
    const collapse = screen.getByRole('button', { name: /collapse draft reform/i });
    collapse.focus();
    await user.keyboard('{Enter}');

    // Then — the spine's button holds focus, not <body>
    expect(screen.getByRole('button', { name: /open draft reform/i })).toHaveFocus();

    // And back again
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: /collapse draft reform/i })).toHaveFocus();
  });

  test('given storage that throws then the panel still renders with its default fold', () => {
    // Given — a sandboxed embed where any storage access throws
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    // When / Then
    render(
      <SidePanel title="Draft reform" storageKey="draft-test">
        <p>panel body</p>
      </SidePanel>
    );
    expect(screen.getByText('panel body')).toBeVisible();
    getItem.mockRestore();
    setItem.mockRestore();
  });

  test('given meta then the folded spine repeats it', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <SidePanel title="Draft reform" meta="3 provisions">
        <p>panel body</p>
      </SidePanel>
    );

    // When
    await user.click(screen.getByRole('button', { name: /collapse draft reform/i }));

    // Then
    expect(screen.getByRole('button', { name: /open draft reform/i })).toHaveTextContent(
      '3 provisions'
    );
  });
});
