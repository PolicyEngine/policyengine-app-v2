/**
 * HomeHeader - Editorial Navigation
 *
 * A sophisticated header with editorial presence.
 * Features a subtle gradient background, refined typography,
 * and smooth hover interactions.
 */

import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import HeaderContent from '@/components/homeHeader/HeaderContent';
import { NavItemSetup } from '@/components/homeHeader/NavItem';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function HeaderNavigation() {
  const [opened, { open, close }] = useDisclosure(false);
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  const handleNavClick = (path?: string) => {
    if (path) {
      navigate(path);
      close();
    }
  };

  const navItems: NavItemSetup[] = [
    {
      label: 'Research',
      onClick: () => handleNavClick(`/${countryId}/research`),
      hasDropdown: false,
    },
    {
      label: 'About',
      onClick: () => {},
      hasDropdown: true,
      dropdownItems: [
        { label: 'Team', onClick: () => handleNavClick(`/${countryId}/team`) },
        { label: 'Supporters', onClick: () => handleNavClick(`/${countryId}/supporters`) },
      ],
    },
    {
      label: 'Donate',
      onClick: () => handleNavClick(`/${countryId}/donate`),
      hasDropdown: false,
    },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        height: spacing.layout.header,
        background: `linear-gradient(135deg, ${colors.primary[700]} 0%, ${colors.primary[600]} 100%)`,
        borderBottom: `1px solid ${colors.primary[500]}20`,
        boxShadow: `
          0 1px 3px rgba(0, 0, 0, 0.08),
          0 4px 12px rgba(0, 0, 0, 0.04),
          inset 0 1px 0 rgba(255, 255, 255, 0.06)
        `,
        zIndex: spacing.zIndex.sticky,
        fontFamily: typography.fontFamily.primary,
        opacity: opened ? 0 : 1,
        transition: 'opacity 150ms ease-out',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          height: '100%',
          paddingLeft: spacing['2xl'],
          paddingRight: spacing['2xl'],
          maxWidth: spacing.layout.content,
          margin: '0 auto',
        }}
      >
        <HeaderContent opened={opened} onOpen={open} onClose={close} navItems={navItems} />
      </div>
    </header>
  );
}
