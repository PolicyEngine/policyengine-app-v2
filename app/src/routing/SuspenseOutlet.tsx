import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

export default function SuspenseOutlet() {
  return (
    <Suspense>
      <Outlet />
    </Suspense>
  );
}
