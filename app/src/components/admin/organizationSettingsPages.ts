import { IconUsers, type Icon } from '@tabler/icons-react';

/** The organization's users page, where the account menu's "My organization" leads. */
export function organizationUsersPath(countryId: string): string {
  return `/${countryId}/admin/users`;
}

export interface OrganizationSettingsPage {
  label: string;
  icon: Icon;
  path: (countryId: string) => string;
}

/** The organization settings pages, in the order the sidebar lists them. */
export const ORGANIZATION_SETTINGS_PAGES: readonly OrganizationSettingsPage[] = [
  { label: 'Users', icon: IconUsers, path: organizationUsersPath },
];

/** Whether `pathname` is the page at `pagePath` or one of its subpages. */
export function isOrganizationSettingsPageCurrent(pathname: string, pagePath: string): boolean {
  return pathname === pagePath || pathname.startsWith(`${pagePath}/`);
}
