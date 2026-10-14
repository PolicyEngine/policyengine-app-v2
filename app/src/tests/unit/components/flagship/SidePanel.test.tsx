import { render, screen, userEvent } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import SidePanel from '@/components/flagship/SidePanel';
import { mockScreenWidth, SCREEN_WIDTHS } from '@/tests/fixtures/hooks/useMediaQueryMocks';

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

describe('SidePanel on a phone', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockScreenWidth(SCREEN_WIDTHS.PHONE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('given a phone then the folded panel is a bar across the screen', () => {
    // Given / When
    render(
      <SidePanel title="Adjust parameters" meta="2 provisions" defaultOpen={false}>
        <p>panel body</p>
      </SidePanel>
    );

    // Then — a full-width bar that still names the panel and its count
    const bar = screen.getByRole('button', { name: /open adjust parameters/i });
    expect(bar).toHaveStyle({ width: '100%' });
    expect(bar).toHaveTextContent('Adjust parameters · 2 provisions');
  });

  test('given a phone and the bar is tapped then the panel fills the screen', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <SidePanel title="Adjust parameters" defaultOpen={false}>
        <p>panel body</p>
      </SidePanel>
    );

    // When
    await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));

    // Then — a drawer over the whole screen, not a 340px column
    expect(screen.getByText('panel body')).toBeVisible();
    expect(screen.getByLabelText('Adjust parameters')).toHaveStyle({
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
      width: '100%',
    });
  });

  test('given a phone and an open panel then Escape folds it back to the bar', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <SidePanel title="Draft reform">
        <p>panel body</p>
      </SidePanel>
    );

    // When
    await user.keyboard('{Escape}');

    // Then — folded, with focus on the bar that reopens it
    expect(screen.getByText('panel body')).not.toBeVisible();
    expect(screen.getByRole('button', { name: /open draft reform/i })).toHaveFocus();
  });

  test('given a wide screen then Escape leaves the panel open beside the content', async () => {
    // Given — the default: a column beside the content
    mockScreenWidth(SCREEN_WIDTHS.DESKTOP);
    const user = userEvent.setup();
    render(
      <SidePanel title="Draft reform">
        <p>panel body</p>
      </SidePanel>
    );

    // When
    await user.keyboard('{Escape}');

    // Then
    expect(screen.getByText('panel body')).toBeVisible();
    expect(screen.getByLabelText('Draft reform')).toHaveStyle({ position: 'absolute' });
  });
});
