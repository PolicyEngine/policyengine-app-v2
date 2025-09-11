import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AppShell } from '@mantine/core';
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
    <AppShell>
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
