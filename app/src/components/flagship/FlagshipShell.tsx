import { useEffect, useRef } from 'react';
import { useAppLocation } from '@/contexts/LocationContext';
import { useDisclosure } from '@/hooks/useDisclosure';
import { cn } from '@/lib/utils';
import FlagshipMobileBar from './FlagshipMobileBar';
import FlagshipSidebar from './FlagshipSidebar';
import { SIDE_PANEL_SLOT_ID } from './SidePanel';

const NAV_ID = 'flagship-nav';

interface FlagshipShellProps {
  children: React.ReactNode;
}

/**
 * The flagship shell: persistent left sidebar (brand, entry points,
 * recent reforms) beside the content area, and the right plane for
 * side panels.
 *
 * Below the sm breakpoint the sidebar cannot share the row with the
 * content, so it folds into a drawer behind a top-bar toggle — the same
 * breakpoint and open/close-on-navigate behavior as the legacy
 * StandardLayout nav — and the content gets the full width.
 */
export default function FlagshipShell({ children }: FlagshipShellProps) {
  const location = useAppLocation();
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeNav();
  }, [location.pathname, closeNav]);

  // Escape dismisses the drawer and hands focus back to its toggle, so
  // the keyboard does not land on <body> when the drawer disappears.
  useEffect(() => {
    if (!navOpened) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeNav();
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navOpened, closeNav]);

  return (
    <div className="tw:h-screen tw:overflow-hidden tw:flex tw:flex-col">
      <FlagshipMobileBar
        navOpened={navOpened}
        onToggleNav={toggleNav}
        onNavigate={closeNav}
        navId={NAV_ID}
        toggleRef={toggleRef}
      />

      <div className="tw:relative tw:flex tw:flex-1 tw:min-h-0">
        <div
          id={NAV_ID}
          className={cn(
            'tw:h-full tw:sm:static tw:sm:z-auto tw:sm:flex tw:sm:shadow-none',
            navOpened
              ? 'tw:absolute tw:inset-y-0 tw:left-0 tw:z-40 tw:flex tw:shadow-lg'
              : 'tw:hidden'
          )}
        >
          <FlagshipSidebar onNavigate={closeNav} />
        </div>
        {/* Scrim over the content while the drawer is open; a tap on it
            closes the drawer. Same overlay as the ui Sheet. */}
        {navOpened && (
          <div
            data-slot="flagship-nav-scrim"
            aria-hidden="true"
            onClick={closeNav}
            className="tw:absolute tw:inset-0 tw:z-30 tw:bg-black/50 tw:sm:hidden"
          />
        )}

        <main className="tw:flex-1 tw:min-w-0 tw:overflow-y-auto tw:overflow-x-hidden tw:p-[24px] tw:bg-gray-50">
          {children}
        </main>
        {/* The right plane: SidePanel portals its content here, so the
            panel is a real column of the shell — outside the scrolling
            content, full height by construction — rather than a
            floating box inside it. Empty (zero width) on pages
            without a companion. */}
        <div id={SIDE_PANEL_SLOT_ID} className="tw:shrink-0 tw:flex tw:h-full tw:bg-gray-50" />
      </div>
    </div>
  );
}
