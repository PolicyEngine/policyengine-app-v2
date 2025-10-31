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
  onNavClick: (path?: string) => void;
}

export default function HeaderContent({
  opened,
  onOpen,
  onClose,
  navLinks,
  onNavClick,
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
          <HeaderLogo />
          <DesktopNavigation navLinks={navLinks} onNavClick={onNavClick} />
        </Group>

        <HeaderActionButtons />

        <MobileMenu
          opened={opened}
          onOpen={onOpen}
          onClose={onClose}
          navLinks={navLinks}
          onNavClick={onNavClick}
        />
      </Group>
    </Container>
  );
}
