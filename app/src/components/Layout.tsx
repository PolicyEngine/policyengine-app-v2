import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { spacing } from '@/designTokens';
import { RootState } from '@/store';
import { cacheMonitor } from '@/utils/cacheMonitor';
import FlowOverlay from './FlowOverlay';
import HeaderBar from './shared/HeaderBar';
import Sidebar from './Sidebar';

export default function Layout() {
  const { currentFrame } = useSelector((state: RootState) => state.flow);
  const location = useLocation();
  const previousLocation = useRef(location.pathname);

  // Log navigation events for cache monitoring
  useEffect(() => {
    const from = previousLocation.current;
    const to = location.pathname;

    if (from !== to) {
      cacheMonitor.logNavigation(from, to);
      previousLocation.current = to;
    }
  }, [location.pathname]);

  // If PolicyParameterSelectorFrame is active, let it manage its own layout completely
  if (currentFrame === 'PolicyParameterSelectorFrame') {
    return <Outlet />;
  }

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
        <HeaderBar showLogo />
      </AppShell.Header>

      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        {!currentFrame ? <Outlet /> : <FlowOverlay />}
        {/*<Outlet />
        <FlowOverlay />
        */}
      </AppShell.Main>
    </AppShell>
  );
}
