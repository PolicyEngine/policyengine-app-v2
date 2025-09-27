import React from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import {
  Anchor,
  Box,
  Burger,
  Button,
  ButtonProps,
  Container,
  Drawer,
  Group,
  Menu,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import PolicyEngineLogo from '@/assets/policyengine-logo.svg';
import { colors, spacing, typography } from '@/designTokens';

type ActionButtonProps = ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

const ActionButton: React.FC<ActionButtonProps> = (props) => (
  <Button
    variant="subtle"
    size="sm"
    fw={typography.fontWeight.medium}
    c={colors.text.inverse}
    {...props}
  />
);

const HeaderNavigation: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false);

  const links = ['Research', 'About', 'Donate'];

  return (
    <Box
      px={{ xs: spacing.md, sm: spacing['2xl'] }}
      py={spacing.sm}
      style={{
        position: 'absolute',
        top: spacing['3xl'],
        left: '50%',
        transform: 'translateX(-50%)',
        width: '85%',
        height: spacing.layout.header,
        backgroundColor: colors.primary[600],
        borderRadius: spacing.radius.lg,
        borderBottom: `0.5px solid ${colors.border.dark}`,
        boxShadow: `
          0px 2px 4px -1px rgba(0, 0, 0, 0.06),
          0px 4px 6px -1px rgba(0, 0, 0, 0.10)
        `,
        zIndex: 1000,
        fontFamily: typography.fontFamily.primary,
        pointerEvents: opened ? 'none' : 'auto',
        opacity: opened ? 0 : 1,
        transition: 'opacity 0.2s ease',
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
              {links.map((label) => (
                <Anchor
                  key={label}
                  c={colors.text.inverse}
                  variant="subtle"
                  td="none"
                  fw={typography.fontWeight.medium}
                  size="sm"
                >
                  {label}
                </Anchor>
              ))}

              <Menu shadow="md" width={200} zIndex={1001} position="bottom" offset={10}>
                <Menu.Target>
                  <UnstyledButton>
                    <Group gap={4}>
                      <Text c={colors.text.inverse} fw={typography.fontWeight.medium} size="sm">
                        Learn
                      </Text>
                      <IconChevronDown size={16} color={colors.text.inverse} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  {[
                    'AI & ML',
                    'API',
                    'Microsimulation',
                    'Benefit Access',
                    'Educational Use',
                    'Open Source',
                  ].map((item) => (
                    <Menu.Item key={item}>{item}</Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>

          {/* Action Buttons */}
          <Group gap={spacing.sm} visibleFrom="lg">
            <ActionButton>Book Demo</ActionButton>
            <ActionButton>Log In</ActionButton>
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
          {links.map((label) => (
            <Anchor
              key={label}
              c={colors.text.inverse}
              td="none"
              fw={typography.fontWeight.medium}
              onClick={close}
            >
              {label}
            </Anchor>
          ))}

          <Box>
            <Text c={colors.text.inverse} fw={typography.fontWeight.semibold} mb={spacing.sm}>
              Learn
            </Text>
            <Stack gap={spacing.xs} ml={spacing.md}>
              {[
                'AI & ML',
                'API',
                'Microsimulation',
                'Benefit Access',
                'Educational Use',
                'Open Source',
              ].map((item) => (
                <Text key={item} c={colors.text.inverse} size="sm" onClick={close}>
                  {item}
                </Text>
              ))}
            </Stack>
          </Box>

          <Box pt={spacing.lg} style={{ borderTop: `1px solid ${colors.border.light}` }}>
            <ActionButton fullWidth mb={spacing.sm} onClick={close}>
              Book Demo
            </ActionButton>
            <ActionButton fullWidth mb={spacing.sm} onClick={close}>
              Log In
            </ActionButton>
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
    </Box>
  );
};

export default HeaderNavigation;
