/**
 * StandardLayout - Standard application layout with AppShell
 *
 * Extracted from Layout component to be reusable by pathways.
 * Provides header, navbar, and main content area.
 *
 * Uses LayoutProvider to track nesting - if already inside a StandardLayout,
 * children are rendered directly without double-wrapping.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { LayoutProvider, useIsInsideLayout } from '@/contexts/LayoutContext';
import { spacing } from '@/designTokens';
import GiveCalcBanner from './shared/GiveCalcBanner';
import HeaderNavigation from './shared/HomeHeader';
import Sidebar from './Sidebar';

interface StandardLayoutProps {
  children: React.ReactNode;
}

export default function StandardLayout({ children }: StandardLayoutProps) {
  const isInsideLayout = useIsInsideLayout();
  const location = useLocation();
  const [navbarOpened, { toggle: toggleNavbar, close: closeNavbar }] = useDisclosure();

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

        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
    </LayoutProvider>
  );
}
