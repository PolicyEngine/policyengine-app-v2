/**
 * StandardLayout - Standard application layout with AppShell
 *
 * Extracted from Layout component to be reusable by pathways.
 * Provides header, navbar, and main content area.
 */

import { AppShell } from '@mantine/core';
import { spacing } from '@/designTokens';
import HeaderNavigation from './shared/HomeHeader';
import LegacyBanner from './shared/LegacyBanner';
import Sidebar from './Sidebar';

interface StandardLayoutProps {
  children: React.ReactNode;
}

export default function StandardLayout({ children }: StandardLayoutProps) {
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

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
