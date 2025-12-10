import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandYoutube,
  IconMail,
} from '@tabler/icons-react';
import { Anchor, Box, Container, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import type { CountryId } from '@/api/report';
import FooterSubscribe from '@/components/FooterSubscribe';
import { spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

const getContactLinks = (countryId: CountryId) => ({
  about: `/${countryId}/team`,
  donate: `/${countryId}/donate`,
  privacy: `/${countryId}/privacy`,
  terms: `/${countryId}/terms`,
});

const SOCIAL_LINKS = [
  { icon: IconMail, href: 'mailto:hello@policyengine.org' },
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
      style={{
        background: 'linear-gradient(180deg, #0d2b2a 0%, #0a1f1e 100%)',
        padding: '3rem 4rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient orb */}
      <Box
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(79, 209, 197, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <Container size="2xl" style={{ position: 'relative', zIndex: 1 }}>
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
              <Anchor
                href={CONTACT_LINKS.about}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#4FD1C5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                About us
              </Anchor>
              <Anchor
                href={CONTACT_LINKS.donate}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#4FD1C5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                Donate
              </Anchor>
              <Anchor
                href={CONTACT_LINKS.privacy}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#4FD1C5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                Privacy policy
              </Anchor>
              <Anchor
                href={CONTACT_LINKS.terms}
                fz="md"
                underline="never"
                ff={typography.fontFamily.primary}
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#4FD1C5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                Terms and conditions
              </Anchor>
            </Stack>

            <Stack gap="md">
              <Group gap="md">
                {SOCIAL_LINKS.map(({ icon: Icon, href }, index) => (
                  <Anchor
                    key={index}
                    href={href}
                    target="_blank"
                    style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#4FD1C5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                    }}
                  >
                    <Icon size={24} />
                  </Anchor>
                ))}
              </Group>
              <Text
                fz="xs"
                ff={typography.fontFamily.primary}
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
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
