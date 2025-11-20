import { Outlet } from 'react-router-dom';

/**
 * PathwayLayout - Layout wrapper for pathway routes
 *
 * Renders a bare Outlet, allowing pathways to manage their own layouts.
 * This prevents unmounting when pathways switch between views.
 */
export default function PathwayLayout() {
  // Always render bare Outlet - pathways manage their own layouts
  return <Outlet />;
}
