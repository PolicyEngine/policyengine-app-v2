import { useState } from 'react';
import { act, render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ParameterSidebar } from '@/pages/reportBuilder/modals/policyCreation/ParameterSidebar';
import {
  PARAMETER_SIDEBAR_TREE,
  PARAMETER_TREE_LABELS,
} from '@/tests/fixtures/pages/reportBuilder/modals/policyCreation/ParameterSidebarMocks';

const TREE_REGION_LABEL = 'Policy parameter tree';
const CHILD_GROUP_LABEL = `${PARAMETER_TREE_LABELS.FOLDER} parameters`;

type ElementBounds = {
  top: number;
  bottom: number;
};

function toDomRect({ top, bottom }: ElementBounds): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    bottom,
    left: 0,
    right: 280,
    width: 280,
    height: bottom - top,
    toJSON: () => ({}),
  };
}

function mockTreeBounds({
  tree,
  folder,
  children,
}: {
  tree: ElementBounds;
  folder: ElementBounds;
  children: ElementBounds;
}) {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement
  ) {
    if (this.getAttribute('aria-label') === TREE_REGION_LABEL) {
      return toDomRect(tree);
    }
    if (this.getAttribute('aria-label') === CHILD_GROUP_LABEL) {
      return toDomRect(children);
    }
    if (this instanceof HTMLButtonElement && this.textContent === PARAMETER_TREE_LABELS.FOLDER) {
      return toDomRect(folder);
    }
    return toDomRect({ top: 0, bottom: 0 });
  });
}

function ParameterSidebarHarness({ onMenuItemClick = vi.fn() }) {
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set());

  const handleMenuItemClick = (name: string) => {
    onMenuItemClick(name);
    setExpandedMenuItems((previous) => {
      const next = new Set(previous);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div>
      <ParameterSidebar
        parameterTree={PARAMETER_SIDEBAR_TREE}
        metadataLoading={false}
        selectedParam={null}
        expandedMenuItems={expandedMenuItems}
        parameterSearch=""
        searchableParameters={[]}
        onSearchChange={vi.fn()}
        onSearchSelect={vi.fn()}
        onMenuItemClick={handleMenuItemClick}
      />
      <main aria-label="Policy editor content" />
    </div>
  );
}

describe('ParameterSidebar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('given a folder near the lower edge when expanded then its children remain visible', async () => {
    const user = userEvent.setup();
    render(<ParameterSidebarHarness />);
    const treeRegion = screen.getByRole('region', { name: TREE_REGION_LABEL });
    const mainContent = screen.getByRole('main', { name: 'Policy editor content' });
    treeRegion.scrollTop = 40;
    mainContent.scrollTop = 75;
    mockTreeBounds({
      tree: { top: 0, bottom: 200 },
      folder: { top: 160, bottom: 184 },
      children: { top: 184, bottom: 384 },
    });

    await user.click(screen.getByRole('button', { name: PARAMETER_TREE_LABELS.FOLDER }));

    expect(treeRegion.scrollTop).toBe(124);
    expect(mainContent.scrollTop).toBe(75);
  });

  test('given a large folder near the upper edge when expanded then the folder stays visible', async () => {
    const user = userEvent.setup();
    render(<ParameterSidebarHarness />);
    const treeRegion = screen.getByRole('region', { name: TREE_REGION_LABEL });
    treeRegion.scrollTop = 40;
    mockTreeBounds({
      tree: { top: 0, bottom: 200 },
      folder: { top: 8, bottom: 32 },
      children: { top: 32, bottom: 632 },
    });

    await user.click(screen.getByRole('button', { name: PARAMETER_TREE_LABELS.FOLDER }));

    expect(treeRegion.scrollTop).toBe(40);
  });

  test('given an expanded folder and children already fit then collapsing and expanding do not scroll', async () => {
    const user = userEvent.setup();
    render(<ParameterSidebarHarness />);
    const treeRegion = screen.getByRole('region', { name: TREE_REGION_LABEL });
    treeRegion.scrollTop = 40;
    mockTreeBounds({
      tree: { top: 0, bottom: 200 },
      folder: { top: 48, bottom: 72 },
      children: { top: 72, bottom: 120 },
    });
    const folderButton = screen.getByRole('button', { name: PARAMETER_TREE_LABELS.FOLDER });

    await user.click(folderButton);
    await user.click(folderButton);

    expect(treeRegion.scrollTop).toBe(40);
  });

  test('given keyboard focus on a folder when expanded then focus and scroll remain local', async () => {
    const user = userEvent.setup();
    const onMenuItemClick = vi.fn();
    render(<ParameterSidebarHarness onMenuItemClick={onMenuItemClick} />);
    const treeRegion = screen.getByRole('region', { name: TREE_REGION_LABEL });
    const folderButton = screen.getByRole('button', { name: PARAMETER_TREE_LABELS.FOLDER });
    treeRegion.scrollTop = 40;
    mockTreeBounds({
      tree: { top: 0, bottom: 200 },
      folder: { top: 160, bottom: 184 },
      children: { top: 184, bottom: 384 },
    });

    act(() => folderButton.focus());
    await user.keyboard('{Enter}');

    await waitFor(() => expect(folderButton).toHaveAttribute('aria-expanded', 'true'));
    expect(folderButton).toHaveFocus();
    expect(onMenuItemClick).toHaveBeenCalledWith(PARAMETER_SIDEBAR_TREE.children![0].name);
    expect(treeRegion.scrollTop).toBe(124);
  });
});
