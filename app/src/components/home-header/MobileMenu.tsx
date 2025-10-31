import { Anchor, Burger, Drawer, Group, Stack } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

interface NavLink {
  label: string;
  path?: string;
}

interface MobileMenuProps {
  opened: boolean;
  onOpen: () => void;
  onClose: () => void;
  navLinks: NavLink[];
  onNavClick: (path?: string) => void;
}

export default function MobileMenu({
  opened,
  onOpen,
  onClose,
  navLinks,
  onNavClick,
}: MobileMenuProps) {
  return (
    <>
      {/* Mobile Burger Menu */}
      <Group hiddenFrom="lg">
        <Burger opened={opened} onClick={onOpen} color={colors.text.inverse} size="sm" />
      </Group>

      {/* Mobile Drawer */}
      <Drawer
        opened={opened}
        onClose={onClose}
        position="right"
        size="sm"
        styles={{
          content: { backgroundColor: colors.primary[600] },
          header: { backgroundColor: colors.primary[600], borderBottom: 'none' },
        }}
        closeButtonProps={{ style: { color: colors.text.inverse }, size: 'md' }}
      >
        <Stack gap={spacing.lg} p={spacing.lg}>
          {navLinks.map((link) => (
            <Anchor
              key={link.label}
              c={colors.text.inverse}
              variant="subtle"
              td="none"
              fw={typography.fontWeight.medium}
              size="sm"
              onClick={() => onNavClick(link.path)}
            >
              {link.label}
            </Anchor>
          ))}
        </Stack>
      </Drawer>
    </>
  );
}
