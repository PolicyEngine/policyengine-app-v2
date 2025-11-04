import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import HeaderContent from '@/components/home-header/HeaderContent';
import { NavItemSetup } from '@/components/home-header/NavItem';
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
      label: 'Home',
      onClick: () => handleNavClick(`/${countryId}`),
      hasDropdown: false,
    },
    {
      label: 'Research',
      onClick: () => handleNavClick(`/${countryId}/research`),
      hasDropdown: false,
    },
    {
      label: 'About',
      onClick: () => {}, // No-op for dropdown parent
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
    <div
      style={{
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
        marginTop: '0px',
        marginLeft: '0px',
        marginRight: '0px',
        width: '100%',
        borderRadius: '0px',
      }}
    >
      <HeaderContent opened={opened} onOpen={open} onClose={close} navItems={navItems} />
    </div>
  );
}
