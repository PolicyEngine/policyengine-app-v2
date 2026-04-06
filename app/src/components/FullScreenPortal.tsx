/**
 * FullScreenPortal — renders children into a fixed full-screen overlay
 * via React portal. The underlying layout (sidebar, header) stays
 * mounted underneath but is visually covered.
 */

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface FullScreenPortalProps {
  children: ReactNode;
}

export default function FullScreenPortal({ children }: FullScreenPortalProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById('fullscreen-portal');
    setContainer(el);
  }, []);

  if (!container) return null;

  return createPortal(
    <div className="tw:fixed tw:inset-0 tw:z-[100] tw:bg-white">
      {children}
    </div>,
    container,
  );
}
