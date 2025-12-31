/**
 * StandardLayout - Standard application layout with AppShell
 *
 * Extracted from Layout component to be reusable by pathways.
 * Provides header, navbar, and main content area.
 *
 * Uses LayoutProvider to track nesting - if already inside a StandardLayout,
 * children are rendered directly without double-wrapping.
 */

import { AppShell } from '@mantine/core';
import { LayoutProvider, useIsInsideLayout } from '@/contexts/LayoutContext';
import { spacing } from '@/designTokens';
import GiveCalcBanner from './shared/GiveCalcBanner';
import HeaderNavigation from './shared/HomeHeader';
import LegacyBanner from './shared/LegacyBanner';
import Sidebar from './Sidebar';

interface StandardLayoutProps {
  children: React.ReactNode;
}

export default function StandardLayout({ children }: StandardLayoutProps) {
  const isInsideLayout = useIsInsideLayout();

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
        }}
      >
        <AppShell.Header p={0}>
          <HeaderNavigation />
          <GiveCalcBanner />
          <LegacyBanner />
        </AppShell.Header>

        <AppShell.Navbar>
          <Sidebar />
        </AppShell.Navbar>

        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
    </LayoutProvider>
  );
}
