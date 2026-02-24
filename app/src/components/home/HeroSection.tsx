import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import HeroCTA from './HeroCTA';
import HouseholdGraph, {
  generateGraph,
  generateImpactForPrompt,
  ImpactState,
} from './HouseholdGraph';
import TypewriterPrompt, { PromptData } from './TypewriterPrompt';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;

const orchestrator = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const instantOrchestrator = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0,
      delayChildren: 0,
    },
  },
};

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const countryId = useCurrentCountry();
  const [impact, setImpact] = useState<ImpactState | null>(null);
  const impactTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const nodes = useMemo(() => generateGraph(), []);

  const handlePromptComplete = useCallback(
    (promptIndex: number, distribution: PromptData) => {
      impactTimer.current = setTimeout(() => {
        setImpact(
          generateImpactForPrompt(promptIndex, nodes, distribution.winnerPct, distribution.loserPct)
        );
      }, 500);
    },
    [nodes]
  );

  const handlePromptClearing = useCallback(() => {
    if (impactTimer.current) {
      clearTimeout(impactTimer.current);
    }
    setImpact(null);
  }, []);

  const subtitle =
    countryId === 'uk'
      ? 'Free, open-source tax and benefit analysis. Model policy reforms across the UK.'
      : 'Free, open-source tax and benefit analysis. Model policy reforms across all 50 states.';

  return (
    <motion.div
      variants={shouldReduceMotion ? instantOrchestrator : orchestrator}
      initial="hidden"
      animate="visible"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing['2xl'],
        padding: `${spacing['5xl']} ${spacing.xl}`,
        background: colors.white,
        overflow: 'hidden',
      }}
    >
      <HouseholdGraph nodes={nodes} impact={impact} />

      {/* Headline */}
      <motion.h1
        variants={fadeIn}
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize: 'clamp(32px, 5.5vw, 52px)',
          fontWeight: typography.fontWeight.bold,
          color: colors.primary[800],
          fontFamily: typography.fontFamily.primary,
          lineHeight: 1.1,
          margin: 0,
          textAlign: 'center',
          letterSpacing: '-0.02em',
        }}
      >
        PolicyEngine
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        variants={fadeIn}
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize: 'clamp(16px, 2.5vw, 22px)',
          fontWeight: typography.fontWeight.normal,
          color: colors.text.secondary,
          fontFamily: typography.fontFamily.primary,
          lineHeight: 1.5,
          margin: 0,
          textAlign: 'center',
          maxWidth: 580,
          padding: `0 ${spacing.lg}`,
        }}
      >
        {subtitle}
      </motion.p>

      {/* Typewriter prompt */}
      <motion.div variants={fadeIn}>
        <TypewriterPrompt
          countryId={countryId}
          onPromptComplete={handlePromptComplete}
          onPromptClearing={handlePromptClearing}
        />
      </motion.div>

      {/* Call to action */}
      <HeroCTA />

      {/* Bottom fade */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          background: `linear-gradient(to bottom, transparent, ${colors.white})`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </motion.div>
  );
}
