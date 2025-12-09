import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Box, SimpleGrid, Stack, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

interface StatItemProps {
  value: number;
  label: string;
  delay: number;
  suffix?: string;
}

function StatItem({ value, label, delay, suffix = '' }: StatItemProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) {
      return;
    }

    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Stack gap={spacing.xs} align="center">
        <Box
          style={{
            position: 'relative',
            padding: spacing.xl,
            background: `linear-gradient(135deg, ${colors.primary[500]}10, ${colors.primary[400]}05)`,
            borderRadius: spacing.radius.lg,
            border: `1px solid ${colors.primary[300]}40`,
            backdropFilter: 'blur(8px)',
            minWidth: '160px',
          }}
        >
          <Text
            size="48px"
            fw={typography.fontWeight.black}
            c={colors.primary[700]}
            ta="center"
            style={{
              fontFamily: typography.fontFamily.primary,
              lineHeight: 1,
              textShadow: `0 2px 12px ${colors.primary[200]}60`,
            }}
          >
            {displayValue.toLocaleString()}
            {suffix}
          </Text>
        </Box>
        <Text
          size={typography.fontSize.md}
          c={colors.text.secondary}
          ta="center"
          fw={typography.fontWeight.medium}
          style={{
            fontFamily: typography.fontFamily.primary,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </Stack>
    </motion.div>
  );
}

export default function AnimatedStats() {
  return (
    <Box py={spacing['5xl']} style={{ position: 'relative', zIndex: 1 }}>
      <SimpleGrid
        cols={{ base: 1, sm: 2, md: 4 }}
        spacing={spacing['2xl']}
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: `0 ${spacing.xl}`,
        }}
      >
        <StatItem value={50} label="States Covered" delay={0.1} suffix="+" />
        <StatItem value={1000} label="Policy Options" delay={0.2} suffix="+" />
        <StatItem value={100} label="Open Source" delay={0.3} suffix="%" />
        <StatItem value={2024} label="Tax Year" delay={0.4} />
      </SimpleGrid>
    </Box>
  );
}
