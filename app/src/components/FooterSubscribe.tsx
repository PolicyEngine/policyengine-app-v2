/**
 * FooterSubscribe - Editorial Newsletter Signup
 *
 * Refined newsletter subscription form with elegant styling
 * and smooth state transitions.
 */

import { useState } from 'react';
import { IconArrowRight, IconCheck } from '@tabler/icons-react';
import { Box, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { submitToMailchimp } from '@/utils/mailchimpSubscription';

export default function FooterSubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isHovered, setIsHovered] = useState(false);

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
    <Box>
      {/* Section Label */}
      <Text
        style={{
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.semibold,
          letterSpacing: typography.letterSpacing.widest,
          textTransform: 'uppercase',
          color: colors.primary[400],
          marginBottom: spacing.lg,
        }}
      >
        Stay Informed
      </Text>

      {/* Headline */}
      <Text
        style={{
          fontFamily: typography.fontFamily.display,
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.medium,
          color: colors.white,
          lineHeight: 1.3,
          marginBottom: spacing.sm,
        }}
      >
        Subscribe to our newsletter
      </Text>

      {/* Description */}
      <Text
        style={{
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize.sm,
          color: colors.white,
          opacity: 0.7,
          lineHeight: 1.5,
          marginBottom: spacing.xl,
        }}
      >
        Get the latest policy research and updates delivered to your inbox.
      </Text>

      {/* Form */}
      <Stack gap={spacing.md}>
        <Box
          style={{
            display: 'flex',
            gap: spacing.sm,
            maxWidth: '400px',
          }}
        >
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            disabled={status === 'loading'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubscribe();
              }
            }}
            styles={{
              root: {
                flex: 1,
              },
              input: {
                fontFamily: typography.fontFamily.primary,
                fontSize: typography.fontSize.sm,
                backgroundColor: `${colors.white}10`,
                border: `1px solid ${colors.white}20`,
                color: colors.white,
                padding: `${spacing.md} ${spacing.lg}`,
                borderRadius: spacing.radius.lg,
                height: 'auto',
                transition: 'all 200ms ease',
                '&::placeholder': {
                  color: `${colors.white}50`,
                },
                '&:focus': {
                  backgroundColor: `${colors.white}15`,
                  borderColor: colors.primary[400],
                },
              },
            }}
          />

          <UnstyledButton
            onClick={handleSubscribe}
            disabled={status === 'loading'}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `${spacing.md} ${spacing.lg}`,
              backgroundColor: isHovered ? colors.accent[500] : colors.accent[400],
              borderRadius: spacing.radius.lg,
              transition: 'all 200ms ease',
              transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
              cursor: status === 'loading' ? 'wait' : 'pointer',
              opacity: status === 'loading' ? 0.7 : 1,
            }}
          >
            {status === 'success' ? (
              <IconCheck size={20} color={colors.secondary[900]} />
            ) : (
              <IconArrowRight
                size={20}
                color={colors.secondary[900]}
                style={{
                  transition: 'transform 200ms ease',
                  transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                }}
              />
            )}
          </UnstyledButton>
        </Box>

        {/* Status Message */}
        {message && (
          <Text
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: typography.fontSize.sm,
              color: status === 'success' ? colors.primary[300] : colors.error,
            }}
          >
            {message}
          </Text>
        )}
      </Stack>
    </Box>
  );
}
