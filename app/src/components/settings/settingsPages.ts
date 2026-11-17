import { IconDatabase, IconSettings, IconUsers, type Icon } from '@tabler/icons-react';

/** The account page, the account settings' General page. */
export function accountPath(countryId: string): string {
  return `/${countryId}/account`;
}

/** The account settings' My data page, with "Download my data". */
export function accountDataPath(countryId: string): string {
  return `/${countryId}/account/data`;
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
  { label: 'My data', icon: IconDatabase, path: accountDataPath },
];

/** The admin settings pages, in the order the sidebar lists them. */
export const ADMIN_SETTINGS_PAGES: readonly SettingsPage[] = [
  { label: 'Users', icon: IconUsers, path: adminUsersPath },
];

/**
 * The path of the page `pathname` is on, among `pagePaths`: the longest one
 * it equals or sits under (`/us/account/data` is My data, not General at
 * `/us/account`), or null when it is on none of them.
 */
export function currentSettingsPagePath(
  pathname: string,
  pagePaths: readonly string[]
): string | null {
  const matching = pagePaths.filter(
    (pagePath) => pathname === pagePath || pathname.startsWith(`${pagePath}/`)
  );
  return matching.reduce<string | null>(
    (longest, pagePath) =>
      longest === null || pagePath.length > longest.length ? pagePath : longest,
    null
  );
}
