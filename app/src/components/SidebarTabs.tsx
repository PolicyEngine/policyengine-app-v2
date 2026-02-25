import { ReactNode } from 'react';
import { colors, spacing, typography } from '@/designTokens';

export interface SidebarTab {
  value: string;
  label: string;
}

interface SidebarTabsProps {
  /** Array of tab configurations */
  tabs: SidebarTab[];

  /** Currently active tab value */
  activeTab: string;

  /** Callback when tab is clicked */
  onTabChange: (value: string) => void;

  /** Content to display for the active tab */
  children: ReactNode;
}

/**
 * Generic sidebar tabs component
 *
 * Displays vertical tabs in a left sidebar with content on the right.
 * Mirrors the styling pattern used in PolicyDesign1 page.
 *
 * @example
 * ```tsx
 * <SidebarTabs
 *   tabs={[
 *     { value: 'average', label: 'Average Change' },
 *     { value: 'relative', label: 'Relative Change' }
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * >
 *   {activeTab === 'average' && <AverageContent />}
 *   {activeTab === 'relative' && <RelativeContent />}
 * </SidebarTabs>
 * ```
 */
export function SidebarTabs({ tabs, activeTab, onTabChange, children }: SidebarTabsProps) {
  return (
    <div className="tw:flex tw:items-start tw:flex-nowrap" style={{ gap: spacing.xl }}>
      {/* Left sidebar with vertical tabs */}
      <div style={{ paddingRight: spacing.xl }}>
        <div className="tw:flex tw:flex-col tw:gap-1">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className="tw:border-none tw:bg-transparent tw:w-full tw:text-left tw:p-0"
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                cursor: 'pointer',
                backgroundColor: activeTab === tab.value ? colors.gray[50] : 'transparent',
                borderLeft:
                  activeTab === tab.value
                    ? `3px solid ${colors.primary[500]}`
                    : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                className="tw:text-sm"
                style={{
                  fontWeight:
                    activeTab === tab.value
                      ? typography.fontWeight.medium
                      : typography.fontWeight.normal,
                  color: activeTab === tab.value ? colors.text.primary : colors.text.secondary,
                }}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right content area */}
      <div className="tw:flex-1">{children}</div>
    </div>
  );
}
