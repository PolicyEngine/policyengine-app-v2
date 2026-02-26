import { useEffect, useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { Text, Title } from '@/components/ui';
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
    <div
      className="tw:relative tw:overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[500]} 50%, #2a9d8f 100%)`,
        borderBottom: `3px solid ${colors.primary[700]}`,
        padding: `${spacing.xl} ${spacing.xl}`,
        fontFamily: typography.fontFamily.primary,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Decorative Background Pattern */}
      <div
        className="tw:absolute tw:inset-0 tw:pointer-events-none"
        style={{
          opacity: 0.05,
          backgroundImage: `radial-gradient(circle at 20% 50%, ${colors.white} 1px, transparent 1px), radial-gradient(circle at 80% 80%, ${colors.white} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Close Button */}
      <button
        type="button"
        onClick={handleClose}
        className="tw:absolute tw:bg-transparent tw:border-none tw:cursor-pointer tw:p-2 tw:rounded tw:hover:bg-white/15 tw:z-10"
        style={{
          top: spacing.lg,
          right: spacing.lg,
          color: colors.white,
        }}
      >
        <IconX size={20} />
      </button>

      <div
        className="tw:relative tw:z-[1]"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Main Title */}
        <Title
          order={1}
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.white,
            marginBottom: spacing.xl,
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          Explore our latest research and tools
        </Title>

        {/* Countdown Timer - Only show before budget */}
        {isBeforeBudget && timeRemaining && (
          <div
            className="tw:flex tw:justify-center tw:flex-wrap"
            style={{
              marginBottom: spacing['2xl'],
              gap: spacing.xl,
            }}
          >
            {[
              { label: 'Days', value: timeRemaining.days },
              { label: 'Hours', value: timeRemaining.hours },
              { label: 'Minutes', value: timeRemaining.minutes },
              { label: 'Seconds', value: timeRemaining.seconds },
            ].map((item) => (
              <div
                key={item.label}
                className="tw:flex tw:flex-col tw:items-center tw:justify-center"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: spacing.radius.feature,
                  padding: `${spacing.xl} ${spacing.xl}`,
                  minWidth: '120px',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Text
                  style={{
                    fontSize: typography.fontSize['3xl'],
                    fontWeight: typography.fontWeight.bold,
                    color: colors.white,
                    lineHeight: 1,
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                  }}
                >
                  {String(item.value).padStart(2, '0')}
                </Text>
                <Text
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.white,
                    fontWeight: typography.fontWeight.medium,
                    marginTop: spacing.xs,
                    opacity: 0.95,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                  }}
                >
                  {item.label}
                </Text>
              </div>
            ))}
          </div>
        )}

        {/* Autumn Budget Analysis Cards */}
        <div>
          <div className="tw:flex tw:justify-center tw:flex-wrap" style={{ gap: spacing.xl }}>
            {[
              {
                href: '/uk/research/uk-two-child-limit-reintroduction',
                title: 'Two-child limit reintroduction',
                desc: 'Budgetary, distributional, poverty, and inequality impacts across the UK',
              },
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
            ].map((card) => (
              <a
                key={card.href}
                href={card.href}
                className="tw:no-underline tw:transition-all tw:duration-300 tw:hover:-translate-y-1 tw:hover:shadow-lg"
                style={{
                  flex: '1 1 0',
                  maxWidth: '320px',
                  minHeight: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: spacing.radius.feature,
                  padding: spacing.lg,
                  cursor: 'pointer',
                  border: `2px solid ${colors.white}`,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-center tw:h-full">
                  <Text
                    style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.primary[700],
                      marginBottom: spacing.sm,
                    }}
                  >
                    {card.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.gray[700],
                      lineHeight: 1.4,
                    }}
                  >
                    {card.desc}
                  </Text>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="tw:text-center" style={{ marginTop: spacing.xl }}>
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              color: colors.white,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            Want custom analysis?{' '}
            <a
              href="mailto:hello@policyengine.org"
              className="tw:underline tw:transition-opacity tw:duration-200 tw:hover:opacity-80"
              style={{
                color: colors.white,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
              }}
            >
              Contact us
            </a>
          </Text>
        </div>
      </div>
    </div>
  );
}
