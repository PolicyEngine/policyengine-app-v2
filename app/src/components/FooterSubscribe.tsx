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
    <Stack gap="xs" className="tw:pl-2xl">
      <p className="tw:font-semibold tw:text-2xl tw:text-white tw:font-sans">
        Subscribe to PolicyEngine
      </p>
      <p className="tw:text-lg tw:text-white tw:font-sans">
        Get the latest posts delivered right to your inbox.
      </p>
      <Stack gap="sm" className="tw:w-4/5 tw:mt-5">
        <Input
          placeholder="Enter your email address"
          className="tw:bg-white tw:flex-1"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          disabled={status === 'loading'}
        />
        <Button onClick={handleSubscribe} disabled={status === 'loading'}>
          {status === 'loading' ? <Spinner size="sm" /> : null}
          SUBSCRIBE
        </Button>
        {message && (
          <p
            className={cn(
              'tw:text-sm tw:text-center tw:font-sans',
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
