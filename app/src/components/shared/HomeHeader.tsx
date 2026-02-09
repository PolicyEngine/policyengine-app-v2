import { useDisclosure } from '@mantine/hooks';
import HeaderContent from '@/components/homeHeader/HeaderContent';
import { NavItemSetup } from '@/components/homeHeader/NavItem';
import { WEBSITE_URL } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function HeaderNavigation() {
  const [opened, { open, close }] = useDisclosure(false);
  const countryId = useCurrentCountry();

  // Nav items link to the website (policyengine.org), not the calculator
  const navItems: NavItemSetup[] = [
    {
      label: 'Research',
      href: `${WEBSITE_URL}/${countryId}/research`,
      hasDropdown: false,
    },
    {
      label: 'Tools',
      href: `${WEBSITE_URL}/${countryId}/tools`,
      hasDropdown: false,
    },
    {
      label: 'Analysis',
      href: `${WEBSITE_URL}/${countryId}/analysis`,
      hasDropdown: false,
    },
    {
      label: 'About',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Team', href: `${WEBSITE_URL}/${countryId}/team` },
        { label: 'Supporters', href: `${WEBSITE_URL}/${countryId}/supporters` },
      ],
    },
    {
      label: 'Donate',
      href: `${WEBSITE_URL}/${countryId}/donate`,
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
