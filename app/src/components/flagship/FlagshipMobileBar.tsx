import { IconMenu2, IconX } from '@tabler/icons-react';
import { colors, spacing } from '@/designTokens';
import FlagshipBrand from './FlagshipBrand';

interface FlagshipMobileBarProps {
  navOpened: boolean;
  onToggleNav: () => void;
  onNavigate: () => void;
  /** Id of the drawer the toggle opens, for aria-controls. */
  navId: string;
  toggleRef?: React.Ref<HTMLButtonElement>;
}

/**
 * The flagship shell's top bar on narrow viewports, where the sidebar
 * folds into a drawer: the toggle that opens it, and the brand. Hidden
 * from the sm breakpoint up, where the sidebar is a persistent column.
 */
export default function FlagshipMobileBar({
  navOpened,
  onToggleNav,
  onNavigate,
  navId,
  toggleRef,
}: FlagshipMobileBarProps) {
  const ToggleIcon = navOpened ? IconX : IconMenu2;

  return (
    <div
      className="tw:flex tw:sm:hidden tw:shrink-0 tw:items-center tw:border-b tw:border-border-light tw:bg-gray-50"
      style={{ gap: spacing.xs, padding: spacing.sm }}
    >
      <button
        ref={toggleRef}
        type="button"
        onClick={onToggleNav}
        aria-label={navOpened ? 'Close navigation' : 'Open navigation'}
        aria-expanded={navOpened}
        aria-controls={navId}
        className="tw:flex tw:items-center tw:justify-center tw:border-none tw:bg-transparent tw:cursor-pointer"
        style={{ padding: spacing.sm, borderRadius: spacing.radius.container }}
      >
        <ToggleIcon size={20} color={colors.text.primary} />
      </button>
      <FlagshipBrand onNavigate={onNavigate} style={{ padding: spacing.xs }} />
    </div>
  );
}
