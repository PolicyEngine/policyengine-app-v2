import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { spacing } from '@/designTokens';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { clearFlow } from '@/reducers/flowReducer';
import { RootState } from '@/store';
import { cacheMonitor } from '@/utils/cacheMonitor';
import HeaderNavigation from './shared/HomeHeader';
import LegacyBanner from './shared/LegacyBanner';
import Sidebar from './Sidebar';

export default function Layout() {
  const dispatch = useDispatch();
  const { currentFrame, currentFlow } = useSelector((state: RootState) => state.flow);
  const { resetIngredient } = useIngredientReset();
  const location = useLocation();
  const previousLocation = useRef(location.pathname);

  // Log navigation events for cache monitoring and handle flow clearing
  useEffect(() => {
    const from = previousLocation.current;
    const to = location.pathname;

    if (from !== to) {
      console.log('[Layout] ========== NAVIGATION DETECTED ==========');
      console.log('[Layout] From:', from);
      console.log('[Layout] To:', to);
      console.log('[Layout] currentFlow:', currentFlow);
      cacheMonitor.logNavigation(from, to);

      // Clear flow and all ingredients when navigating away from /create routes
      if (currentFlow && from.includes('/create') && !to.includes('/create')) {
        console.log('[Layout] Condition met: clearing flow and ingredients');
        console.log('[Layout] - currentFlow exists:', !!currentFlow);
        console.log('[Layout] - from.includes("/create"):', from.includes('/create'));
        console.log('[Layout] - !to.includes("/create"):', !to.includes('/create'));
        dispatch(clearFlow());
        console.log('[Layout] Dispatched clearFlow()');
        resetIngredient('report'); // Cascades to clear all ingredients
        console.log('[Layout] Called resetIngredient("report")');
      } else {
        console.log('[Layout] Condition NOT met - no clearing');
        console.log('[Layout] - currentFlow exists:', !!currentFlow);
        console.log('[Layout] - from.includes("/create"):', from.includes('/create'));
        console.log('[Layout] - !to.includes("/create"):', !to.includes('/create'));
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
