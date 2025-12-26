import { Container, Group } from '@mantine/core';
import { CountrySelector } from './CountrySelector';
import { DesktopNavigation } from './DesktopNavigation';
import { HeaderLogo } from './HeaderLogo';
import { MobileMenu } from './MobileMenu';
import { Country, NavItemSetup } from './types';

interface HeaderContentProps {
  opened: boolean;
  onOpen: () => void;
  onClose: () => void;
  navItems: NavItemSetup[];
  countryId: string;
  websiteUrl: string;
  countries: Country[];
  onCountryChange: (countryId: string) => void;
}

export function HeaderContent({
  opened,
  onOpen,
  onClose,
  navItems,
  countryId,
  websiteUrl,
  countries,
  onCountryChange,
}: HeaderContentProps) {
  return (
    <Container
      h="100%"
      p={0}
      m={0}
      style={{
        width: '100%',
        maxWidth: '100%',
        marginInlineStart: 0,
        marginInlineEnd: 0,
      }}
    >
      <Group justify="space-between" h="100%">
        <Group>
          <HeaderLogo countryId={countryId} websiteUrl={websiteUrl} />
          <DesktopNavigation navItems={navItems} />
        </Group>

        <Group visibleFrom="lg">
          <CountrySelector
            currentCountryId={countryId}
            countries={countries}
            onCountryChange={onCountryChange}
          />
        </Group>

        <MobileMenu
          opened={opened}
          onOpen={onOpen}
          onClose={onClose}
          navItems={navItems}
          currentCountryId={countryId}
          countries={countries}
          onCountryChange={onCountryChange}
        />
      </Group>
    </Container>
  );
}
