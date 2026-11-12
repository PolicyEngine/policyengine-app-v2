import type { ReactNode } from 'react';
import MinimumUserType from '@/components/auth/MinimumUserType';
import OrganizationSettingsSidebar from './OrganizationSettingsSidebar';

/**
 * The organization settings pages' layout, across the whole content area:
 * for admins, the sidebar of the pages (for now only Users) at its left
 * edge, with the page filling the rest, or the sidebar above the page on
 * narrow screens. Everyone else, and anyone whose type is not known yet, sees
 * the page alone. The layout hides only the sidebar: each page restricts
 * its own content to admins, with its own loading and not-found states,
 * as `AdminUsersPage` does. The page keeps its place in the tree when the
 * sidebar appears, so it is not mounted again once `/v2/me` answers.
 */
export default function OrganizationSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-2xl tw:md:flex-row tw:md:items-start">
      <MinimumUserType minimum="admin">
        <OrganizationSettingsSidebar />
      </MinimumUserType>
      <div className="tw:min-w-0 tw:flex-1">{children}</div>
    </div>
  );
}
