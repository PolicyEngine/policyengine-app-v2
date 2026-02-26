import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { spacing } from '@/designTokens';
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

  // Otherwise, render the normal layout with AppShell
  return (
    <AppShell
      layout="default"
      header={{ height: parseInt(spacing.appShell.header.height, 10) }}
      navbar={{
        width: parseInt(spacing.appShell.navbar.width, 10),
        breakpoint: spacing.appShell.navbar.breakpoint,
        collapsed: { mobile: !navbarOpened },
      }}
    >
      <AppShell.Header p={0}>
        <HeaderNavigation navbarOpened={navbarOpened} onToggleNavbar={toggleNavbar} />
        <GiveCalcBanner />
      </AppShell.Header>

      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
