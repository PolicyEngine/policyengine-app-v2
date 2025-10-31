import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import HeaderContent from '@/components/home-header/HeaderContent';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

interface NavLink {
  label: string;
  path?: string;
}

interface HeaderNavigationProps {
  enableScrollAnimation?: boolean;
}

export default function HeaderNavigation({ enableScrollAnimation = false }: HeaderNavigationProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const navigate = useNavigate();
  const countryId = useCurrentCountry();
  const { scrollY } = useScroll();

  // Smooth scroll-linked animations - only enabled when prop is true
  // Maps scroll position 0-50px to smooth transitions
  const marginTop = enableScrollAnimation
    ? useTransform(scrollY, [0, 50], ['32px', '0px'])
    : undefined;
  const width = enableScrollAnimation ? useTransform(scrollY, [0, 50], ['85%', '100%']) : undefined;
  const borderRadius = enableScrollAnimation
    ? useTransform(scrollY, [0, 50], ['8px', '0px'])
    : undefined;

  const aboutLinks: NavLink[] = [
    { label: 'Team', path: `/${countryId}/team` },
    { label: 'Supporters', path: `/${countryId}/supporters` },
  ];

  const navLinks: NavLink[] = [{ label: 'Donate', path: `/${countryId}/donate` }];

  const handleNavClick = (path?: string) => {
    if (path) {
      navigate(path);
      close();
    }
  };

  // Common styles shared between both variants
  // Padding set to 24px to match Mantine AppShell.Main padding
  const commonStyles = {
    position: 'sticky' as const,
    top: 0,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingLeft: '24px',
    paddingRight: '24px',
    height: spacing.layout.header,
    backgroundColor: colors.primary[600],
    borderBottom: `0.5px solid ${colors.border.dark}`,
    boxShadow: `
      0px 2px 4px -1px rgba(0, 0, 0, 0.06),
      0px 4px 6px -1px rgba(0, 0, 0, 0.10)
    `,
    zIndex: 1000,
    fontFamily: typography.fontFamily.primary,
    opacity: opened ? 0 : 1,
    transition: 'opacity 0.1s ease',
  };

  // Render animated version with motion.div
  if (enableScrollAnimation) {
    return (
      <motion.div
        style={{
          ...commonStyles,
          marginTop,
          marginLeft: 'auto',
          marginRight: 'auto',
          width,
          borderRadius,
        }}
      >
        <HeaderContent
          opened={opened}
          onOpen={open}
          onClose={close}
          navLinks={navLinks}
          aboutLinks={aboutLinks}
          onNavClick={handleNavClick}
        />
      </motion.div>
    );
  }

  // Render static version with regular div
  return (
    <div
      style={{
        ...commonStyles,
        marginTop: '0px',
        marginLeft: '0px',
        marginRight: '0px',
        width: '100%',
        borderRadius: '0px',
      }}
    >
      <HeaderContent
        opened={opened}
        onOpen={open}
        onClose={close}
        navLinks={navLinks}
        aboutLinks={aboutLinks}
        onNavClick={handleNavClick}
      />
    </div>
  );
}
