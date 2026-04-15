/**
 * FullScreenPortal - renders children into a fixed full-screen overlay
 * while keeping the underlying calculator shell mounted.
 */

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface FullScreenPortalProps {
  children: ReactNode;
}

export default function FullScreenPortal({ children }: FullScreenPortalProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.getElementById('fullscreen-portal'));
  }, []);

  if (!container) {
    return null;
  }

  return createPortal(
    <div className="tw:fixed tw:inset-0 tw:z-[100] tw:bg-white">{children}</div>,
    container
  );
}
