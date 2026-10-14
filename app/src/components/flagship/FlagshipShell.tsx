import FlagshipTopBar from './FlagshipTopBar';
import { SIDE_PANEL_SLOT_ID } from './SidePanel';

interface FlagshipShellProps {
  children: React.ReactNode;
}

/**
 * On a phone, the shared controls — buttons (also those with a tooltip),
 * inputs, selects, tabs and the buttons that open a menu or a picker —
 * are at least 40px tall, the size of a fingertip, and an icon button as
 * wide. A segmented control's options are as tall. Wider screens keep
 * each control's own size.
 */
const PHONE_TOUCH_TARGETS = [
  'tw:max-sm:[&_:is([data-slot=button],button[data-slot=tooltip-trigger],[data-slot=input],[data-slot=select-trigger],[data-slot=tabs-trigger],button[aria-haspopup])]:min-h-10',
  'tw:max-sm:[&_:is([data-slot=button],button[data-slot=tooltip-trigger])]:min-w-10',
  'tw:max-sm:[&_[data-slot=segmented-control]]:h-12',
].join(' ');

/**
 * The flagship shell: a slim top bar (brand, sections, website links)
 * over the content area and the right plane for side panels. The bar
 * stays one slim row on every viewport, so content always has the full
 * width. On a phone the plane moves under the content, where a side
 * panel keeps a slim bar across the bottom (see SidePanel).
 */
export default function FlagshipShell({ children }: FlagshipShellProps) {
  return (
    <div className={`tw:h-dvh tw:overflow-hidden tw:flex tw:flex-col ${PHONE_TOUCH_TARGETS}`}>
      <FlagshipTopBar />

      <div className="tw:flex tw:flex-1 tw:min-h-0 tw:max-sm:flex-col">
        <main className="tw:flex-1 tw:min-w-0 tw:min-h-0 tw:overflow-y-auto tw:overflow-x-hidden tw:p-[16px] tw:sm:p-[24px] tw:bg-gray-50">
          {children}
        </main>
        {/* The right plane: SidePanel portals its content here, so the
            panel is a real column of the shell — outside the scrolling
            content, full height by construction — rather than a
            floating box inside it. Empty (zero width) on pages
            without a companion. */}
        <div
          id={SIDE_PANEL_SLOT_ID}
          className="tw:shrink-0 tw:flex tw:h-full tw:max-sm:h-auto tw:bg-gray-50"
        />
      </div>
    </div>
  );
}
