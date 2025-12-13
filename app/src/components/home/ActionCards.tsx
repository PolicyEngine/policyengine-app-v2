import { useNavigate } from 'react-router-dom';
import { Box, Center, Container, Group } from '@mantine/core';
import { spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function ActionCards() {
  const countryId = useCurrentCountry();
  const navigate = useNavigate();

  return (
    <Container size="xl" pb={spacing['4xl']}>
      <Center>
        <Box
          style={{
            opacity: 0,
            animation: 'fadeInUp 1s ease-out 0.4s forwards',
          }}
        >
          <Group gap="lg">
            {/* Primary CTA */}
            <button
              type="button"
              onClick={() => navigate(`/${countryId}/reports`)}
              style={{
                background: 'linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%)',
                color: '#0d2b2a',
                border: 'none',
                borderRadius: '8px',
                padding: '16px 32px',
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                fontFamily: typography.fontFamily.primary,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(79, 209, 197, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(79, 209, 197, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(79, 209, 197, 0.3)';
              }}
            >
              Enter PolicyEngine
            </button>

            {/* Secondary CTA */}
            <button
              type="button"
              onClick={() => navigate(`/${countryId}/research`)}
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: '1px solid rgba(79, 209, 197, 0.4)',
                borderRadius: '8px',
                padding: '16px 32px',
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.medium,
                fontFamily: typography.fontFamily.primary,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(79, 209, 197, 0.8)';
                e.currentTarget.style.background = 'rgba(79, 209, 197, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(79, 209, 197, 0.4)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              View Research
            </button>
          </Group>
        </Box>
      </Center>
    </Container>
  );
}
