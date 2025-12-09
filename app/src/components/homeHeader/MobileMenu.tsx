/**
 * MobileMenu - Editorial Mobile Navigation
 *
 * Full-screen mobile menu with elegant transitions
 * and sophisticated typography.
 */

import { IconArrowRight, IconX } from '@tabler/icons-react';
import { ActionIcon, Box, Drawer, Stack, Text, UnstyledButton } from '@mantine/core';
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
      <Box
        hiddenFrom="lg"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <CountrySelector />
        <UnstyledButton
          onClick={onOpen}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: 40,
            height: 40,
            gap: 5,
          }}
          aria-label="Open navigation menu"
        >
          <span
            style={{
              width: 22,
              height: 2,
              backgroundColor: colors.white,
              borderRadius: 1,
              transition: 'transform 200ms ease',
            }}
          />
          <span
            style={{
              width: 22,
              height: 2,
              backgroundColor: colors.white,
              borderRadius: 1,
              transition: 'transform 200ms ease',
            }}
          />
        </UnstyledButton>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        opened={opened}
        onClose={onClose}
        position="right"
        size="100%"
        withCloseButton={false}
        styles={{
          content: {
            background: `linear-gradient(180deg, ${colors.primary[800]} 0%, ${colors.primary[900]} 100%)`,
          },
          body: {
            padding: 0,
            height: '100%',
          },
        }}
      >
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: spacing['2xl'],
          }}
        >
          {/* Header with close button */}
          <Box
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: spacing['4xl'],
            }}
          >
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={onClose}
              style={{
                color: colors.white,
                opacity: 0.8,
                transition: 'opacity 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
            >
              <IconX size={28} />
            </ActionIcon>
          </Box>

          {/* Navigation Items */}
          <Stack gap={spacing.xl} style={{ flex: 1 }}>
            {navItems.map((item) =>
              item.hasDropdown && item.dropdownItems ? (
                <Box key={item.label}>
                  <Text
                    style={{
                      color: colors.white,
                      opacity: 0.5,
                      fontFamily: typography.fontFamily.primary,
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                      letterSpacing: typography.letterSpacing.widest,
                      textTransform: 'uppercase',
                      marginBottom: spacing.md,
                    }}
                  >
                    {item.label}
                  </Text>
                  <Stack gap={spacing.md} pl={spacing.sm}>
                    {item.dropdownItems.map((dropdownItem) => (
                      <MobileNavItem
                        key={dropdownItem.label}
                        label={dropdownItem.label}
                        onClick={() => {
                          dropdownItem.onClick();
                          onClose();
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              ) : (
                <MobileNavItem
                  key={item.label}
                  label={item.label}
                  onClick={() => {
                    item.onClick();
                    onClose();
                  }}
                />
              )
            )}
          </Stack>

          {/* Footer */}
          <Box style={{ paddingTop: spacing['3xl'] }}>
            <Text
              style={{
                color: colors.white,
                opacity: 0.4,
                fontFamily: typography.fontFamily.primary,
                fontSize: typography.fontSize.sm,
              }}
            >
              PolicyEngine
            </Text>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

function MobileNavItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <UnstyledButton
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing.md} 0`,
        borderBottom: `1px solid ${colors.white}10`,
        transition: 'opacity 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.7';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
    >
      <Text
        style={{
          color: colors.white,
          fontFamily: typography.fontFamily.display,
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.medium,
          letterSpacing: typography.letterSpacing.tight,
        }}
      >
        {label}
      </Text>
      <IconArrowRight
        size={20}
        color={colors.white}
        style={{ opacity: 0.5 }}
      />
    </UnstyledButton>
  );
}
