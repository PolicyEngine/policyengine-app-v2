import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import HeaderContent from '@/components/homeHeader/HeaderContent';
import { NavItemSetup } from '@/components/homeHeader/NavItem';
import { spacing, typography } from '@/designTokens';
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
        background: 'linear-gradient(180deg, rgba(13, 43, 42, 0.95) 0%, rgba(13, 43, 42, 0.9) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(79, 209, 197, 0.1)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
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
