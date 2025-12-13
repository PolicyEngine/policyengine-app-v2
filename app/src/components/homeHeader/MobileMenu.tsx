import { Anchor, Box, Burger, Drawer, Group, Stack, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import CountrySelector from './CountrySelector';
import { NavItemSetup } from './NavItem';

interface MobileMenuProps {
  opened: boolean;
  onOpen: () => void;
  onClose: () => void;
  navItems: NavItemSetup[];
}

export default function MobileMenu({ opened, onOpen, onClose, navItems }: MobileMenuProps) {
  return (
    <>
      {/* Mobile Burger Menu with Country Selector */}
      <Group hiddenFrom="lg" gap={spacing.md}>
        <CountrySelector />
        <Burger opened={opened} onClick={onOpen} color={colors.header.text} size="sm" />
      </Group>

      {/* Mobile Drawer */}
      <Drawer
        opened={opened}
        onClose={onClose}
        position="right"
        size="sm"
        styles={{
          content: { backgroundColor: colors.header.bg },
          header: { backgroundColor: colors.header.bg, borderBottom: 'none' },
        }}
        closeButtonProps={{ style: { color: colors.header.text }, size: 'md' }}
      >
        <Stack gap={spacing.lg} p={spacing.lg}>
          {navItems.map((item) =>
            item.hasDropdown && item.dropdownItems ? (
              // Render dropdown as a section
              <Box key={item.label}>
                <Text
                  c={colors.header.text}
                  fw={typography.fontWeight.medium}
                  size="sm"
                  mb={spacing.xs}
                  style={{ fontFamily: typography.fontFamily.primary }}
                >
                  {item.label}
                </Text>
                <Stack gap={spacing.xs} pl={spacing.md}>
                  {item.dropdownItems.map((dropdownItem) => (
                    <Anchor
                      key={dropdownItem.label}
                      c={colors.header.text}
                      variant="subtle"
                      td="none"
                      fw={typography.fontWeight.normal}
                      size="sm"
                      onClick={dropdownItem.onClick}
                      style={{ fontFamily: typography.fontFamily.primary }}
                    >
                      {dropdownItem.label}
                    </Anchor>
                  ))}
                </Stack>
              </Box>
            ) : (
              // Render regular link
              <Anchor
                key={item.label}
                c={colors.header.text}
                variant="subtle"
                td="none"
                fw={typography.fontWeight.medium}
                size="sm"
                onClick={item.onClick}
                style={{ fontFamily: typography.fontFamily.primary }}
                display="block"
              >
                {item.label}
              </Anchor>
            )
          )}
        </Stack>
      </Drawer>
    </>
  );
}
