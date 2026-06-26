import { motion } from 'framer-motion';
import { CALCULATOR_URL } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const ctaVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, type: 'spring' as const, stiffness: 80, damping: 18 },
  },
};

export default function HeroCTA() {
  const countryId = useCurrentCountry();

  return (
    <motion.div
      variants={ctaVariant}
      style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
      }}
    >
      <motion.a
        href={`${CALCULATOR_URL}/${countryId}/reports`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'inline-block',
          background: colors.primary[500],
          color: colors.white,
          padding: `${spacing.lg} ${spacing['3xl']}`,
          borderRadius: 40,
          fontFamily: typography.fontFamily.primary,
          fontWeight: typography.fontWeight.semibold,
          fontSize: typography.fontSize.lg,
          textDecoration: 'none',
          boxShadow: `0 2px 12px ${colors.primary.alpha[40]}`,
          transition: 'box-shadow 0.3s ease',
        }}
      >
        Enter PolicyEngine
      </motion.a>
    </motion.div>
  );
}
