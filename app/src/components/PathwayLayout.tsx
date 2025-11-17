import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { RootState } from '@/store';

/**
 * PathwayLayout - Layout wrapper for pathway routes
 *
 * Renders a bare Outlet, allowing pathways to manage their own layouts.
 * This prevents unmounting when pathways switch between views.
 *
 * Also supports Redux flows (PolicyParameterSelectorFrame) for backwards compatibility.
 */
export default function PathwayLayout() {
  const { currentFrame } = useSelector((state: RootState) => state.flow);

  // Log when PolicyParameterSelectorFrame is active (Redux flow compatibility)
  if (currentFrame === 'PolicyParameterSelectorFrame') {
    console.log('[PathwayLayout] Redux frame manages own layout:', currentFrame);
  }

  // Always render bare Outlet - pathways manage their own layouts
  return <Outlet />;
}
