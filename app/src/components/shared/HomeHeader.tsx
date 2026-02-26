import { useDisclosure } from '@mantine/hooks';
import HeaderContent from '@/components/homeHeader/HeaderContent';
import { NavItemSetup } from '@/components/homeHeader/NavItem';
import { colors, spacing, typography } from '@/designTokens';
import { useWebsitePath } from '@/hooks/useWebsitePath';

interface HeaderNavigationProps {
  navbarOpened?: boolean;
  onToggleNavbar?: () => void;
}

export default function HeaderNavigation({ navbarOpened, onToggleNavbar }: HeaderNavigationProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const { getWebsitePath } = useWebsitePath();

  const navItems: NavItemSetup[] = [
    {
      label: 'Research',
      href: getWebsitePath('/research'),
      hasDropdown: false,
    },
    {
      label: 'Model',
      href: getWebsitePath('/model'),
      hasDropdown: false,
    },
    {
      label: 'About',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Team', href: getWebsitePath('/team') },
        { label: 'Supporters', href: getWebsitePath('/supporters') },
      ],
    },
    {
      label: 'Donate',
      href: getWebsitePath('/donate'),
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
        borderRadius: spacing.radius.none,
      }}
    >
      <HeaderContent
        opened={opened}
        onOpen={open}
        onClose={close}
        navItems={navItems}
        navbarOpened={navbarOpened}
        onToggleNavbar={onToggleNavbar}
      />
    </div>
  );
}
