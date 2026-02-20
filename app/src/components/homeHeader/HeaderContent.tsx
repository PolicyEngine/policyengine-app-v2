import { Burger, Container, Group } from '@mantine/core';
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
  navbarOpened,
  onToggleNavbar,
}: HeaderContentProps) {
  return (
    <Container
      h="100%"
      p={0}
      m={0}
      style={{
        width: '100%',
        maxWidth: '100%',
        marginInlineStart: 0,
        marginInlineEnd: 0,
      }}
    >
      <Group justify="space-between" h="100%">
        <Group>
          {onToggleNavbar && (
            <Burger
              opened={navbarOpened}
              onClick={onToggleNavbar}
              hiddenFrom="sm"
              size="sm"
              color={colors.text.inverse}
              aria-label="Toggle sidebar"
            />
          )}
          <HeaderLogo />
          <DesktopNavigation navItems={navItems} />
        </Group>

        <Group visibleFrom="lg">
          <HeaderActionButtons />
        </Group>

        <MobileMenu opened={opened} onOpen={onOpen} onClose={onClose} navItems={navItems} />
      </Group>
    </Container>
  );
}
