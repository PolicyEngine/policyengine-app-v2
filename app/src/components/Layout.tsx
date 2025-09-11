import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AppShell, Box } from '@mantine/core';
import { spacing } from '../designTokens';
import Sidebar from './Sidebar';
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
      padding={0}
      navbar={{
        width: parseInt(spacing.layout.sidebarWidth, 10),
        breakpoint: 'sm',
      }}
    >
      <AppShell.Navbar p={0} withBorder={false}>
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Box
          style={{
            minHeight: '100vh',
            backgroundColor: '#f9fafb',
            padding: '24px',
          }}
        >
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
