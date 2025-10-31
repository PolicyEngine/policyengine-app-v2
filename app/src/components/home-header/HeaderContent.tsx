import { Container, Group } from '@mantine/core';
import DesktopNavigation from './DesktopNavigation';
import HeaderActionButtons from './HeaderActionButtons';
import HeaderLogo from './HeaderLogo';
import MobileMenu from './MobileMenu';

interface NavLink {
  label: string;
  path?: string;
}

interface HeaderContentProps {
  opened: boolean;
  onOpen: () => void;
  onClose: () => void;
  navLinks: NavLink[];
  learnLinks: NavLink[];
  onNavClick: (path?: string) => void;
}

export default function HeaderContent({
  opened,
  onOpen,
  onClose,
  navLinks,
  learnLinks,
  onNavClick,
}: HeaderContentProps) {
  return (
    <Container size="xl" h="100%">
      <Group justify="space-between" h="100%">
        <Group>
          <HeaderLogo />
          <DesktopNavigation navLinks={navLinks} learnLinks={learnLinks} onNavClick={onNavClick} />
        </Group>

        <HeaderActionButtons />

        <MobileMenu
          opened={opened}
          onOpen={onOpen}
          onClose={onClose}
          navLinks={navLinks}
          learnLinks={learnLinks}
          onNavClick={onNavClick}
        />
      </Group>
    </Container>
  );
}
