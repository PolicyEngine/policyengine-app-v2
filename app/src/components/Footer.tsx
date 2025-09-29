import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandYoutube,
} from '@tabler/icons-react';
import { Anchor, Box, Container, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import FooterSubscribe from '@/components/FooterSubscribe';
import SidebarLogo from '@/components/sidebar/SidebarLogo';
import { colors, spacing, typography } from '@/designTokens';

const CONTACT_LINKS = {
  email: 'mailto:hello@policyengine.org',
  about: '#',
  donate: '#',
  privacy: '#',
  terms: '#',
  developerTools: '#',
};

const SOCIAL_LINKS = [
  { icon: IconBrandTwitter, href: 'https://twitter.com/ThePolicyEngine' },
  { icon: IconBrandFacebook, href: 'https://www.facebook.com/PolicyEngine' },
  { icon: IconBrandLinkedin, href: 'https://www.linkedin.com/company/thepolicyengine' },
  { icon: IconBrandYoutube, href: 'https://www.youtube.com/@policyengine' },
  { icon: IconBrandInstagram, href: 'https://www.instagram.com/PolicyEngine/' },
  { icon: IconBrandGithub, href: 'https://github.com/PolicyEngine' },
];

export default function Footer() {
  return (
    <Box
      component="footer"
      w="100%"
      style={{ backgroundColor: colors.primary[900], padding: '3rem 4rem' }}
    >
      <Container size="2xl">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={spacing['4xl']}>
          {/* Left Section */}
          <Stack gap="2xl" align="flex-start">
            <SidebarLogo />

            <Stack gap="xs">
              <Anchor href={CONTACT_LINKS.email} c={colors.white} fz="md" underline="never">
                Email us
              </Anchor>
              <Anchor
                href={CONTACT_LINKS.about}
                c={colors.white}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
              >
                About us
              </Anchor>
              <Anchor
                href={CONTACT_LINKS.donate}
                c={colors.white}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
              >
                Donate
              </Anchor>
              <Anchor
                href={CONTACT_LINKS.privacy}
                c={colors.white}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
              >
                Privacy policy
              </Anchor>
              <Anchor
                href={CONTACT_LINKS.terms}
                c={colors.white}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
              >
                Terms and conditions
              </Anchor>
              <Anchor
                href={CONTACT_LINKS.developerTools}
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
                {SOCIAL_LINKS.map(({ icon: Icon, href }, index) => (
                  <Anchor key={index} href={href} target="_blank">
                    <Box
                      p={6}
                      style={{
                        backgroundColor: colors.primary[500],
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
          <FooterSubscribe />
        </SimpleGrid>
      </Container>
    </Box>
  );
}
