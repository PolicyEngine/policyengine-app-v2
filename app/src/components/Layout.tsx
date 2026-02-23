import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDisclosure } from '@/hooks/useDisclosure';
import { cn } from '@/lib/utils';
import { cacheMonitor } from '@/utils/cacheMonitor';
import GiveCalcBanner from './shared/GiveCalcBanner';
import HeaderNavigation from './shared/HomeHeader';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();
  const previousLocation = useRef(location.pathname);
  const [navbarOpened, { toggle: toggleNavbar, close: closeNavbar }] = useDisclosure();

  // Track navigation for cache monitoring
  useEffect(() => {
    const from = previousLocation.current;
    const to = location.pathname;

    if (from !== to) {
      cacheMonitor.logNavigation(from, to);
      previousLocation.current = to;
    }
  }, [location.pathname]);

  // Close navbar on route change (mobile UX)
  useEffect(() => {
    closeNavbar();
  }, [location.pathname, closeNavbar]);

  return (
    <div className="tw:min-h-screen tw:flex tw:flex-col">
      <header className="tw:sticky tw:top-0 tw:z-50">
        <HeaderNavigation navbarOpened={navbarOpened} onToggleNavbar={toggleNavbar} />
        <GiveCalcBanner />
      </header>

      <div className="tw:flex tw:flex-1">
        <nav
          className={cn(
            'tw:w-[250px] tw:border-r tw:border-border-light tw:overflow-y-auto tw:bg-white tw:shrink-0',
            'tw:hidden sm:tw:block',
            navbarOpened &&
              'tw:fixed tw:inset-0 tw:z-40 tw:block sm:tw:relative sm:tw:z-auto tw:top-0'
          )}
        >
          <Sidebar />
        </nav>
        <main className="tw:flex-1 tw:overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
