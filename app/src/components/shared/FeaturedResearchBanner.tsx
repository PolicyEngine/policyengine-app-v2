import { useState } from 'react';
import { IconArrowRight, IconX } from '@tabler/icons-react';
import { Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const BANNER_DISMISSED_KEY = 'featured-research-banner-dismissed';

export default function FeaturedResearchBanner() {
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

  const handleClose = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    }
  };

  const cards = [
    {
      href: '/uk/spring-statement-2026',
      title: 'Spring Statement 2026 analysis',
      desc: 'New OBR forecast and its effects on UK living standards',
    },
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
  ];

  return (
    <div
      className="tw:relative tw:overflow-hidden"
      style={{
        background: `linear-gradient(to right, ${colors.primary[800]}, ${colors.primary[600]})`,
        padding: `${spacing['2xl']} ${spacing.xl}`,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        className="tw:absolute tw:bg-transparent tw:border-none tw:cursor-pointer tw:p-2 tw:rounded-md tw:hover:bg-white/10 tw:transition-colors tw:duration-150 tw:z-10"
        style={{
          top: spacing.md,
          right: spacing.md,
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        <IconX size={18} />
      </button>

      <div
        className="tw:relative tw:z-[1]"
        style={{
          maxWidth: spacing.layout.content,
          margin: '0 auto',
        }}
      >
        {/* Title */}
        <Text
          style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.semibold,
            color: colors.white,
            marginBottom: spacing.xl,
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          Explore our latest research and tools
        </Text>

        {/* Research cards */}
        <div
          className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-4"
          style={{ gap: spacing.md }}
        >
          {cards.map((card) => (
            <a
              key={card.href}
              href={card.href}
              className="tw:no-underline tw:transition-all tw:duration-200 tw:hover:-translate-y-0.5"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '12px',
                padding: spacing.lg,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              <div>
                <Text
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.white,
                    marginBottom: spacing.xs,
                    lineHeight: typography.lineHeight.snug,
                  }}
                >
                  {card.title}
                </Text>
                <Text
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: typography.lineHeight.normal,
                  }}
                >
                  {card.desc}
                </Text>
              </div>
              <div
                className="tw:flex tw:items-center tw:mt-3"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                <IconArrowRight size={16} />
              </div>
            </a>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="tw:text-center" style={{ marginTop: spacing.xl }}>
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            Want custom analysis?{' '}
            <a
              href="mailto:hello@policyengine.org"
              className="tw:underline tw:transition-opacity tw:duration-150 tw:hover:opacity-80"
              style={{
                color: colors.white,
                fontWeight: typography.fontWeight.medium,
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
