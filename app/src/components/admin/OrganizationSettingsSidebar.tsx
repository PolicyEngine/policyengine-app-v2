import { AppLink } from '@/components/AppLink';
import { useAppPathname } from '@/contexts/LocationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import {
  isOrganizationSettingsPageCurrent,
  ORGANIZATION_SETTINGS_PAGES,
} from './organizationSettingsPages';

/**
 * The organization settings pages' links, styled like the account menu's
 * items: a 16px icon, then the label. The current page's link is marked
 * with `aria-current="page"`.
 */
export default function OrganizationSettingsSidebar() {
  const countryId = useCurrentCountry();
  const pathname = useAppPathname();
  return (
    <nav aria-label="My organization" className="tw:shrink-0 tw:md:w-48">
      <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-0.5 tw:p-0">
        {ORGANIZATION_SETTINGS_PAGES.map(({ label, icon: PageIcon, path }) => {
          const pagePath = path(countryId);
          const current = isOrganizationSettingsPageCurrent(pathname, pagePath);
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
