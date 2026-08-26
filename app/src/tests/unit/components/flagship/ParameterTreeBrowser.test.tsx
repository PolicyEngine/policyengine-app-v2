import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ParameterTreeBrowser from '@/components/flagship/ParameterTreeBrowser';
import { ParameterTreeNode } from '@/types/metadata';

const FIXTURE_TREE: ParameterTreeNode = {
  name: 'gov',
  label: 'Gov',
  index: 0,
  children: [
    {
      name: 'gov.irs',
      label: 'IRS',
      index: 0,
      children: [
        {
          name: 'gov.irs.credits.ctc.amount',
          label: 'Child tax credit amount',
          index: 0,
          type: 'parameter',
        },
        {
          name: 'gov.irs.internal.abolition',
          label: 'Internal switch',
          index: 1,
          type: 'parameter',
        },
      ],
    },
  ],
};

const ADDABLE = new Set(['gov.irs.credits.ctc.amount']);

describe('ParameterTreeBrowser', () => {
  test('given a collapsed tree then children are hidden until the folder expands', async () => {
    const user = userEvent.setup();
    render(
      <ParameterTreeBrowser
        tree={FIXTURE_TREE}
        onSelectLeaf={vi.fn()}
        addablePaths={ADDABLE}
        draftPaths={new Set()}
      />
    );

    expect(screen.queryByText('Child tax credit amount')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /irs/i }));

    expect(screen.getByText('Child tax credit amount')).toBeInTheDocument();
  });

  test('given an addable leaf is clicked then onSelectLeaf receives its path', async () => {
    const user = userEvent.setup();
    const onSelectLeaf = vi.fn();
    render(
      <ParameterTreeBrowser
        tree={FIXTURE_TREE}
        onSelectLeaf={onSelectLeaf}
        addablePaths={ADDABLE}
        draftPaths={new Set()}
      />
    );

    await user.click(screen.getByRole('button', { name: /irs/i }));
    await user.click(screen.getByRole('button', { name: /child tax credit amount/i }));

    expect(onSelectLeaf).toHaveBeenCalledWith('gov.irs.credits.ctc.amount');
  });

  test('given a non-addable leaf then it is disabled and does not fire', async () => {
    const user = userEvent.setup();
    const onSelectLeaf = vi.fn();
    render(
      <ParameterTreeBrowser
        tree={FIXTURE_TREE}
        onSelectLeaf={onSelectLeaf}
        addablePaths={ADDABLE}
        draftPaths={new Set()}
      />
    );

    await user.click(screen.getByRole('button', { name: /irs/i }));
    const leaf = screen.getByRole('button', { name: /internal switch/i });

    expect(leaf).toBeDisabled();
    await user.click(leaf);
    expect(onSelectLeaf).not.toHaveBeenCalled();
  });

  test('given a leaf already in the draft then it shows the in-draft tag and is disabled', async () => {
    const user = userEvent.setup();
    render(
      <ParameterTreeBrowser
        tree={FIXTURE_TREE}
        onSelectLeaf={vi.fn()}
        addablePaths={ADDABLE}
        draftPaths={new Set(['gov.irs.credits.ctc.amount'])}
      />
    );

    await user.click(screen.getByRole('button', { name: /irs/i }));

    expect(screen.getByText('In draft')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /child tax credit amount/i })).toBeDisabled();
  });

  test('given no tree yet then a loading note shows', () => {
    render(
      <ParameterTreeBrowser
        tree={null}
        onSelectLeaf={vi.fn()}
        addablePaths={new Set()}
        draftPaths={new Set()}
      />
    );

    expect(screen.getByText(/loading the policy tree/i)).toBeInTheDocument();
  });

  test('given expandTo then the folder and its ancestors open to reveal the parameter', () => {
    // Given / When
    render(
      <ParameterTreeBrowser
        tree={FIXTURE_TREE}
        addablePaths={ADDABLE}
        draftPaths={new Set()}
        onSelectLeaf={vi.fn()}
        expandTo="gov.irs"
      />
    );

    // Then — no click needed; the ancestor chain expanded on its own
    expect(screen.getByText('Child tax credit amount')).toBeInTheDocument();
  });

  test('given no expandTo then nothing is expanded', () => {
    // Given / When
    render(
      <ParameterTreeBrowser
        tree={FIXTURE_TREE}
        addablePaths={ADDABLE}
        draftPaths={new Set()}
        onSelectLeaf={vi.fn()}
      />
    );

    // Then
    expect(screen.queryByText('Child tax credit amount')).not.toBeInTheDocument();
  });
});
