import { Outlet } from 'react-router-dom';
import AutumnBudgetBanner from '@/components/shared/AutumnBudgetBanner';
import HeaderNavigation from '@/components/shared/HomeHeader';
import LegacyBanner from '@/components/shared/LegacyBanner';

export default function StaticLayout() {
  return (
    <>
      <HeaderNavigation />
      <LegacyBanner />
      <AutumnBudgetBanner />
      <Outlet />
    </>
  );
}
