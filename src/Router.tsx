import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/Home.page';
import AIDemoPage from './pages/AIDemo.page';


const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/us/ai',
    element: <AIDemoPage />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
