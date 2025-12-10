import { Box } from '@mantine/core';
import ActionCards from '@/components/home/ActionCards';
import MainSection from '@/components/home/MainSection';
import OrgLogos from '@/components/home/OrgLogos';
import AutumnBudgetBanner from '@/components/shared/AutumnBudgetBanner';
import { typography } from '@/designTokens';

export default function HomePage() {
  return (
    <>
      <AutumnBudgetBanner />
      <Box
        style={{
          background: 'linear-gradient(135deg, #0d2b2a 0%, #164e4a 35%, #0d2b2a 70%, #0a1f1e 100%)',
          minHeight: '100vh',
          fontFamily: typography.fontFamily.primary,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Noise texture overlay */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Subtle grid pattern */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(79, 209, 197, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(79, 209, 197, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Floating decorative shapes */}
        <Box
          style={{
            position: 'absolute',
            top: '15%',
            right: '10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(79, 209, 197, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <Box
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '5%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(79, 209, 197, 0.06) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Accent line */}
        <Box
          style={{
            position: 'absolute',
            top: '40%',
            left: 0,
            width: '150px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(79, 209, 197, 0.3), transparent)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Content */}
        <Box style={{ position: 'relative', zIndex: 1, paddingTop: '80px' }}>
          <MainSection />
          <ActionCards />
        </Box>

        <OrgLogos />
      </Box>
    </>
  );
}
