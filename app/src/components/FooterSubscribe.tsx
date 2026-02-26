import { useState } from 'react';
import { Button, Input, Spinner, Stack } from '@/components/ui';
import { cn } from '@/lib/utils';
import { trackNewsletterSignup } from '@/utils/analytics';
import { submitToMailchimp } from '@/utils/mailchimpSubscription';

export default function FooterSubscribe() {
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
        style={{ fontSize: '1.625rem' }}
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
          style={{ height: '42px' }}
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          disabled={status === 'loading'}
        />
        <Button
          onClick={handleSubscribe}
          disabled={status === 'loading'}
          size="lg"
          className="tw:bg-primary-500 tw:text-white tw:hover:bg-primary-400 tw:w-full tw:font-semibold tw:tracking-wider"
          style={{ height: '42px' }}
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
