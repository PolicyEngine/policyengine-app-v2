import { useState } from 'react';
import { Button, Stack, Text, TextInput } from '@mantine/core';
import { colors, typography } from '@/designTokens';
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
      <Text
        fw={600}
        fz="h2"
        ff={typography.fontFamily.primary}
        style={{ color: 'rgba(255, 255, 255, 0.95)' }}
      >
        Subscribe to PolicyEngine
      </Text>
      <Text
        fz="h5"
        ff={typography.fontFamily.primary}
        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
      >
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
            input: {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(79, 209, 197, 0.3)',
              color: '#ffffff',
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)',
              },
              '&:focus': {
                borderColor: '#4FD1C5',
              },
            },
          }}
          disabled={status === 'loading'}
        />
        <Button
          size="md"
          ff={typography.fontFamily.primary}
          onClick={handleSubscribe}
          loading={status === 'loading'}
          disabled={status === 'loading'}
          style={{
            background: 'linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%)',
            color: '#0d2b2a',
            fontWeight: 600,
            border: 'none',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(79, 209, 197, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
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
