import type { ReactNode } from 'react';
import { IconUsers, type Icon } from '@tabler/icons-react';
import { AppLink } from '@/components/AppLink';
import { useAppPathname } from '@/contexts/LocationContext';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserType } from '@/hooks/useUserType';
import { userTypeMeetsMinimum } from '@/types/v2User';

/** The organization's users page, where the account menu's "My organization" leads. */
export function organizationUsersPath(countryId: string): string {
  return `/${countryId}/admin/users`;
}

interface OrganizationSettingsPage {
  label: string;
  icon: Icon;
  path: (countryId: string) => string;
}

/** The organization settings pages, in the order the sidebar lists them. */
const ORGANIZATION_SETTINGS_PAGES: readonly OrganizationSettingsPage[] = [
  { label: 'Users', icon: IconUsers, path: organizationUsersPath },
];

function isCurrentPage(pathname: string, pagePath: string): boolean {
  return pathname === pagePath || pathname.startsWith(`${pagePath}/`);
}

/** The sidebar's links, styled like the account menu's items: a 16px icon, then the label. */
function OrganizationSettingsSidebar() {
  const countryId = useCurrentCountry();
  const pathname = useAppPathname();
  return (
    <nav aria-label="My organization" className="tw:shrink-0 tw:md:w-48">
      <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-0.5 tw:p-0">
        {ORGANIZATION_SETTINGS_PAGES.map(({ label, icon: PageIcon, path }) => {
          const pagePath = path(countryId);
          const current = isCurrentPage(pathname, pagePath);
          return (
            <li key={label}>
              <AppLink
                to={pagePath}
                aria-current={current ? 'page' : undefined}
                className={`tw:flex tw:items-center tw:gap-2 tw:rounded-sm tw:px-2 tw:py-1.5 tw:text-sm tw:text-foreground tw:no-underline tw:hover:bg-accent ${
                  current ? 'tw:bg-accent tw:font-medium' : ''
                }`}
              >
                <PageIcon size={16} className="tw:shrink-0 tw:text-muted-foreground" aria-hidden />
                {label}
              </AppLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * The organization settings pages' layout: for admins, a sidebar of the
 * pages (for now only Users) left of the page, or above it on narrow
 * screens. Everyone else, and anyone whose type is not known yet, sees
 * the page alone, which says it is loading or not found. The page keeps
 * its place in the tree when the sidebar appears, so it is not mounted
 * again once `/v2/me` answers.
 */
export default function OrganizationSettingsLayout({ children }: { children: ReactNode }) {
  const userType = useUserType();
  const isAdmin = userType !== null && userTypeMeetsMinimum(userType, 'admin');
  return (
    <div
      className="tw:flex tw:flex-col tw:gap-6 tw:md:flex-row tw:md:items-start"
      style={{ maxWidth: spacing.layout.container, margin: '0 auto', width: '100%' }}
    >
      {isAdmin && <OrganizationSettingsSidebar />}
      <div className="tw:min-w-0 tw:flex-1">{children}</div>
    </div>
  );
}
