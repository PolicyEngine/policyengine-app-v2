"use client";

import { useState } from 'react';
import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandYoutube,
  IconMail,
} from '@tabler/icons-react';
import jsonp from 'jsonp';
import { Button, Container, Input, Spinner, Stack } from '@/components/ui';
import { colors, spacing, typography } from '@policyengine/design-system/tokens';
import { cn } from '@/lib/utils';
import { useCountryId } from '@/hooks/useCountryId';

/* ── GA4 helpers (inlined; no app-only deps) ── */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

function trackContactClicked() {
  trackEvent('contact_clicked');
}

function trackNewsletterSignup() {
  trackEvent('newsletter_signup');
}

/* ── Mailchimp helper (inlined; uses jsonp from deps) ── */

interface SubscriptionResult {
  isSuccessful: boolean;
  message: string;
}

const MAILCHIMP_URL =
  'https://policyengine.us5.list-manage.com/subscribe/post-json?u=e5ad35332666289a0f48013c5&id=71ed1f89d8&f_id=00f173e6f0';

function submitToMailchimp(email: string): Promise<SubscriptionResult> {
  return new Promise((resolve, reject) => {
    const encodedEmail = encodeURIComponent(email);
    jsonp(`${MAILCHIMP_URL}&EMAIL=${encodedEmail}`, { param: 'c' }, (error, data) => {
      if (error) {
        reject(
          new Error('There was an issue processing your subscription; please try again later.')
        );
        return;
      }

      if (data) {
        const { msg } = data;
        resolve({
          isSuccessful: data.result !== 'error',
          message: msg,
        });
      }
    });
  });
}

/* ── Constants ── */

const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

const getContactLinks = (countryId: string) => ({
  about: `/${countryId}/team`,
  donate: `/${countryId}/donate`,
  devTools: `/${countryId}/dev-tools`,
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

/* ── FooterSubscribe ── */

function FooterSubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async () => {
    if (!email) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const result = await submitToMailchimp(email);
      if (result.isSuccessful) {
        trackNewsletterSignup();
        setStatus('success');
        setMessage(result.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'There was an issue processing your subscription; please try again later.'
      );
    }
  };

  return (
    <Stack gap="xs" className="tw:pl-6">
      <p
        className="tw:font-semibold tw:text-white tw:font-sans tw:m-0"
        style={{ fontSize: typography.fontSize['2xl'] }}
      >
        Subscribe to PolicyEngine
      </p>
      <p className="tw:text-lg tw:text-white tw:font-sans tw:m-0">
        Get the latest posts delivered right to your inbox.
      </p>
      <Stack gap="sm" className="tw:mt-5" style={{ width: '80%' }}>
        <Input
          placeholder="Enter your email address"
          className="tw:bg-white tw:w-full"
          style={{ height: spacing.component.input.height }}
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          disabled={status === 'loading'}
        />
        <Button
          onClick={handleSubscribe}
          disabled={status === 'loading'}
          size="lg"
          className="tw:bg-primary-500 tw:text-white tw:hover:bg-primary-400 tw:w-full tw:font-semibold tw:tracking-wider"
          style={{ height: spacing.component.input.height }}
        >
          {status === 'loading' ? <Spinner size="sm" /> : null}
          SUBSCRIBE
        </Button>
        {message && (
          <p
            className={cn(
              'tw:text-sm tw:text-center tw:font-sans tw:m-0',
              status === 'success' ? 'tw:text-green-400' : 'tw:text-red-400'
            )}
          >
            {message}
          </p>
        )}
      </Stack>
    </Stack>
  );
}

/* ── Footer ── */

export default function Footer() {
  const countryId = useCountryId();
  const CONTACT_LINKS = getContactLinks(countryId);
  return (
    <footer
      data-testid="site-footer"
      className="tw:w-full"
      style={{
        padding: `${spacing['4xl']} ${spacing['5xl']}`,
        background: `linear-gradient(to right, ${colors.primary[800]}, ${colors.primary[600]})`,
      }}
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
                { href: CONTACT_LINKS.devTools, text: 'Developer tools' },
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
