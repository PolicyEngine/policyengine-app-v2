import { useState } from 'react';
import { Button, Stack, Text, TextInput } from '@mantine/core';
import { colors, typography } from '@policyengine/design-system';
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
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          styles={{
            input: { backgroundColor: colors.white, flex: 1 },
          }}
          disabled={status === 'loading'}
        />
        <Button
          color={colors.primary[500]}
          size="md"
          ff={typography.fontFamily.primary}
          onClick={handleSubscribe}
          loading={status === 'loading'}
          disabled={status === 'loading'}
        >
          SUBSCRIBE
        </Button>
        {message && (
          <Text
            fz="sm"
            c={status === 'success' ? colors.success : colors.error}
            ff={typography.fontFamily.primary}
            ta="center"
          >
            {message}
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
