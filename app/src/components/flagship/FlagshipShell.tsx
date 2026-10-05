import FlagshipTopBar from './FlagshipTopBar';
import { SIDE_PANEL_SLOT_ID } from './SidePanel';

interface FlagshipShellProps {
  children: React.ReactNode;
}

/**
 * The flagship shell: a slim top bar (brand, sections, website links)
 * over the content area and the right plane for side panels. The bar
 * is the same on every viewport, so content always has the full width.
 */
export default function FlagshipShell({ children }: FlagshipShellProps) {
  return (
    <div className="tw:h-screen tw:overflow-hidden tw:flex tw:flex-col">
      <FlagshipTopBar />

      <div className="tw:flex tw:flex-1 tw:min-h-0">
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
