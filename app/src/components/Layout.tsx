import { Outlet } from 'react-router-dom';
import { AppShell, Box } from '@mantine/core';
import { spacing } from '../designTokens';
import Sidebar from './Sidebar';

export default function Layout() {
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
