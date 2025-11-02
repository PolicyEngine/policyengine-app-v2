import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandYoutube,
} from '@tabler/icons-react';
import { Anchor, Box, Container, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import type { CountryId } from '@/api/report';
import PolicyEngineLogo from '@/assets/policyengine-logo.svg';
import FooterSubscribe from '@/components/FooterSubscribe';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const getContactLinks = (countryId: CountryId) => ({
  email: 'mailto:hello@policyengine.org',
  about: `/${countryId}/team`,
  donate: `/${countryId}/donate`,
  privacy: `/${countryId}/privacy`,
  terms: `/${countryId}/terms`,
  // TODO: Add developer-tools page once it's built out
  // developerTools: `/${countryId}/developer-tools`,
});

const SOCIAL_LINKS = [
  { icon: IconBrandTwitter, href: 'https://twitter.com/ThePolicyEngine' },
  { icon: IconBrandFacebook, href: 'https://www.facebook.com/PolicyEngine' },
  { icon: IconBrandLinkedin, href: 'https://www.linkedin.com/company/thepolicyengine' },
  { icon: IconBrandYoutube, href: 'https://www.youtube.com/@policyengine' },
  { icon: IconBrandInstagram, href: 'https://www.instagram.com/PolicyEngine/' },
  { icon: IconBrandGithub, href: 'https://github.com/PolicyEngine' },
];

export default function Footer() {
  const countryId = useCurrentCountry();
  const CONTACT_LINKS = getContactLinks(countryId);
  return (
    <Box
      component="footer"
      w="100%"
      style={{ backgroundColor: colors.primary[900], padding: '3rem 4rem' }}
    >
      <Container size="2xl">
        <img
          src={PolicyEngineLogo}
          alt="PolicyEngine"
          style={{
            height: 52,
            width: 'auto',
          }}
        />
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={spacing['4xl']} mt="2rem">
          {/* Left Section */}
          <Stack gap="2xl" align="flex-start">
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
                Terms and Conditions
              </Anchor>
              {/* TODO: Uncomment when developer-tools page is built
              <Anchor
                href={CONTACT_LINKS.developerTools}
                c={colors.white}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
              >
                Developer tools
              </Anchor>
              */}
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
