import type { ReactNode } from 'react';
import MinimumUserType from '@/components/auth/MinimumUserType';
import SettingsLayout from './SettingsLayout';
import { ADMIN_SETTINGS_PAGES } from './settingsPages';
import SettingsSidebar from './SettingsSidebar';

/**
 * The admin settings ("Admin" in the account menu): the shared settings
 * template with, for admins, a sidebar of the admin pages (for now only
 * Users). Everyone else, and anyone whose type is not known yet, sees the
 * page alone. The layout hides only the sidebar: each admin page restricts
 * its own content to admins, with its own loading and not-found states, as
 * `AdminUsersPage` does.
 */
export default function AdminSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsLayout
      sidebar={
        <MinimumUserType minimum="admin">
          <SettingsSidebar label="Admin" pages={ADMIN_SETTINGS_PAGES} />
        </MinimumUserType>
      }
    >
      {children}
    </SettingsLayout>
  );
}
