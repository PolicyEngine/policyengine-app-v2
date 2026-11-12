import { IconSettings, IconUsers, type Icon } from '@tabler/icons-react';

/** The account page, the account settings' General page. */
export function accountPath(countryId: string): string {
  return `/${countryId}/account`;
}

/** The admin users page, where the account menu's "Admin" leads. */
export function adminUsersPath(countryId: string): string {
  return `/${countryId}/admin/users`;
}

export interface SettingsPage {
  label: string;
  icon: Icon;
  path: (countryId: string) => string;
}

/** The account settings pages, in the order the sidebar lists them. */
export const ACCOUNT_SETTINGS_PAGES: readonly SettingsPage[] = [
  { label: 'General', icon: IconSettings, path: accountPath },
];

/** The admin settings pages, in the order the sidebar lists them. */
export const ADMIN_SETTINGS_PAGES: readonly SettingsPage[] = [
  { label: 'Users', icon: IconUsers, path: adminUsersPath },
];

/** Whether `pathname` is the page at `pagePath` or one of its subpages. */
export function isSettingsPageCurrent(pathname: string, pagePath: string): boolean {
  return pathname === pagePath || pathname.startsWith(`${pagePath}/`);
}
