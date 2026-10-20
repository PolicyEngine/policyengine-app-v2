import { useEffect, useRef } from 'react';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';

/** The query parameter naming the report section that is open. */
export const REPORT_TAB_PARAM = 'tab';

/** The section a report opens on. Its URL has no section parameter. */
export const REPORT_OVERVIEW_TAB = 'policy';

/**
 * The current page's URL with this section open. Other query parameters
 * stay; the Overview drops the section parameter, so the report's own
 * link is the Overview's.
 */
export function reportTabUrl(pathname: string, search: string, tab: string): string {
  const params = new URLSearchParams(search);
  if (tab === REPORT_OVERVIEW_TAB) {
    params.delete(REPORT_TAB_PARAM);
  } else {
    params.set(REPORT_TAB_PARAM, tab);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * The report section the URL names, and how to open another. Each section
 * opened is a new browser history entry, so Back returns to the section
 * that was open before it, and from the first one opened to the Overview.
 * A URL naming no section, or one not in `availableTabs`, opens the Overview.
 */
export function useReportTabHistory(availableTabs: readonly string[]): {
  activeTab: string;
  /** Opens the section as a new history entry; false when it is already open or opening. */
  openTab: (tab: string) => boolean;
} {
  const { pathname, search } = useAppLocation();
  const nav = useAppNavigate();
  const requestedTab = new URLSearchParams(search).get(REPORT_TAB_PARAM);
  const activeTab =
    requestedTab && availableTabs.includes(requestedTab) ? requestedTab : REPORT_OVERVIEW_TAB;
  // The section just opened, until the URL shows it. A click on a tab asks
  // twice, on press and on focus, and the URL can update after both.
  const openingTabRef = useRef<string | null>(null);
  useEffect(() => {
    openingTabRef.current = null;
  }, [search]);
  const openTab = (tab: string) => {
    if (tab === (openingTabRef.current ?? activeTab)) {
      return false;
    }
    openingTabRef.current = tab;
    nav.push(reportTabUrl(pathname, search, tab));
    return true;
  };
  return { activeTab, openTab };
}
