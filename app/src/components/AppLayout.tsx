import { Outlet } from 'react-router-dom';
import StandardLayout from './StandardLayout';

/**
 * AppLayout - Standard application layout for most routes
 *
 * Wraps child routes with StandardLayout (AppShell with header/navbar).
 * Also handles navigation logging.
 */
export default function AppLayout() {
  // Wrap all child routes with standard layout
  return (
    <StandardLayout>
      <Outlet />
    </StandardLayout>
  );
}
