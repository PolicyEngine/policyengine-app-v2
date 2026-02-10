/**
 * Unit tests for LazyNestedMenu component
 *
 * Tests the lazy-loading nested menu that fetches children on-demand.
 */
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import LazyNestedMenu from '@/components/common/LazyNestedMenu';
import {
  createMockGetChildren,
  createMockOnParameterClick,
  MOCK_BENEFIT_CHILDREN,
  MOCK_EMPTY_NODES,
  MOCK_LEAF_NODES,
  MOCK_ROOT_NODES,
  MOCK_SINGLE_BRANCH_NODE,
  MOCK_SINGLE_LEAF_NODE,
  MOCK_TAX_CHILDREN,
  TEST_NODE_LABELS,
  TEST_NODE_NAMES,
} from '@/tests/fixtures/components/LazyNestedMenuMocks';

describe('LazyNestedMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('given root nodes then renders all node labels', () => {
      // Given
      const getChildren = createMockGetChildren();

      // When
      render(<LazyNestedMenu nodes={MOCK_ROOT_NODES} getChildren={getChildren} />);

      // Then
      expect(screen.getByText(TEST_NODE_LABELS.TAX)).toBeInTheDocument();
      expect(screen.getByText(TEST_NODE_LABELS.BENEFIT)).toBeInTheDocument();
    });

    test('given empty nodes then renders no menu items', () => {
      // Given
      const getChildren = createMockGetChildren();

      // When
      render(<LazyNestedMenu nodes={MOCK_EMPTY_NODES} getChildren={getChildren} />);

      // Then - no NavLink items should be rendered
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('given leaf nodes then renders as clickable items', () => {
      // Given
      const getChildren = createMockGetChildren();

      // When
      render(<LazyNestedMenu nodes={MOCK_LEAF_NODES} getChildren={getChildren} />);

      // Then
      expect(screen.getByText('Parameter 1')).toBeInTheDocument();
      expect(screen.getByText('Parameter 2')).toBeInTheDocument();
    });
  });

  describe('expanding nodes', () => {
    test('given click on branch node then loads and displays children', async () => {
      // Given
      const user = userEvent.setup();
      const getChildren = createMockGetChildren();
      render(<LazyNestedMenu nodes={MOCK_ROOT_NODES} getChildren={getChildren} />);

      // When
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX));

      // Then
      expect(getChildren).toHaveBeenCalledWith(TEST_NODE_NAMES.TAX);
      expect(screen.getByText(TEST_NODE_LABELS.INCOME_TAX)).toBeInTheDocument();
      expect(screen.getByText(TEST_NODE_LABELS.CAPITAL_TAX)).toBeInTheDocument();
      expect(screen.getByText(TEST_NODE_LABELS.TAX_RATE)).toBeInTheDocument();
    });

    test('given click on expanded node then collapses and hides children', async () => {
      // Given
      const user = userEvent.setup();
      const getChildren = createMockGetChildren();
      render(<LazyNestedMenu nodes={MOCK_ROOT_NODES} getChildren={getChildren} />);

      // When - expand then collapse
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX));
      expect(screen.getByText(TEST_NODE_LABELS.INCOME_TAX)).toBeInTheDocument();
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX));

      // Then - children should be hidden
      expect(screen.queryByText(TEST_NODE_LABELS.INCOME_TAX)).not.toBeInTheDocument();
    });

    test('given multiple branch nodes then can expand independently', async () => {
      // Given
      const user = userEvent.setup();
      const getChildren = createMockGetChildren();
      render(<LazyNestedMenu nodes={MOCK_ROOT_NODES} getChildren={getChildren} />);

      // When - expand both
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX));
      await user.click(screen.getByText(TEST_NODE_LABELS.BENEFIT));

      // Then - both should show children
      expect(screen.getByText(TEST_NODE_LABELS.INCOME_TAX)).toBeInTheDocument();
      expect(screen.getByText(TEST_NODE_LABELS.HOUSING_BENEFIT)).toBeInTheDocument();
    });

    test('given nested expansion then loads grandchildren', async () => {
      // Given
      const user = userEvent.setup();
      const grandchildren = [
        { name: 'gov.tax.income.rate', label: 'Income rate', type: 'parameter' as const },
      ];
      const getChildren = createMockGetChildren({
        [TEST_NODE_NAMES.INCOME_TAX]: grandchildren,
      });
      render(<LazyNestedMenu nodes={MOCK_ROOT_NODES} getChildren={getChildren} />);

      // When - expand tax, then expand income tax
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX));
      await user.click(screen.getByText(TEST_NODE_LABELS.INCOME_TAX));

      // Then
      expect(getChildren).toHaveBeenCalledWith(TEST_NODE_NAMES.INCOME_TAX);
      expect(screen.getByText('Income rate')).toBeInTheDocument();
    });
  });

  describe('parameter click', () => {
    test('given click on leaf parameter then calls onParameterClick', async () => {
      // Given
      const user = userEvent.setup();
      const getChildren = createMockGetChildren();
      const onParameterClick = createMockOnParameterClick();
      render(
        <LazyNestedMenu
          nodes={MOCK_LEAF_NODES}
          getChildren={getChildren}
          onParameterClick={onParameterClick}
        />
      );

      // When
      await user.click(screen.getByText('Parameter 1'));

      // Then
      expect(onParameterClick).toHaveBeenCalledWith('gov.param1');
    });

    test('given click on nested leaf parameter then calls onParameterClick with full path', async () => {
      // Given
      const user = userEvent.setup();
      const getChildren = createMockGetChildren();
      const onParameterClick = createMockOnParameterClick();
      render(
        <LazyNestedMenu
          nodes={MOCK_ROOT_NODES}
          getChildren={getChildren}
          onParameterClick={onParameterClick}
        />
      );

      // When - expand tax, then click on tax rate
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX));
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX_RATE));

      // Then
      expect(onParameterClick).toHaveBeenCalledWith(TEST_NODE_NAMES.TAX_RATE);
    });

    test('given click on branch node then does not call onParameterClick', async () => {
      // Given
      const user = userEvent.setup();
      const getChildren = createMockGetChildren();
      const onParameterClick = createMockOnParameterClick();
      render(
        <LazyNestedMenu
          nodes={MOCK_ROOT_NODES}
          getChildren={getChildren}
          onParameterClick={onParameterClick}
        />
      );

      // When
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX));

      // Then
      expect(onParameterClick).not.toHaveBeenCalled();
    });

    test('given no onParameterClick provided then does not throw', async () => {
      // Given
      const user = userEvent.setup();
      const getChildren = createMockGetChildren();
      render(<LazyNestedMenu nodes={MOCK_LEAF_NODES} getChildren={getChildren} />);

      // When/Then - should not throw
      await expect(user.click(screen.getByText('Parameter 1'))).resolves.not.toThrow();
    });
  });

  describe('active state', () => {
    test('given click on node then node becomes active', async () => {
      // Given
      const user = userEvent.setup();
      const getChildren = createMockGetChildren();
      render(<LazyNestedMenu nodes={MOCK_ROOT_NODES} getChildren={getChildren} />);

      // When
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX));

      // Then - Tax node should be active (Mantine NavLink adds active styling)
      const taxElement = screen.getByText(TEST_NODE_LABELS.TAX).closest('a, button');
      expect(taxElement).toHaveAttribute('data-active', 'true');
    });

    test('given click on different node then active state changes', async () => {
      // Given
      const user = userEvent.setup();
      const getChildren = createMockGetChildren();
      render(<LazyNestedMenu nodes={MOCK_ROOT_NODES} getChildren={getChildren} />);

      // When - click tax, then click benefit
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX));
      await user.click(screen.getByText(TEST_NODE_LABELS.BENEFIT));

      // Then - Benefit should be active, Tax should not be active
      const taxElement = screen.getByText(TEST_NODE_LABELS.TAX).closest('a, button');
      const benefitElement = screen.getByText(TEST_NODE_LABELS.BENEFIT).closest('a, button');
      // Mantine only sets data-active="true" when active, removes it when not
      expect(taxElement).not.toHaveAttribute('data-active', 'true');
      expect(benefitElement).toHaveAttribute('data-active', 'true');
    });
  });

  describe('getChildren calls', () => {
    test('given node not expanded then does not call getChildren', () => {
      // Given
      const getChildren = createMockGetChildren();

      // When
      render(<LazyNestedMenu nodes={MOCK_ROOT_NODES} getChildren={getChildren} />);

      // Then
      expect(getChildren).not.toHaveBeenCalled();
    });

    test('given expand same node twice then calls getChildren each time rendered', async () => {
      // Given
      const user = userEvent.setup();
      const getChildren = createMockGetChildren();
      render(<LazyNestedMenu nodes={MOCK_ROOT_NODES} getChildren={getChildren} />);

      // When - expand, collapse, expand
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX));
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX));
      await user.click(screen.getByText(TEST_NODE_LABELS.TAX));

      // Then - getChildren should be called when expanded (2 times)
      expect(getChildren).toHaveBeenCalledTimes(2);
    });
  });
});
