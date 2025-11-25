import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { spacing } from '@/designTokens';
import { cacheMonitor } from '@/utils/cacheMonitor';
import HeaderNavigation from './shared/HomeHeader';
import LegacyBanner from './shared/LegacyBanner';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();
  const previousLocation = useRef(location.pathname);

  // Log navigation events for cache monitoring
  useEffect(() => {
    const from = previousLocation.current;
    const to = location.pathname;

    if (from !== to) {
      console.log('[Layout] ========== NAVIGATION DETECTED ==========');
      console.log('[Layout] From:', from);
      console.log('[Layout] To:', to);
      cacheMonitor.logNavigation(from, to);
      previousLocation.current = to;
    }
  }, [location.pathname]);

  // Otherwise, render the normal layout with AppShell
  return (
    <AppShell
      layout="default"
      header={{ height: parseInt(spacing.appShell.header.height, 10) }}
      navbar={{
        width: parseInt(spacing.appShell.navbar.width, 10),
        breakpoint: spacing.appShell.navbar.breakpoint,
      }}
    >
      <AppShell.Header p={0}>
        <HeaderNavigation />
        <LegacyBanner />
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
