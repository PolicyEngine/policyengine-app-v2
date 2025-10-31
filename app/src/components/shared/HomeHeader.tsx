import { IconChevronDown } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor,
  Box,
  Burger,
  Button,
  Container,
  Drawer,
  Group,
  Menu,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { motion, useScroll, useTransform } from 'framer-motion';
import PolicyEngineLogo from '@/assets/policyengine-logo.svg';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

interface NavLink {
  label: string;
  path?: string;
}

export default function HeaderNavigation() {
  const [opened, { open, close }] = useDisclosure(false);
  const navigate = useNavigate();
  const countryId = useCurrentCountry();
  const { scrollY } = useScroll();

  // Smooth scroll-linked animations
  // Maps scroll position 0-50px to smooth transitions
  const marginTop = useTransform(scrollY, [0, 50], ['32px', '0px']);
  const width = useTransform(scrollY, [0, 50], ['85%', '100%']);
  const borderRadius = useTransform(scrollY, [0, 50], ['8px', '0px']);

  const navLinks: NavLink[] = [
    { label: 'Research', path: `/${countryId}/research` },
    { label: 'About', path: `/${countryId}/about` },
    { label: 'Donate', path: `/${countryId}/donate` },
  ];

  const learnLinks: NavLink[] = [
    { label: 'AI & ML' },
    { label: 'API' },
    { label: 'Microsimulation' },
    { label: 'Benefit Access' },
    { label: 'Educational Use' },
    { label: 'Open Source' },
  ];

  const handleNavClick = (path?: string) => {
    if (path) {
      navigate(path);
      close();
    }
  };

  return (
    <motion.div
      style={{
        position: 'sticky',
        top: 0,
        marginTop,
        marginLeft: 'auto',
        marginRight: 'auto',
        width,
        borderRadius,
        paddingLeft: spacing['2xl'],
        paddingRight: spacing['2xl'],
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        height: spacing.layout.header,
        backgroundColor: colors.primary[600],
        borderBottom: `0.5px solid ${colors.border.dark}`,
        boxShadow: `
          0px 2px 4px -1px rgba(0, 0, 0, 0.06),
          0px 4px 6px -1px rgba(0, 0, 0, 0.10)
        `,
        zIndex: 1000,
        fontFamily: typography.fontFamily.primary,
        opacity: opened ? 0 : 1,
        transition: 'opacity 0.1s ease',
      }}
    >
      <Container size="xl" h="100%">
        <Group justify="space-between" h="100%">
          <Group>
            {/* Logo and Main Navigation*/}
            <Box mr={spacing.md} style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={PolicyEngineLogo}
                alt="PolicyEngine"
                style={{
                  height: spacing['3xl'],
                  width: 'auto',
                  marginRight: 12,
                }}
              />
            </Box>

            <Group gap={spacing['3xl']} visibleFrom="lg">
              {navLinks.map((link) => (
                <Anchor
                  key={link.label}
                  c={colors.text.inverse}
                  variant="subtle"
                  td="none"
                  fw={typography.fontWeight.medium}
                  size="md"
                  onClick={() => handleNavClick(link.path)}
                >
                  {link.label}
                </Anchor>
              ))}

              <Menu shadow="md" width={200} zIndex={1001} position="bottom" offset={10}>
                <Menu.Target>
                  <UnstyledButton>
                    <Group gap={4}>
                      <Text c={colors.text.inverse} fw={typography.fontWeight.medium} size="md">
                        Learn
                      </Text>
                      <IconChevronDown size={16} color={colors.text.inverse} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  {learnLinks.map((link) => (
                    <Menu.Item key={link.label}>{link.label}</Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>

          {/* Action Buttons */}
          <Group gap={spacing.sm} visibleFrom="lg">
            <Button
              style={{ backgroundColor: colors.warning, borderRadius: spacing.radius.md }}
              c={colors.text.primary}
              fw={typography.fontWeight.semibold}
              size="sm"
            >
              Sign Up
            </Button>
          </Group>

          {/* Mobile Burger Menu */}
          <Group hiddenFrom="lg">
            <Burger opened={opened} onClick={open} color={colors.text.inverse} size="sm" />
          </Group>
        </Group>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
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
              onClick={() => handleNavClick(link.path)}
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
                <Text key={link.label} c={colors.text.inverse} size="sm" onClick={close}>
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
              onClick={close}
            >
              Sign Up
            </Button>
          </Box>
        </Stack>
      </Drawer>
    </motion.div>
  );
}
