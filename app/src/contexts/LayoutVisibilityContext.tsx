/**
 * LayoutVisibilityContext — lets child components toggle the sidebar
 * visibility without unmounting StandardLayout.
 *
 * When fullScreen is true, StandardLayout hides its sidebar via CSS
 * and expands <main> to full width.
 */

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface LayoutVisibilityValue {
  isFullScreen: boolean;
  setFullScreen: (value: boolean) => void;
}

const LayoutVisibilityContext = createContext<LayoutVisibilityValue>({
  isFullScreen: false,
  setFullScreen: () => {},
});

export function LayoutVisibilityProvider({ children }: { children: ReactNode }) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const setFullScreen = useCallback((value: boolean) => {
    setIsFullScreen(value);
  }, []);

  return (
    <LayoutVisibilityContext.Provider value={{ isFullScreen, setFullScreen }}>
      {children}
    </LayoutVisibilityContext.Provider>
  );
}

export function useLayoutVisibility(): LayoutVisibilityValue {
  return useContext(LayoutVisibilityContext);
}
