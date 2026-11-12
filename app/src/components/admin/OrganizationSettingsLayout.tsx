import type { ReactNode } from 'react';
import MinimumUserType from '@/components/auth/MinimumUserType';
import { spacing } from '@/designTokens';
import OrganizationSettingsSidebar from './OrganizationSettingsSidebar';

/**
 * The organization settings pages' layout: for admins, the sidebar of the
 * pages (for now only Users) left of the page, or above it on narrow
 * screens. Everyone else, and anyone whose type is not known yet, sees
 * the page alone, which says it is loading or not found. The page keeps
 * its place in the tree when the sidebar appears, so it is not mounted
 * again once `/v2/me` answers.
 */
export default function OrganizationSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="tw:flex tw:flex-col tw:gap-2xl tw:md:flex-row tw:md:items-start"
      style={{ maxWidth: spacing.layout.container, margin: '0 auto', width: '100%' }}
    >
      <MinimumUserType minimum="admin">
        <OrganizationSettingsSidebar />
      </MinimumUserType>
      <div className="tw:min-w-0 tw:flex-1">{children}</div>
    </div>
  );
}
