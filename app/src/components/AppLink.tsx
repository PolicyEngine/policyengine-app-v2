import React, { forwardRef, useCallback } from 'react';
import { useAppNavigate } from '@/contexts/NavigationContext';

interface AppLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  replace?: boolean;
}

/**
 * Router-agnostic link component. Drop-in replacement for react-router's Link.
 * Uses NavigationContext so it works in both react-router (catch-all) and
 * Next.js (extracted routes) contexts.
 */
export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  ({ to, replace: shouldReplace, onClick, children, ...rest }, ref) => {
    const nav = useAppNavigate();

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Let the browser handle modified clicks (new tab, etc.)
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return;
        }

        e.preventDefault();
        onClick?.(e);

        if (shouldReplace) {
          nav.replace(to);
        } else {
          nav.push(to);
        }
      },
      [to, shouldReplace, onClick, nav]
    );

    return (
      <a ref={ref} href={to} onClick={handleClick} {...rest}>
        {children}
      </a>
    );
  }
);

AppLink.displayName = 'AppLink';
