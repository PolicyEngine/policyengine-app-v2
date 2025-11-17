import { Box, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import ActionCards from '@/components/home/ActionCards';
import MainSection from '@/components/home/MainSection';
import OrgLogos from '@/components/home/OrgLogos';
import TransformationStatement from '@/components/home/TransformationStatement';
import { orgData } from '@/data/organizations';
import { colors, spacing, typography } from '@/designTokens';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Box
      style={{
        backgroundImage: `linear-gradient(180deg, ${colors.primary[50]}, #f2fcfaff, ${colors.white})`,
        minHeight: '100vh',
        fontFamily: typography.fontFamily.primary,
        position: 'relative',
      }}
    >
      {/* TEMPORARY: Blog Test Button */}
      <Box
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <Button onClick={() => navigate('blog-test')} color="red" size="lg">
          TEST BLOG
        </Button>
      </Box>

      <Box pt={spacing['4xl']}>
        <MainSection />
        <ActionCards />
        <TransformationStatement />
      </Box>
      <OrgLogos logos={orgData} />
    </Box>
  );
}
