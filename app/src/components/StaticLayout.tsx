import { Outlet } from 'react-router-dom';
import Footer from '@/components/Footer';
import HeaderNavigation from '@/components/shared/HomeHeader';

export default function StaticLayout() {
  return (
    <>
      <HeaderNavigation />
      <Outlet />
      <Footer />
    </>
  );
}
