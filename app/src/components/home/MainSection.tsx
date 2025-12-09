import { motion } from 'framer-motion';
import { Box, Container, Stack, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function MainSection() {
  const countryId = useCurrentCountry();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <Container size="xl" py={spacing['5xl']}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Stack
          align="center"
          gap={spacing['3xl']}
          style={{
            margin: '0 auto',
            maxWidth: spacing.layout.container,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.div variants={itemVariants}>
            <Box style={{ position: 'relative' }}>
              <Title
                size={72}
                fw={typography.fontWeight.black}
                ta="center"
                style={{
                  lineHeight: 1.1,
                  fontFamily: typography.fontFamily.primary,
                  background: `linear-gradient(135deg, ${colors.primary[800]}, ${colors.primary[600]})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 4px 24px rgba(49, 151, 149, 0.1)',
                  letterSpacing: '-0.02em',
                }}
              >
                Start simulating
              </Title>
              {/* Decorative accent line */}
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: -12,
                  left: '50%',
                  width: '120px',
                  height: '4px',
                  background: `linear-gradient(90deg, transparent, ${colors.primary[500]}, transparent)`,
                  borderRadius: '2px',
                  transform: 'translateX(-50%)',
                }}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '120px', opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              />
            </Box>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Text
              size={typography.fontSize['2xl']}
              c={colors.text.primary}
              ta="center"
              fw={typography.fontWeight.medium}
              style={{
                lineHeight: 1.6,
                fontFamily: typography.fontFamily.body,
                maxWidth: '800px',
                opacity: 0.9,
              }}
            >
              <Box
                component="span"
                style={{
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.primary[700],
                }}
              >
                Free, open-source
              </Box>{' '}
              tax and benefit analysis.
              <br />
              {countryId === 'uk'
                ? 'Model policy reforms across the UK.'
                : 'Model policy reforms across all 50 states.'}
              <br />
              Power benefit access tools with accurate rules.
            </Text>
          </motion.div>
        </Stack>
      </motion.div>
    </Container>
  );
}
