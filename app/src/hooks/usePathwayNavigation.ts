import { useCallback, useState } from 'react';

/**
 * Custom hook for managing pathway navigation state
 * Provides navigation with history tracking for back navigation
 *
 * @param initialMode - The starting mode for the pathway
 * @returns Navigation state and control functions
 */
export function usePathwayNavigation<TMode>(initialMode: TMode) {
  const [currentMode, setCurrentMode] = useState<TMode>(initialMode);
  const [history, setHistory] = useState<TMode[]>([]);

  const navigateToMode = useCallback(
    (mode: TMode) => {
      setHistory((prev) => [...prev, currentMode]);
      setCurrentMode(mode);
    },
    [currentMode]
  );

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const previousMode = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setCurrentMode(previousMode);
    }
  }, [history]);

  const resetNavigation = useCallback((mode: TMode) => {
    setHistory([]);
    setCurrentMode(mode);
  }, []);

  return {
    currentMode,
    setCurrentMode,
    navigateToMode,
    goBack,
    resetNavigation,
    history,
    canGoBack: history.length > 0,
  };
}
