import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setSimulationsMode } from '@/reducers/simulationsReducer';

/**
 * Component that initializes the simulations mode on app startup.
 * This sets the global mode for whether the app uses single or multi-simulation mode.
 * 
 * Current default: 'single' mode for backward compatibility
 * Future: Can be changed to 'multi' or read from environment/feature flags
 */
export default function SimulationsModeInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Set the default mode to 'single' for now
    // In the future, this could read from:
    // - Environment variables: process.env.REACT_APP_SIMULATIONS_MODE
    // - Feature flags service
    // - User preferences/settings
    // - URL parameters for testing
    const defaultMode = 'single';
    
    dispatch(setSimulationsMode(defaultMode));
    
    console.log(`Simulations mode initialized to: ${defaultMode}`);
  }, [dispatch]);

  return <>{children}</>;
}