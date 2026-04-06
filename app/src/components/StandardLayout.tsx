/**
 * StandardLayout - Standard application layout
 *
 * Extracted from Layout component to be reusable by pathways.
 * Provides header, navbar, and main content area.
 *
 * Uses LayoutProvider to track nesting - if already inside a StandardLayout,
 * children are rendered directly without double-wrapping.
 */

import { Profiler, useEffect } from 'react';
import { LayoutProvider, useIsInsideLayout } from '@/contexts/LayoutContext';
import { useLayoutVisibility } from '@/contexts/LayoutVisibilityContext';
import { useAppLocation } from '@/contexts/LocationContext';
import { useDisclosure } from '@/hooks/useDisclosure';
import { cn } from '@/lib/utils';
import { perfMount, perfProfilerCallback } from '@/utils/perfHarness';
import GiveCalcBanner from './shared/GiveCalcBanner';
import HeaderNavigation from './shared/HomeHeader';
import Sidebar from './Sidebar';

interface StandardLayoutProps {
  children: React.ReactNode;
}

export default function StandardLayout({ children }: StandardLayoutProps) {
  const isInsideLayout = useIsInsideLayout();
  const { isFullScreen } = useLayoutVisibility();
  const location = useAppLocation();
  const [navbarOpened, { toggle: toggleNavbar, close: closeNavbar }] = useDisclosure();

  // [PERF HARNESS] Track mount/unmount lifecycle
  useEffect(() => perfMount('StandardLayout'), []);

  // Close navbar on route change (mobile UX)
  useEffect(() => {
    closeNavbar();
  }, [location.pathname, closeNavbar]);

  // If already inside a StandardLayout, just render children directly
  // This prevents double-wrapping when pathways are inside router-provided layouts
  if (isInsideLayout) {
    return <>{children}</>;
  }

  return (
    <LayoutProvider>
      <Profiler id="StandardLayout" onRender={perfProfilerCallback}>
      <div className="tw:h-screen tw:overflow-hidden tw:flex tw:flex-col">
        <header className="tw:sticky tw:top-0 tw:z-50 tw:shrink-0">
          <HeaderNavigation navbarOpened={navbarOpened} onToggleNavbar={toggleNavbar} />
          <GiveCalcBanner />
        </header>

        <div className="tw:flex tw:flex-1 tw:min-h-0">
          <nav
            className={cn(
              'tw:w-[300px] tw:shrink-0 tw:border-r tw:border-border-light tw:overflow-y-auto tw:bg-white',
              'tw:hidden tw:sm:block',
              navbarOpened &&
                'tw:fixed tw:inset-0 tw:z-40 tw:block tw:sm:relative tw:sm:z-auto tw:top-0',
              isFullScreen && 'tw:!hidden'
            )}
          >
            <Sidebar />
          </nav>
          <main className={cn(
            'tw:flex-1 tw:min-w-0 tw:overflow-y-auto tw:overflow-x-hidden tw:bg-gray-50',
            isFullScreen ? 'tw:max-w-full tw:p-0' : 'tw:max-w-[calc(100vw-300px)] tw:p-[24px]'
          )}>
            {children}
          </main>
        </div>
      </div>
      </Profiler>
    </LayoutProvider>
  );
}
