import { Outlet } from 'react-router-dom';
import Footer from '@/components/Footer';
import HeaderNavigation from '@/components/shared/HeaderNavigation';

/**
 * Layout for app/dashboard pages without the legacy banner
 */
export default function AppLayout() {
  return (
    <>
      <HeaderNavigation />
      <Outlet />
      <Footer />
    </>
  );
}
