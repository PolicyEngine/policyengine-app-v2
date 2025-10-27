import { describe, test, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import { SidebarTabs, type SidebarTab } from '@/components/SidebarTabs';

const MOCK_TABS: SidebarTab[] = [
  { value: 'tab1', label: 'First Tab' },
  { value: 'tab2', label: 'Second Tab' },
  { value: 'tab3', label: 'Third Tab' },
];

describe('SidebarTabs', () => {
  test('given tabs then renders all tab labels', () => {
    // Given
    const onTabChange = vi.fn();

    // When
    render(
      <SidebarTabs tabs={MOCK_TABS} activeTab="tab1" onTabChange={onTabChange}>
        <div>Content</div>
      </SidebarTabs>
    );

    // Then
    expect(screen.getByText('First Tab')).toBeInTheDocument();
    expect(screen.getByText('Second Tab')).toBeInTheDocument();
    expect(screen.getByText('Third Tab')).toBeInTheDocument();
  });

  test('given active tab then displays content', () => {
    // Given
    const onTabChange = vi.fn();

    // When
    render(
      <SidebarTabs tabs={MOCK_TABS} activeTab="tab1" onTabChange={onTabChange}>
        <div data-testid="tab-content">Tab 1 Content</div>
      </SidebarTabs>
    );

    // Then
    expect(screen.getByTestId('tab-content')).toBeInTheDocument();
    expect(screen.getByText('Tab 1 Content')).toBeInTheDocument();
  });

  test('given user clicks tab then callback invoked', async () => {
    // Given
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(
      <SidebarTabs tabs={MOCK_TABS} activeTab="tab1" onTabChange={onTabChange}>
        <div>Content</div>
      </SidebarTabs>
    );

    // When
    await user.click(screen.getByText('Second Tab'));

    // Then
    expect(onTabChange).toHaveBeenCalledWith('tab2');
  });

  test('given user clicks active tab then callback still invoked', async () => {
    // Given
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(
      <SidebarTabs tabs={MOCK_TABS} activeTab="tab1" onTabChange={onTabChange}>
        <div>Content</div>
      </SidebarTabs>
    );

    // When
    await user.click(screen.getByText('First Tab'));

    // Then
    expect(onTabChange).toHaveBeenCalledWith('tab1');
  });

  test('given multiple tabs then renders all', () => {
    // Given
    const onTabChange = vi.fn();
    const manyTabs: SidebarTab[] = Array.from({ length: 5 }, (_, i) => ({
      value: `tab${i}`,
      label: `Tab ${i}`,
    }));

    // When
    render(
      <SidebarTabs tabs={manyTabs} activeTab="tab0" onTabChange={onTabChange}>
        <div>Content</div>
      </SidebarTabs>
    );

    // Then
    manyTabs.forEach((tab) => {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    });
  });

  test('given single tab then renders correctly', () => {
    // Given
    const onTabChange = vi.fn();
    const singleTab: SidebarTab[] = [{ value: 'only', label: 'Only Tab' }];

    // When
    render(
      <SidebarTabs tabs={singleTab} activeTab="only" onTabChange={onTabChange}>
        <div>Content</div>
      </SidebarTabs>
    );

    // Then
    expect(screen.getByText('Only Tab')).toBeInTheDocument();
  });

  test('given custom sidebar width then applies it', () => {
    // Given
    const onTabChange = vi.fn();

    // When
    const { container } = render(
      <SidebarTabs tabs={MOCK_TABS} activeTab="tab1" onTabChange={onTabChange} sidebarMinWidth="300px">
        <div>Content</div>
      </SidebarTabs>
    );

    // Then
    const sidebar = container.querySelector('[style*="min-width"]');
    expect(sidebar).toHaveStyle({ minWidth: '300px' });
  });

  test('given no custom width then uses default', () => {
    // Given
    const onTabChange = vi.fn();

    // When
    const { container } = render(
      <SidebarTabs tabs={MOCK_TABS} activeTab="tab1" onTabChange={onTabChange}>
        <div>Content</div>
      </SidebarTabs>
    );

    // Then
    const sidebar = container.querySelector('[style*="min-width"]');
    expect(sidebar).toHaveStyle({ minWidth: '240px' });
  });
});
