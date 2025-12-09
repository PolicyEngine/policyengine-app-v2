/**
 * Footer - Editorial Site Footer
 *
 * A sophisticated, editorial-style footer with refined typography,
 * organized link sections, and elegant social icons.
 */

import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandYoutube,
  IconMail,
} from '@tabler/icons-react';
import { Anchor, Box, Container, SimpleGrid, Stack, Text } from '@mantine/core';
import type { CountryId } from '@/api/report';
import FooterSubscribe from '@/components/FooterSubscribe';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

const getContactLinks = (countryId: CountryId) => ({
  about: `/${countryId}/team`,
  donate: `/${countryId}/donate`,
  privacy: `/${countryId}/privacy`,
  terms: `/${countryId}/terms`,
  research: `/${countryId}/research`,
  supporters: `/${countryId}/supporters`,
});

const SOCIAL_LINKS = [
  { icon: IconBrandTwitter, href: 'https://twitter.com/ThePolicyEngine', label: 'Twitter' },
  { icon: IconBrandLinkedin, href: 'https://www.linkedin.com/company/thepolicyengine', label: 'LinkedIn' },
  { icon: IconBrandGithub, href: 'https://github.com/PolicyEngine', label: 'GitHub' },
  { icon: IconBrandYoutube, href: 'https://www.youtube.com/@policyengine', label: 'YouTube' },
  { icon: IconBrandFacebook, href: 'https://www.facebook.com/PolicyEngine', label: 'Facebook' },
  { icon: IconBrandInstagram, href: 'https://www.instagram.com/PolicyEngine/', label: 'Instagram' },
];

export default function Footer() {
  const countryId = useCurrentCountry();
  const CONTACT_LINKS = getContactLinks(countryId);

  return (
    <Box
      component="footer"
      style={{
        backgroundColor: colors.primary[900],
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent 0%, ${colors.primary[500]} 50%, transparent 100%)`,
          opacity: 0.5,
        }}
      />

      <Container size="xl" style={{ padding: `${spacing['5xl']} ${spacing['2xl']}` }}>
        {/* Top Section - Logo and Main Content */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={spacing['4xl']}>
          {/* Left Column */}
          <Box>
            {/* Logo */}
            <img
              src={PolicyEngineLogo}
              alt="PolicyEngine"
              style={{
                height: '32px',
                width: 'auto',
                marginBottom: spacing['2xl'],
              }}
            />

            {/* Tagline */}
            <Text
              style={{
                fontFamily: typography.fontFamily.primary,
                fontSize: typography.fontSize.lg,
                color: colors.white,
                opacity: 0.9,
                maxWidth: '340px',
                lineHeight: 1.5,
                marginBottom: spacing['3xl'],
              }}
            >
              Open-source tools for understanding tax and benefit policy.
            </Text>

            {/* Navigation Links */}
            <SimpleGrid cols={2} spacing={spacing.sm} style={{ maxWidth: '300px' }}>
              <FooterLink href={CONTACT_LINKS.about}>About Us</FooterLink>
              <FooterLink href={CONTACT_LINKS.research}>Research</FooterLink>
              <FooterLink href={CONTACT_LINKS.supporters}>Supporters</FooterLink>
              <FooterLink href={CONTACT_LINKS.donate}>Donate</FooterLink>
              <FooterLink href={CONTACT_LINKS.privacy}>Privacy</FooterLink>
              <FooterLink href={CONTACT_LINKS.terms}>Terms</FooterLink>
            </SimpleGrid>
          </Box>

          {/* Right Column - Newsletter */}
          <Box>
            <FooterSubscribe />
          </Box>
        </SimpleGrid>

        {/* Divider */}
        <Box
          style={{
            height: '1px',
            backgroundColor: colors.white,
            opacity: 0.1,
            margin: `${spacing['4xl']} 0`,
          }}
        />

        {/* Bottom Section */}
        <Box
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: spacing.xl,
          }}
        >
          {/* Copyright */}
          <Text
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: typography.fontSize.sm,
              color: colors.white,
              opacity: 0.5,
            }}
          >
            © {new Date().getFullYear()} PolicyEngine. All rights reserved.
          </Text>

          {/* Social Links */}
          <Stack gap={spacing.md} align="flex-end">
            <Box
              style={{
                display: 'flex',
                gap: spacing.lg,
                alignItems: 'center',
              }}
            >
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <Anchor
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: spacing.radius.lg,
                    backgroundColor: `${colors.white}10`,
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary[600];
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${colors.white}10`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Icon size={18} color={colors.white} style={{ opacity: 0.9 }} />
                </Anchor>
              ))}
            </Box>

            {/* Contact Email */}
            <Anchor
              href="mailto:hello@policyengine.org"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                fontFamily: typography.fontFamily.primary,
                fontSize: typography.fontSize.sm,
                color: colors.white,
                opacity: 0.6,
                textDecoration: 'none',
                transition: 'opacity 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6';
              }}
            >
              <IconMail size={16} />
              hello@policyengine.org
            </Anchor>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Anchor
      href={href}
      style={{
        fontFamily: typography.fontFamily.primary,
        fontSize: typography.fontSize.sm,
        color: colors.white,
        opacity: 0.7,
        textDecoration: 'none',
        padding: `${spacing.xs} 0`,
        transition: 'opacity 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.7';
      }}
    >
      {children}
    </Anchor>
  );
}
