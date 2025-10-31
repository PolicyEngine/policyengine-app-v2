import { Anchor, Box, Burger, Button, Drawer, Group, Stack, Text } from '@mantine/core';
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
  learnLinks: NavLink[];
  onNavClick: (path?: string) => void;
}

export default function MobileMenu({
  opened,
  onOpen,
  onClose,
  navLinks,
  learnLinks,
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

          <Box>
            <Text c={colors.text.inverse} fw={typography.fontWeight.semibold} mb={spacing.sm}>
              Learn
            </Text>

            <Stack gap={spacing.xs} ml={spacing.md}>
              {learnLinks.map((link) => (
                <Text key={link.label} c={colors.text.inverse} size="sm" onClick={onClose}>
                  {link.label}
                </Text>
              ))}
            </Stack>
          </Box>

          <Box pt={spacing.lg} style={{ borderTop: `1px solid ${colors.border.light}` }}>
            <Button
              style={{ backgroundColor: colors.warning, borderRadius: spacing.radius.md }}
              c={colors.text.primary}
              fw={typography.fontWeight.semibold}
              mb={spacing.sm}
              fullWidth
              onClick={onClose}
            >
              Sign Up
            </Button>
          </Box>
        </Stack>
      </Drawer>
    </>
  );
}
