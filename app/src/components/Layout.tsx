import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AppShell } from '@mantine/core';
import Sidebar from './Sidebar';
import HeaderBar from './shared/HeaderBar';
import { spacing } from '@/designTokens';
import { RootState } from '@/store';

export default function Layout() {
  const { currentFrame } = useSelector((state: RootState) => state.flow);
  
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
        breakpoint: spacing.appShell.navbar.breakpoint 
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
