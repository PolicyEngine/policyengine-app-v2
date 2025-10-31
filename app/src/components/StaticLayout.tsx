import { Outlet } from 'react-router-dom';
import HeaderNavigation from '@/components/shared/HomeHeader';

export default function StaticLayout() {
  return (
    <>
      <HeaderNavigation enableScrollAnimation={false} />
      <Outlet />
    </>
  );
}
