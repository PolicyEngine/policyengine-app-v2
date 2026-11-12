import type { ReactNode } from 'react';
import SettingsLayout from './SettingsLayout';
import { ACCOUNT_SETTINGS_PAGES } from './settingsPages';
import SettingsSidebar from './SettingsSidebar';

/**
 * The account settings ("My account" in the account menu): the shared
 * settings template with a sidebar of the account pages (for now only
 * General). Everyone who can open the account page sees the sidebar,
 * signed out included.
 */
export default function AccountSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsLayout sidebar={<SettingsSidebar label="My account" pages={ACCOUNT_SETTINGS_PAGES} />}>
      {children}
    </SettingsLayout>
  );
}
