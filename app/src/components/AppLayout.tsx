import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { clearFlow } from '@/reducers/flowReducer';
import { RootState } from '@/store';
import { cacheMonitor } from '@/utils/cacheMonitor';
import StandardLayout from './StandardLayout';

/**
 * AppLayout - Standard application layout for most routes
 *
 * Wraps child routes with StandardLayout (AppShell with header/navbar).
 * Also handles navigation logging and flow cleanup for /create routes.
 */
export default function AppLayout() {
  const dispatch = useDispatch();
  const { currentFlow } = useSelector((state: RootState) => state.flow);
  const { resetIngredient } = useIngredientReset();
  const location = useLocation();
  const previousLocation = useRef(location.pathname);

  // Log navigation events for cache monitoring and handle flow clearing
  useEffect(() => {
    const from = previousLocation.current;
    const to = location.pathname;

    if (from !== to) {
      console.log('[AppLayout] ========== NAVIGATION DETECTED ==========');
      console.log('[AppLayout] From:', from);
      console.log('[AppLayout] To:', to);
      console.log('[AppLayout] currentFlow:', currentFlow);
      cacheMonitor.logNavigation(from, to);

      // Clear flow and all ingredients when navigating away from /create routes
      if (currentFlow && from.includes('/create') && !to.includes('/create')) {
        console.log('[AppLayout] Condition met: clearing flow and ingredients');
        console.log('[AppLayout] - currentFlow exists:', !!currentFlow);
        console.log('[AppLayout] - from.includes("/create"):', from.includes('/create'));
        console.log('[AppLayout] - !to.includes("/create"):', !to.includes('/create'));
        dispatch(clearFlow());
        console.log('[AppLayout] Dispatched clearFlow()');
        resetIngredient('report'); // Cascades to clear all ingredients
        console.log('[AppLayout] Called resetIngredient("report")');
      } else {
        console.log('[AppLayout] Condition NOT met - no clearing');
        console.log('[AppLayout] - currentFlow exists:', !!currentFlow);
        console.log('[AppLayout] - from.includes("/create"):', from.includes('/create'));
        console.log('[AppLayout] - !to.includes("/create"):', !to.includes('/create'));
      }

      previousLocation.current = to;
    }
  }, [location.pathname, currentFlow, dispatch]);

  // Wrap all child routes with standard layout
  return (
    <StandardLayout>
      <Outlet />
    </StandardLayout>
  );
}
