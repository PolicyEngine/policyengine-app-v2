import type { ReactNode } from 'react';

interface SettingsLayoutProps {
  /** The sidebar, or nothing for a visitor who should not see one. */
  sidebar: ReactNode;
  children: ReactNode;
}

/**
 * The template the account and admin settings share: the sidebar at the
 * content area's left edge with the page filling the rest, or the sidebar
 * above the page on narrow screens. From the `sm` breakpoint the content
 * sits 72px from the window's left and right edges: the shell's 24px
 * padding plus 48px here. The page keeps its place in the tree whether or
 * not the sidebar renders, so a sidebar that appears later (the admin one,
 * once `/v2/me` answers) does not mount the page again.
 */
export default function SettingsLayout({ sidebar, children }: SettingsLayoutProps) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-2xl tw:sm:px-4xl tw:md:flex-row tw:md:items-start">
      {sidebar}
      <div className="tw:min-w-0 tw:flex-1">{children}</div>
    </div>
  );
}
