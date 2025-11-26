import { useState } from 'react';
import { Box, Card, CloseButton, Group, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const BANNER_DISMISSED_KEY = 'autumn-budget-2025-banner-dismissed';

export default function AutumnBudgetBanner() {
  const countryId = useCurrentCountry();
  const [visible, setVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(BANNER_DISMISSED_KEY) !== 'true';
    }
    return true;
  });

  // Only show for UK users
  if (countryId !== 'uk' || !visible) {
    return null;
  }

  // Check if we should show the banner
  const currentDate = new Date();
  const endDate = new Date('2025-12-03'); // Show for a week after

  if (currentDate > endDate) {
    return null;
  }

  const handleClose = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    }
  };

  return (
    <Box
      style={{
        position: 'relative',
        background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[500]} 50%, #2a9d8f 100%)`,
        borderBottom: `3px solid ${colors.primary[700]}`,
        padding: `${spacing['4xl']} ${spacing.xl}`,
        fontFamily: typography.fontFamily.primary,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Background Pattern */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: `radial-gradient(circle at 20% 50%, ${colors.white} 1px, transparent 1px), radial-gradient(circle at 80% 80%, ${colors.white} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }}
      />

      {/* Close Button */}
      <CloseButton
        onClick={handleClose}
        size="lg"
        style={{
          position: 'absolute',
          top: spacing.lg,
          right: spacing.lg,
          color: colors.white,
          zIndex: 10,
        }}
        styles={{
          root: {
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            },
          },
        }}
      />

      <Box
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Main Title */}
        <Title
          order={1}
          size={typography.fontSize['3xl']}
          fw={typography.fontWeight.bold}
          c={colors.white}
          mb={spacing.xl}
          style={{
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          The Autumn Budget 2025 has been released
        </Title>

        {/* Analysis Dashboard Box */}
        <Box
          mb={spacing['2xl']}
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              borderRadius: '16px',
              padding: `${spacing.lg} ${spacing.xl}`,
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              fw={typography.fontWeight.bold}
              c={colors.white}
              style={{
                fontSize: '1.3rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
              }}
            >
              View the PolicyEngine analysis dashboard
            </Text>
          </Box>
        </Box>

        {/* Pre-Autumn Budget Analysis Cards */}
        <Box>
          <Text
            size={typography.fontSize.lg}
            c={colors.white}
            fw={typography.fontWeight.semibold}
            mb={spacing.lg}
            style={{
              textAlign: 'center',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            Pre-autumn budget analysis
          </Text>

          <Group
            justify="center"
            gap={spacing.xl}
            style={{
              flexWrap: 'wrap',
            }}
          >
            {/* Card 1: Two-Child Benefit Limit */}
            <Card
              component="a"
              href="/uk/research/uk-two-child-limit"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: '1 1 220px',
                maxWidth: '260px',
                minHeight: '80px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                padding: spacing.md,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                border: `2px solid ${colors.white}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
              styles={{
                root: {
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
                  },
                },
              }}
            >
              <Box
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <Text
                  size={typography.fontSize.base}
                  fw={typography.fontWeight.bold}
                  c={colors.primary[700]}
                  mb={spacing.xs}
                >
                  Two-child benefit limit
                </Text>
                <Text
                  size={typography.fontSize.xs}
                  c={colors.gray[700]}
                  style={{ lineHeight: 1.4 }}
                >
                  Analysis of removing the two-child limit reform
                </Text>
              </Box>
            </Card>

            {/* Card 2: VAT Thresholds */}
            <Card
              component="a"
              href="/uk/research/uk-vat-thresholds"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: '1 1 220px',
                maxWidth: '260px',
                minHeight: '80px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                padding: spacing.md,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                border: `2px solid ${colors.white}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
              styles={{
                root: {
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
                  },
                },
              }}
            >
              <Box
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <Text
                  size={typography.fontSize.base}
                  fw={typography.fontWeight.bold}
                  c={colors.primary[700]}
                  mb={spacing.xs}
                >
                  VAT thresholds
                </Text>
                <Text
                  size={typography.fontSize.xs}
                  c={colors.gray[700]}
                  style={{ lineHeight: 1.4 }}
                >
                  Impact analysis of changing VAT thresholds
                </Text>
              </Box>
            </Card>

            {/* Card 3: Income Tax & NI */}
            <Card
              component="a"
              href="/uk/research/uk-income-tax-ni-reforms-2025"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: '1 1 220px',
                maxWidth: '260px',
                minHeight: '80px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                padding: spacing.md,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                border: `2px solid ${colors.white}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
              styles={{
                root: {
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
                  },
                },
              }}
            >
              <Box
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <Text
                  size={typography.fontSize.base}
                  fw={typography.fontWeight.bold}
                  c={colors.primary[700]}
                  mb={spacing.xs}
                >
                  Income tax & NI reforms
                </Text>
                <Text
                  size={typography.fontSize.xs}
                  c={colors.gray[700]}
                  style={{ lineHeight: 1.4 }}
                >
                  Analysis of alternative tax reform options
                </Text>
              </Box>
            </Card>

            {/* Card 4: Mansion Tax */}
            <Card
              component="a"
              href="/uk/research/uk-mansion-tax-autumn-budget"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: '1 1 220px',
                maxWidth: '260px',
                minHeight: '80px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                padding: spacing.md,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                border: `2px solid ${colors.white}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
              styles={{
                root: {
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
                  },
                },
              }}
            >
              <Box
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <Text
                  size={typography.fontSize.base}
                  fw={typography.fontWeight.bold}
                  c={colors.primary[700]}
                  mb={spacing.xs}
                >
                  Mansion tax
                </Text>
                <Text
                  size={typography.fontSize.xs}
                  c={colors.gray[700]}
                  style={{ lineHeight: 1.4 }}
                >
                  Constituency distribution of high-value property sales
                </Text>
              </Box>
            </Card>
          </Group>
        </Box>

        {/* Contact CTA */}
        <Box
          mt={spacing.xl}
          style={{
            textAlign: 'center',
          }}
        >
          <Text size={typography.fontSize.lg} c={colors.white} fw={typography.fontWeight.medium}>
            Want custom analysis?{' '}
            <Text
              component="a"
              href="mailto:hello@policyengine.org"
              style={{
                color: colors.white,
                textDecoration: 'underline',
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Contact us
            </Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
