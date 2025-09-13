import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandYoutube,
} from '@tabler/icons-react';
import {
  Anchor,
  Box,
  Button,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import SidebarLogo from '@/components/sidebar/SidebarLogo';
import { colors, spacing, typography } from '@/designTokens';

export default function Footer() {
  return (
    <Box
      component="footer"
      w="100%"
      style={{ backgroundColor: colors.primary[500], padding: '3rem 4rem' }}
    >
      <Container size="2xl">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={spacing['4xl']}>
          {/* Left Section */}
          <Stack gap="2xl" align="flex-start">
            <SidebarLogo />

            <Stack gap="xs">
              <Anchor href="mailto:hello@policyengine.org" c="white" fz="md" underline="never">
                Email us
              </Anchor>
              <Anchor
                href="#"
                c={colors.white}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
              >
                About us
              </Anchor>
              <Anchor
                href="#"
                c={colors.white}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
              >
                Donate
              </Anchor>
              <Anchor
                href="#"
                c={colors.white}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
              >
                Privacy policy
              </Anchor>
              <Anchor
                href="#"
                c={colors.white}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
              >
                Terms and Conditions
              </Anchor>
              <Anchor
                href="#"
                c={colors.white}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
              >
                Developer tools
              </Anchor>
            </Stack>

            <Stack gap="md">
              <Group gap="md">
                {[
                  { icon: IconBrandTwitter, href: 'https://twitter.com/ThePolicyEngine' },
                  { icon: IconBrandFacebook, href: 'https://www.facebook.com/PolicyEngine' },
                  {
                    icon: IconBrandLinkedin,
                    href: 'https://www.linkedin.com/company/thepolicyengine',
                  },
                  { icon: IconBrandYoutube, href: 'https://www.youtube.com/@policyengine' },
                  { icon: IconBrandInstagram, href: 'https://www.instagram.com/PolicyEngine/' },
                  { icon: IconBrandGithub, href: 'https://github.com/PolicyEngine' },
                ].map(({ icon: Icon, href }, index) => (
                  <Anchor key={index} href={href} target="_blank">
                    <Box
                      p={6}
                      style={{
                        backgroundColor: colors.primary[900],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={18} color={colors.white} />
                    </Box>
                  </Anchor>
                ))}
              </Group>
              <Text fz="xs" c={colors.white} ff={typography.fontFamily.primary}>
                © {new Date().getFullYear()} PolicyEngine. All rights reserved.
              </Text>
            </Stack>
          </Stack>

          {/* Right Section */}
          <Stack gap="xs" pl="2xl">
            <Text fw={600} fz="h2" c={colors.white} ff={typography.fontFamily.primary}>
              Subscribe to PolicyEngine
            </Text>
            <Text fz="h5" c={colors.white} ff={typography.fontFamily.primary}>
              Get the latest posts delivered right to your inbox.
            </Text>
            <Stack gap="sm" w="80%" mt="20px">
              <TextInput
                placeholder="Enter your email address"
                size="md"
                ff={typography.fontFamily.primary}
                styles={{
                  input: { backgroundColor: colors.white, flex: 1 },
                }}
              />
              <Button color={colors.secondary[700]} size="md" ff={typography.fontFamily.primary}>
                SUBSCRIBE
              </Button>
            </Stack>
          </Stack>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
