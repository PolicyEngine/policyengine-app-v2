import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/Home.page';
import AIDemoPage from './pages/AIDemoPage';


const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  
]);

export function Router() {
  return <RouterProvider router={router} />;
}
