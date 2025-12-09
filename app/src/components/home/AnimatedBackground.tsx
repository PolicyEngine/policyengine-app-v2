import { motion } from 'framer-motion';
import { Box } from '@mantine/core';
import { colors } from '@/designTokens';

export default function AnimatedBackground() {
  return (
    <Box
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Main gradient background with animation */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          right: '-50%',
          bottom: '-50%',
          background: `radial-gradient(circle at 30% 20%, ${colors.primary[100]}40, transparent 50%),
                       radial-gradient(circle at 80% 80%, ${colors.blue[100]}30, transparent 50%),
                       radial-gradient(circle at 50% 50%, ${colors.primary[50]}60, transparent 70%)`,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Floating geometric shapes */}
      {[...Array(8)].map((_, i) => {
        const size = 40 + Math.random() * 120;
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const isCircle = Math.random() > 0.5;

        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: `${startX}%`,
              top: `${startY}%`,
              width: size,
              height: size,
              borderRadius: isCircle ? '50%' : '8px',
              background: `linear-gradient(135deg, ${colors.primary[200]}30, ${colors.primary[400]}20)`,
              border: `1px solid ${colors.primary[300]}40`,
              backdropFilter: 'blur(2px)',
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              rotate: [0, 180, 360],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10 + Math.random() * 15,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeInOut',
            }}
          />
        );
      })}

      {/* Grid pattern overlay */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `linear-gradient(${colors.primary[300]}10 1px, transparent 1px),
                           linear-gradient(90deg, ${colors.primary[300]}10 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          opacity: 0.3,
        }}
      />

      {/* Noise texture for depth */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      />
    </Box>
  );
}
