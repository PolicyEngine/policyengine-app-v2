import { AppLink } from '@/components/AppLink';
import { useAppPathname } from '@/contexts/LocationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { currentSettingsPagePath, type SettingsPage } from './settingsPages';

interface SettingsSidebarProps {
  /** The sidebar's accessible name, such as "My account" or "Admin". */
  label: string;
  pages: readonly SettingsPage[];
}

/**
 * A settings sidebar's links, styled like the account menu's items: a 16px
 * icon, then the label. The current page's link is marked with
 * `aria-current="page"`.
 */
export default function SettingsSidebar({ label, pages }: SettingsSidebarProps) {
  const countryId = useCurrentCountry();
  const pathname = useAppPathname();
  const currentPath = currentSettingsPagePath(
    pathname,
    pages.map(({ path }) => path(countryId))
  );
  return (
    <nav aria-label={label} className="tw:shrink-0 tw:md:w-48">
      <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-0.5 tw:p-0">
        {pages.map(({ label: pageLabel, icon: PageIcon, path }) => {
          const pagePath = path(countryId);
          const current = pagePath === currentPath;
          return (
            <li key={pageLabel}>
              <AppLink
                to={pagePath}
                aria-current={current ? 'page' : undefined}
                className={`tw:flex tw:items-center tw:gap-2 tw:rounded-sm tw:px-2 tw:py-1.5 tw:text-sm tw:text-foreground tw:no-underline tw:hover:bg-accent ${
                  current ? 'tw:bg-accent tw:font-medium' : ''
                }`}
              >
                <PageIcon size={16} className="tw:shrink-0 tw:text-muted-foreground" aria-hidden />
                {pageLabel}
              </AppLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
