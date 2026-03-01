import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandYoutube,
  IconMail,
} from '@tabler/icons-react';
import type { CountryId } from '@/api/report';
import FooterSubscribe from '@/components/FooterSubscribe';
import { Container, Stack } from '@/components/ui';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { trackContactClicked } from '@/utils/analytics';

const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

const getContactLinks = (countryId: CountryId) => ({
  about: `/${countryId}/team`,
  donate: `/${countryId}/donate`,
  privacy: `/${countryId}/privacy`,
  terms: `/${countryId}/terms`,
});

const SOCIAL_LINKS = [
  { icon: IconMail, href: 'mailto:hello@policyengine.org', label: 'Email' },
  { icon: IconBrandTwitter, href: 'https://twitter.com/ThePolicyEngine', label: 'Twitter' },
  { icon: IconBrandFacebook, href: 'https://www.facebook.com/PolicyEngine', label: 'Facebook' },
  {
    icon: IconBrandLinkedin,
    href: 'https://www.linkedin.com/company/thepolicyengine',
    label: 'LinkedIn',
  },
  { icon: IconBrandYoutube, href: 'https://www.youtube.com/@policyengine', label: 'YouTube' },
  {
    icon: IconBrandInstagram,
    href: 'https://www.instagram.com/PolicyEngine/',
    label: 'Instagram',
  },
  { icon: IconBrandGithub, href: 'https://github.com/PolicyEngine', label: 'GitHub' },
];

export default function Footer() {
  const countryId = useCurrentCountry();
  const CONTACT_LINKS = getContactLinks(countryId);
  return (
    <footer
      className="tw:w-full tw:bg-primary-900"
      style={{ padding: `${spacing['4xl']} ${spacing['5xl']}` }}
    >
      <Container size="2xl">
        <img src={PolicyEngineLogo} alt="PolicyEngine" className="tw:h-[52px] tw:w-auto" />
        <div
          className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:mt-8"
          style={{ gap: spacing['4xl'] }}
        >
          <Stack gap="2xl" align="start">
            <Stack gap="xs">
              {[
                { href: CONTACT_LINKS.about, text: 'About us' },
                { href: CONTACT_LINKS.donate, text: 'Donate' },
                { href: CONTACT_LINKS.privacy, text: 'Privacy policy' },
                { href: CONTACT_LINKS.terms, text: 'Terms and conditions' },
              ].map(({ href, text }) => (
                <a
                  key={href}
                  href={href}
                  className="tw:text-white tw:text-base tw:no-underline tw:font-sans"
                >
                  {text}
                </a>
              ))}
            </Stack>

            <Stack gap="md">
              <div className="tw:flex tw:flex-row tw:items-center tw:gap-3">
                {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="tw:text-white"
                    onClick={href.startsWith('mailto:') ? trackContactClicked : undefined}
                  >
                    <Icon size={24} />
                  </a>
                ))}
              </div>
              <p className="tw:text-xs tw:text-white tw:m-0 tw:font-sans">
                &copy; {new Date().getFullYear()} PolicyEngine. All rights reserved.
              </p>
            </Stack>
          </Stack>

          <FooterSubscribe />
        </div>
      </Container>
    </footer>
  );
}
