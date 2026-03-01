import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { ReportSidebar } from '@/pages/report-output/ReportSidebar';
import {
  ACTIVE_LEAF_VIEW,
  TEST_SIDEBAR_TREE,
} from '@/tests/fixtures/pages/report-output/ReportSidebarMocks';

describe('ReportSidebar', () => {
  test('given tree then renders all top-level labels', () => {
    // When
    render(
      <ReportSidebar tree={TEST_SIDEBAR_TREE} activeView={ACTIVE_LEAF_VIEW} onNavigate={vi.fn()} />
    );

    // Then
    expect(screen.getByText('Budgetary impact')).toBeInTheDocument();
    expect(screen.getByText('Distributional impact')).toBeInTheDocument();
    expect(screen.getByText('Disabled section')).toBeInTheDocument();
  });

  test('given leaf node clicked then onNavigate is called', async () => {
    // Given
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    render(
      <ReportSidebar
        tree={TEST_SIDEBAR_TREE}
        activeView={ACTIVE_LEAF_VIEW}
        onNavigate={handleNavigate}
      />
    );

    // When
    await user.click(screen.getByText('Distributional impact'));

    // Then
    expect(handleNavigate).toHaveBeenCalledWith('distributionalImpact');
  });

  test('given active child view then parent is auto-expanded with children visible', () => {
    // Given — activeView is a child of 'budgetaryImpact', so parent auto-expands
    render(
      <ReportSidebar tree={TEST_SIDEBAR_TREE} activeView={ACTIVE_LEAF_VIEW} onNavigate={vi.fn()} />
    );

    // Then — children are visible because parent auto-expanded
    expect(screen.getByText('Overall')).toBeInTheDocument();
    expect(screen.getByText('By program')).toBeInTheDocument();
  });

  test('given expanded parent clicked then children are collapsed', async () => {
    // Given — parent is auto-expanded due to active child
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    render(
      <ReportSidebar
        tree={TEST_SIDEBAR_TREE}
        activeView={ACTIVE_LEAF_VIEW}
        onNavigate={handleNavigate}
      />
    );
    expect(screen.getByText('Overall')).toBeInTheDocument();

    // When — click parent to collapse
    await user.click(screen.getByText('Budgetary impact'));

    // Then — children hidden, onNavigate NOT called for parent
    expect(handleNavigate).not.toHaveBeenCalled();
    expect(screen.queryByText('Overall')).not.toBeInTheDocument();
  });

  test('given sidebar renders then it is hidden on mobile via responsive class', () => {
    // When
    const { container } = render(
      <ReportSidebar tree={TEST_SIDEBAR_TREE} activeView={ACTIVE_LEAF_VIEW} onNavigate={vi.fn()} />
    );

    // Then — Tailwind responsive classes hide on mobile: tw:hidden tw:sm:block
    // Find the sidebar element by its style (has width: 250px)
    const sidebarEl = container.querySelector('[style*="width"]') as HTMLElement;
    expect(sidebarEl).toBeInTheDocument();
    expect(sidebarEl.className).toContain('hidden');
  });
});
