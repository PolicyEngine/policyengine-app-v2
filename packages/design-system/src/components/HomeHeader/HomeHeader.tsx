import { useDisclosure } from '@mantine/hooks';
import { colors, spacing, typography } from '../../tokens';
import { HeaderContent } from './HeaderContent';
import { HomeHeaderProps } from './types';

/**
 * PolicyEngine header navigation component.
 *
 * This is a "dumb" component that receives all data via props.
 * Apps should create a wrapper that:
 * - Calls useCurrentCountry() to get the current country
 * - Calls useNavigate() to handle navigation
 * - Configures navItems with navigation callbacks
 * - Passes everything to this component
 *
 * @example
 * ```tsx
 * function AppHeader() {
 *   const countryId = useCurrentCountry();
 *   const navigate = useNavigate();
 *   const location = useLocation();
 *
 *   const navItems = [
 *     { label: 'Research', onClick: () => navigate(`/${countryId}/research`), hasDropdown: false },
 *     // ...
 *   ];
 *
 *   const handleCountryChange = (newCountryId: string) => {
 *     const pathParts = location.pathname.split('/').filter(Boolean);
 *     pathParts[0] = newCountryId;
 *     navigate(`/${pathParts.join('/')}`);
 *   };
 *
 *   return (
 *     <HomeHeader
 *       countryId={countryId}
 *       websiteUrl="https://policyengine.org"
 *       navItems={navItems}
 *       countries={[{ id: 'us', label: 'United States' }, { id: 'uk', label: 'United Kingdom' }]}
 *       onCountryChange={handleCountryChange}
 *     />
 *   );
 * }
 * ```
 */
export function HomeHeader({
  countryId,
  websiteUrl,
  navItems,
  countries,
  onCountryChange,
}: HomeHeaderProps) {
  const [opened, { open, close }] = useDisclosure(false);

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
      <HeaderContent
        opened={opened}
        onOpen={open}
        onClose={close}
        navItems={navItems}
        countryId={countryId}
        websiteUrl={websiteUrl}
        countries={countries}
        onCountryChange={onCountryChange}
      />
    </div>
  );
}
