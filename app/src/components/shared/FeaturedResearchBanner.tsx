import { useEffect, useState } from 'react';
import { Box, Card, CloseButton, Group, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const BANNER_DISMISSED_KEY = 'autumn-budget-2025-banner-dismissed';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function FeaturedResearchBanner() {
  const countryId = useCurrentCountry();
  const [visible, setVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(BANNER_DISMISSED_KEY) !== 'true';
    }
    return true;
  });

  // Budget date: November 26, 2025 at 12:30 PM UK time (GMT)
  const budgetDate = new Date('2025-11-26T12:30:00Z');
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const difference = budgetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds });
      } else {
        setTimeRemaining(null);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  // Only show for UK users
  if (countryId !== 'uk' || !visible) {
    return null;
  }

  const currentDate = new Date();

  const handleClose = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    }
  };

  const isBeforeBudget = currentDate < budgetDate;

  return (
    <Box
      style={{
        position: 'relative',
        background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[500]} 50%, #2a9d8f 100%)`,
        borderBottom: `3px solid ${colors.primary[700]}`,
        padding: `${spacing.xl} ${spacing.xl}`,
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
          Explore our latest research and tools
        </Title>

        {/* Dashboard link hidden for now */}

        {/* Countdown Timer - Only show before budget */}
        {isBeforeBudget && timeRemaining && (
          <Box
            mb={spacing['2xl']}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: spacing.xl,
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Days', value: timeRemaining.days },
              { label: 'Hours', value: timeRemaining.hours },
              { label: 'Minutes', value: timeRemaining.minutes },
              { label: 'Seconds', value: timeRemaining.seconds },
            ].map((item) => (
              <Box
                key={item.label}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: spacing.radius.feature,
                  padding: `${spacing.xl} ${spacing.xl}`,
                  minWidth: '120px',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  size={typography.fontSize['3xl']}
                  fw={typography.fontWeight.bold}
                  c={colors.white}
                  style={{
                    lineHeight: 1,
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                  }}
                >
                  {String(item.value).padStart(2, '0')}
                </Text>
                <Text
                  size={typography.fontSize.sm}
                  c={colors.white}
                  fw={typography.fontWeight.medium}
                  mt={spacing.xs}
                  style={{
                    opacity: 0.95,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                  }}
                >
                  {item.label}
                </Text>
              </Box>
            ))}
          </Box>
        )}

        {/* Autumn Budget Analysis Cards */}
        <Box>
          <Group
            justify="center"
            gap={spacing.xl}
            style={{
              flexWrap: 'wrap',
            }}
          >
            {[
              {
                href: '/uk/uk-salary-sacrifice-tool',
                title: 'Salary sacrifice cap analysis tool',
                desc: 'Revenue and distributional impacts of capping pension salary sacrifice',
              },
              {
                href: '/uk/uk-student-loan-calculator',
                title: 'Student loan deductions calculator',
                desc: 'Repayments, marginal tax rates, and lifetime costs for UK graduates',
              },
              {
                href: '/uk/scottish-budget-2026-27',
                title: 'Scottish Budget 2026-27',
                desc: 'Living standards, poverty, and local area impacts across Scotland',
              },
              {
                href: '/uk/research/uk-two-child-limit-reintroduction',
                title: 'Two-child limit reintroduction',
                desc: 'Budgetary, distributional, poverty, and inequality impacts across the UK',
              },
            ].map((card) => (
              <Card
                key={card.href}
                component="a"
                href={card.href}
                style={{
                  flex: '0 0 380px',
                  minHeight: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: spacing.radius.feature,
                  padding: spacing.lg,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                  border: `2px solid ${colors.white}`,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateY(-4px)';
                  el.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.25)';
                  el.style.backgroundColor = 'rgba(255, 255, 255, 0.35)';
                  el.style.backdropFilter = 'blur(16px)';
                  el.style.border = 'none';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  const el = e.currentTarget;
                  el.style.transform = '';
                  el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  el.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                  el.style.backdropFilter = '';
                  el.style.border = `2px solid ${colors.white}`;
                }}
              >
                <Box
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Text
                    size={typography.fontSize.lg}
                    fw={typography.fontWeight.bold}
                    c={colors.primary[700]}
                    mb={spacing.sm}
                  >
                    {card.title}
                  </Text>
                  <Text
                    size={typography.fontSize.sm}
                    c={colors.gray[700]}
                    style={{ lineHeight: 1.4 }}
                  >
                    {card.desc}
                  </Text>
                </Box>
              </Card>
            ))}
          </Group>
        </Box>

        {/* Contact CTA */}
        <Box
          mt={spacing.xl}
          style={{
            textAlign: 'center',
          }}
        >
          <Text size={typography.fontSize.lg} c={colors.white} fw={typography.fontWeight.semibold}>
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
