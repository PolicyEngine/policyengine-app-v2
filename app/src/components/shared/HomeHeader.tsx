import HeaderContent from '@/components/homeHeader/HeaderContent';
import { NavItemSetup } from '@/components/homeHeader/NavItem';
import { WEBSITE_URL } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useWebsitePath } from '@/hooks/useWebsitePath';

interface HeaderNavigationProps {
  navbarOpened?: boolean;
  onToggleNavbar?: () => void;
}

export default function HeaderNavigation({ navbarOpened, onToggleNavbar }: HeaderNavigationProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const { getWebsitePath, countryId } = useWebsitePath();

  // The model explorer, API docs, and Python docs are separate apps served via
  // Vercel rewrites — use absolute URLs so the browser performs a full
  // navigation across zones rather than routing client-side.
  const modelBase = `${WEBSITE_URL}/${countryId}/model`;

  const navItems: NavItemSetup[] = [
    {
      label: 'Research',
      href: getWebsitePath('/research'),
      hasDropdown: false,
    },
    {
      label: 'Model',
      hasDropdown: true,
      dropdownItems: [
        {
          label: 'Rules',
          href: `${modelBase}/rules`,
          children: [
            { label: 'Coverage', href: `${modelBase}/rules/coverage` },
            { label: 'Parameters', href: `${modelBase}/rules/parameters` },
            { label: 'Variables', href: `${modelBase}/rules/variables` },
          ],
        },
        {
          label: 'Data',
          href: `${modelBase}/data`,
          children: [
            { label: 'Pipeline', href: `${modelBase}/data/pipeline` },
            { label: 'Calibration', href: `${modelBase}/data/calibration` },
            { label: 'Validation', href: `${modelBase}/data/validation` },
          ],
        },
        {
          label: 'Behavioral responses',
          href: `${modelBase}/behavioral`,
        },
      ],
    },
    {
      label: 'API',
      href: `${WEBSITE_URL}/${countryId}/api`,
      hasDropdown: false,
    },
    {
      label: 'Python',
      href: `${WEBSITE_URL}/${countryId}/python`,
      hasDropdown: false,
    },
    {
      label: 'About',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Team', href: getWebsitePath('/team') },
        { label: 'Supporters', href: getWebsitePath('/supporters') },
        { label: 'Citations', href: getWebsitePath('/citations') },
        { label: 'Events', href: getWebsitePath('/events') },
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
        position: 'sticky',
        top: 0,
        padding: `${spacing.sm} ${spacing['2xl']}`,
        height: spacing.layout.header,
        background: `linear-gradient(to right, ${colors.primary[800]}, ${colors.primary[600]})`,
        borderBottom: `0.5px solid ${colors.primary[700]}`,
        boxShadow: `0px 2px 4px -1px ${colors.shadow.light}, 0px 4px 6px -1px ${colors.shadow.medium}`,
        zIndex: 1000,
        fontFamily: typography.fontFamily.primary,
        opacity: opened ? 0 : 1,
        transition: 'opacity 0.1s ease',
        width: '100%',
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
