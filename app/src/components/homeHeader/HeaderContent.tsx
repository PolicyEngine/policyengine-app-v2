import { IconDotsVertical } from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { colors } from '@/designTokens';
import DesktopNavigation from './DesktopNavigation';
import HeaderActionButtons from './HeaderActionButtons';
import HeaderLogo from './HeaderLogo';
import MobileMenu from './MobileMenu';
import { NavItemSetup } from './NavItem';

interface HeaderContentProps {
  opened: boolean;
  onOpen: () => void;
  onClose: () => void;
  navItems: NavItemSetup[];
  navbarOpened?: boolean;
  onToggleNavbar?: () => void;
}

export default function HeaderContent({
  opened,
  onOpen,
  onClose,
  navItems,
  navbarOpened: _navbarOpened,
  onToggleNavbar,
}: HeaderContentProps) {
  return (
    <div className="tw:h-full tw:w-full tw:p-0 tw:m-0">
      <div className="tw:flex tw:justify-between tw:items-center tw:h-full">
        <div className="tw:flex tw:items-center">
          {onToggleNavbar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleNavbar}
              className="sm:tw:hidden"
              aria-label="Toggle sidebar"
              style={{ color: colors.text.inverse }}
            >
              <IconDotsVertical size={20} />
            </Button>
          )}
          <HeaderLogo />
          <DesktopNavigation navItems={navItems} />
        </div>

        <div className="tw:hidden lg:tw:flex tw:items-center">
          <HeaderActionButtons />
        </div>

        <MobileMenu opened={opened} onOpen={onOpen} onClose={onClose} navItems={navItems} />
      </div>
    </div>
  );
}
