import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { spacing } from '@/designTokens';
import { clearFlow } from '@/reducers/flowReducer';
import { RootState } from '@/store';
import { cacheMonitor } from '@/utils/cacheMonitor';
import HeaderBar from './shared/HeaderBar';
import Sidebar from './Sidebar';

export default function Layout() {
  const dispatch = useDispatch();
  const { currentFrame, currentFlow } = useSelector((state: RootState) => state.flow);
  const location = useLocation();
  const previousLocation = useRef(location.pathname);

  // Log navigation events for cache monitoring and handle flow clearing
  useEffect(() => {
    const from = previousLocation.current;
    const to = location.pathname;

    if (from !== to) {
      cacheMonitor.logNavigation(from, to);

      // Clear flow when navigating away from /create routes
      if (currentFlow && from.includes('/create') && !to.includes('/create')) {
        dispatch(clearFlow());
      }

      previousLocation.current = to;
    }
  }, [location.pathname, currentFlow, dispatch]);

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
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
