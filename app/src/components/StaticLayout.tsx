import { Outlet } from 'react-router-dom';
import Footer from '@/components/Footer';
import GiveCalcBanner from '@/components/shared/GiveCalcBanner';
import HeaderNavigation from '@/components/shared/HomeHeader';

export default function StaticLayout() {
  return (
    <>
      <HeaderNavigation />
      <GiveCalcBanner />
      <Outlet />
      <Footer />
    </>
  );
}
